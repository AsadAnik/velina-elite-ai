import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PollinationsProvider } from './providers/pollinations.provider';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatMessage } from './interfaces/llm-provider.interface';

export interface ChatResponse {
  reply: string;
  productIds: number[];
  products: any[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmProvider: PollinationsProvider,
  ) {}

  async processChat(dto: ChatRequestDto): Promise<ChatResponse> {
    const userQuery = dto.message.trim();

    // Step 1: Database Grounding - Retrieve Store Policies & Catalog
    const [shipping, settings, matchedProducts] = await Promise.all([
      this.getShippingContext(),
      this.getSiteSettingsContext(),
      this.searchProducts(userQuery),
    ]);

    // Step 2: Assemble System Prompt with Injected Store Knowledge
    const systemPrompt = this.buildSystemPrompt(shipping, settings, matchedProducts);

    // Step 3: Format Multi-turn Chat History
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (dto.history && dto.history.length > 0) {
      // Keep last 6 exchanges to maintain context without overloading token limit
      const recentHistory = dto.history.slice(-6);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      }
    }

    messages.push({ role: 'user', content: userQuery });

    // Step 4: Call LLM Provider with Fallback Strategy
    let rawReply = '';
    try {
      rawReply = await this.llmProvider.generateCompletion({
        messages,
        model: 'openai', // Pollinations free GPT-4o-mini equivalent
      });
    } catch (error) {
      this.logger.warn(`AI Provider failed, generating local fallback response: ${error}`);
      rawReply = this.generateLocalFallback(userQuery, matchedProducts, shipping);
    }

    // Step 5: Parse Structured Product Recommendations
    const { cleanReply, productIds } = this.extractProductRecommendations(rawReply, matchedProducts);

    // Step 6: Map to Full Product Entities for UI Cards
    const recommendedProductCards = await this.prisma.product.findMany({
      where: {
        id: { in: productIds.length > 0 ? productIds : matchedProducts.slice(0, 3).map((p) => p.id) },
        status: 'active',
      },
      include: {
        category: true,
        sub_category: true,
        ratings: true,
      },
    });

    return {
      reply: cleanReply,
      productIds,
      products: recommendedProductCards,
    };
  }

  /**
   * Database Grounding: Real-time Shipping Context
   */
  private async getShippingContext(): Promise<string> {
    try {
      const shipping = await this.prisma.shippingCost.findFirst({
        orderBy: { id: 'desc' },
      });

      if (!shipping) {
        return 'Inside Dhaka: ৳70 (24-48 hours), Outside Dhaka: ৳130 (2-3 business days). Cash on Delivery available.';
      }

      return `Inside Dhaka: ${shipping.currency_symbol}${shipping.inside_dhaka_cost} (24-48 hours), Outside Dhaka: ${shipping.currency_symbol}${shipping.outside_dhaka_cost} (2-3 business days). Cash on Delivery is available nationwide.`;
    } catch {
      return 'Inside Dhaka: ৳70, Outside Dhaka: ৳130. Cash on delivery available.';
    }
  }

  /**
   * Database Grounding: Site Settings Context
   */
  private async getSiteSettingsContext(): Promise<string> {
    try {
      const setting = await this.prisma.siteSetting.findFirst({
        orderBy: { id: 'desc' },
      });
      return `Store Name: ${setting?.site_name || 'Velina Elite'}, WhatsApp Support: +${setting?.whatsapp_number || '8801347375533'}`;
    } catch {
      return 'Store Name: Velina Elite, WhatsApp Support: +8801347375533';
    }
  }

  /**
   * Database Grounding: Relevant Product Search
   */
  private async searchProducts(query: string): Promise<any[]> {
    const cleanTokens = query
      .toLowerCase()
      .replace(/[^\w\s\u0980-\u09FF]/gi, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    let whereClause: any = { status: 'active' };

    if (cleanTokens.length > 0) {
      whereClause = {
        status: 'active',
        OR: cleanTokens.flatMap((token) => [
          { title: { contains: token, mode: 'insensitive' } },
          { description: { contains: token, mode: 'insensitive' } },
          { category: { name: { contains: token, mode: 'insensitive' } } },
          { sub_category: { name: { contains: token, mode: 'insensitive' } } },
        ]),
      };
    }

    try {
      let products = await this.prisma.product.findMany({
        where: whereClause,
        take: 6,
        include: {
          category: true,
          sub_category: true,
        },
        orderBy: { created_at: 'desc' },
      });

      // If no exact keyword match found, provide latest active products for context
      if (products.length === 0) {
        products = await this.prisma.product.findMany({
          where: { status: 'active' },
          take: 4,
          include: {
            category: true,
            sub_category: true,
          },
          orderBy: { created_at: 'desc' },
        });
      }

      return products;
    } catch (err) {
      this.logger.error(`Product search failed: ${err}`);
      return [];
    }
  }

  /**
   * Constructs the System Prompt with Multilingual & Grounding Rules
   */
  private buildSystemPrompt(shippingContext: string, settingsContext: string, products: any[]): string {
    const productCatalog = products
      .map(
        (p) =>
          `[ID: ${p.id}] "${p.title}" | Price: ${p.currency_symbol || '৳'}${p.price} | Category: ${p.category?.name || 'General'} | Stock: ${p.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}`
      )
      .join('\n');

    return `You are "Velina Assistant", the official luxury beauty & shopping advisor for "Velina Elite BD".

LANGUAGES & TONE RULES:
- Detect the customer's language automatically:
  1. If the user asks in standard Bangla (বাংলা), answer in warm, respectful, natural Bangla.
  2. If the user asks in "Banglish" (e.g. "bhaiya oily skin er jonno serum ache?", "delivery charge koto?"), reply in friendly Banglish or natural Bangla.
  3. If the user asks in English, reply in elegant, courteous English.
- Always maintain a warm, welcoming, and knowledgeable luxury beauty consultant persona.
- Keep answers concise, helpful, and pleasant. Avoid overly long walls of text.

REAL-TIME STORE POLICIES:
- ${settingsContext}
- Shipping Policy: ${shippingContext}
- Authenticity: 100% authentic, directly imported original cosmetics and skincare with genuine guarantee.
- Cash on Delivery (COD): Supported throughout Bangladesh.

AVAILABLE PRODUCTS FROM VELINA ELITE DATABASE:
${productCatalog || 'Catalog is currently loading.'}

RECOMMENDATION & FORMATTING INSTRUCTIONS:
- Use clean, well-formatted Markdown:
  • Highlight product names in **bold**, e.g. **Skin1004 Centella Sun Serum**.
  • Use neat bullet points (- ) when listing multiple recommendations or benefits.
  • Do NOT write "(ID X)" or "[ID: X]" inside your conversational sentences. Keep product names completely natural.
- Whenever you recommend or mention any products from the list above, you MUST include their IDs at the very end of your response inside this exact tag:
  [RECOMMENDED_PRODUCTS: id1, id2]
- Example: "Here are our top serums for radiant skin! [RECOMMENDED_PRODUCTS: 3, 5]"
- If no specific products are recommended (e.g. for general delivery or greeting questions), do NOT add the tag.`;
  }

  /**
   * Extracts [RECOMMENDED_PRODUCTS: ...] tags and cleans text
   */
  private extractProductRecommendations(text: string, matchedProducts: any[]): { cleanReply: string; productIds: number[] } {
    const regex = /\[RECOMMENDED_PRODUCTS:\s*([\d,\s]+)\]/i;
    const match = text.match(regex);

    let productIds: number[] = [];
    let cleanReply = text;

    if (match) {
      cleanReply = text.replace(match[0], '').trim();
      productIds = match[1]
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
    }

    // Clean up any stray "(ID 11)" leaked into the conversation
    cleanReply = cleanReply
      .replace(/\s*\((?:ID|id)\s*\d+\)/g, '')
      .replace(/\s*\[(?:ID|id):\s*\d+\]/g, '')
      .trim();

    // If text mentions items but didn't output tag, take top matched items if relevant
    if (productIds.length === 0 && matchedProducts.length > 0) {
      const lower = text.toLowerCase();
      const relevant = matchedProducts.filter((p) =>
        lower.includes(p.title.toLowerCase()) || lower.includes('recommend') || lower.includes('সুপারিশ') || lower.includes('পণ্য')
      );
      if (relevant.length > 0) {
        productIds = relevant.slice(0, 3).map((p) => p.id);
      }
    }

    return { cleanReply, productIds };
  }

  /**
   * Local Fallback Generator in case LLM service experiences network issues
   */
  private generateLocalFallback(query: string, products: any[], shippingContext: string): string {
    const q = query.toLowerCase();
    const isBangla = /[\u0980-\u09FF]/.test(query) || q.includes('koto') || q.includes('ache') || q.includes('bhai');

    if (q.includes('delivery') || q.includes('shipping') || q.includes('charge') || q.includes('ডেলিভারি') || q.includes('খরচ')) {
      return isBangla
        ? `📦 ভেলিনা এলিট ডেলিভারি তথ্য:\n${shippingContext}\nক্যাশ অন ডেলিভারি সুবিধা রয়েছে!`
        : `📦 Velina Elite Delivery Information:\n${shippingContext}\nCash on Delivery is available nationwide!`;
    }

    if (products.length > 0) {
      const ids = products.slice(0, 3).map((p) => p.id).join(', ');
      return isBangla
        ? `ধন্যবাদ আপনার বার্তার জন্য! আপনার পছন্দের জন্য আমাদের সেরা কিছু কালেকশন নিচে দেওয়া হলো:\n[RECOMMENDED_PRODUCTS: ${ids}]`
        : `Thank you for reaching out! Here are some of our finest authentic products for you:\n[RECOMMENDED_PRODUCTS: ${ids}]`;
    }

    return isBangla
      ? `হ্যালো! আমি ভেলিনা এআই অ্যাসিস্ট্যান্ট। কীভাবে আপনাকে সাহায্য করতে পারি? পণ্য বা ডেলিভারি সম্পর্কে যেকোনো প্রশ্ন করতে পারেন।`
      : `Hello! I am Velina AI Assistant. How can I assist you with your beauty and skincare routine today?`;
  }
}
