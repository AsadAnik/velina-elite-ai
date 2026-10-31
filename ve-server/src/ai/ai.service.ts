import { Injectable, Logger, MessageEvent } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { PollinationsProvider } from './providers/pollinations.provider';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatMessage, SseAiEvent } from './interfaces/llm-provider.interface';
import { VectorDbService } from './services/vector-db.service';
import { EmbeddingService } from './services/embedding.service';

export type MatchedProduct = Prisma.ProductGetPayload<{
  include: {
    category: true;
    sub_category: true;
  };
}>;

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
    private readonly vectorDb: VectorDbService,
    private readonly embeddingService: EmbeddingService,
  ) { }

  /**
   * PROCESS CHAT
   * @param dto 
   * @returns 
   */
  // region Process Chat
  async processChat(dto: ChatRequestDto): Promise<ChatResponse> {
    const userQuery = dto.message.trim();
    const wantsProducts = this.isUserAskingForProducts(userQuery, dto.history);

    // Step 1: Database Grounding - Retrieve Store Policies & Catalog
    const [shipping, settings, matchedProducts] = await Promise.all([
      this.getShippingContext(),
      this.getSiteSettingsContext(),
      this.searchProducts(userQuery),
    ]);

    // Step 2: Assemble System Prompt with Injected Store Knowledge & Permission Rules
    const systemPrompt = this.buildSystemPrompt(shipping, settings, matchedProducts, wantsProducts);

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
      rawReply = this.generateLocalFallback(userQuery, matchedProducts, shipping, dto.history);
    }

    // Step 5: Parse Structured Product Recommendations
    let { cleanReply, productIds } = this.extractProductRecommendations(
      rawReply,
      matchedProducts,
      wantsProducts,
      userQuery,
    );

    // Step 6: Map to Full Product Entities for UI Cards ONLY when user requested products
    let recommendedProductCards: any[] = [];
    if (wantsProducts && productIds.length > 0) {
      recommendedProductCards = await this.prisma.product.findMany({
        where: {
          id: { in: productIds },
          status: 'active',
        },
        include: {
          category: true,
          sub_category: true,
          ratings: true,
        },
      });

      // Preserve recommendation order
      recommendedProductCards.sort((a, b) => productIds.indexOf(a.id) - productIds.indexOf(b.id));
    } else {
      productIds = [];
    }

    return {
      reply: cleanReply,
      productIds,
      products: recommendedProductCards,
    };
  }

  /**
   * STREAM CHAT VIA SERVER-SENT EVENTS (SSE)
   * Emits tokens chunk-by-chunk for a smooth typewriter effect
   * @param dto ChatRequestDto
   * @returns Observable<MessageEvent>
   */
  // region Stream Chat
  streamChat(dto: ChatRequestDto): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      let isCancelled = false;

      (async () => {
        let heartbeatTimer: NodeJS.Timeout | null = null;

        try {
          // 1. Initial status event so frontend knows the assistant is processing
          subscriber.next({
            data: { type: 'status', message: 'Checking inventory & store policies...' } as SseAiEvent,
          });

          // Heartbeat keep-alive every 3.5s to ensure Docker / proxies / browser never drop idle connection
          const dynamicStatuses = [
            'Analyzing your skincare preferences...',
            'Searching authentic catalog & real-time stock...',
            'Consulting beauty advisor knowledge base...',
          ];
          let statusIndex = 0;
          heartbeatTimer = setInterval(() => {
            if (!isCancelled && !subscriber.closed) {
              const msg = dynamicStatuses[statusIndex % dynamicStatuses.length];
              statusIndex++;
              subscriber.next({
                data: { type: 'status', message: msg } as SseAiEvent,
              });
            }
          }, 3500);

          // 2. Execute database grounding & LLM completion
          const { reply, productIds, products } = await this.processChat(dto);

          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }

          if (isCancelled || subscriber.closed) return;

          // 3. Emit tokens with typewriter pacing
          // Split into words while retaining whitespace and punctuation
          const tokens = reply.match(/\S+\s*/g) || [reply];

          for (const token of tokens) {
            if (isCancelled || subscriber.closed) break;

            subscriber.next({
              data: { type: 'token', token } as SseAiEvent,
            });

            // 25ms delay per token produces a natural reading / typing rhythm
            await new Promise((res) => setTimeout(res, 25));
          }

          if (isCancelled || subscriber.closed) return;

          // 4. Emit structured product card entities for the carousel/recommendations
          if (products && products.length > 0) {
            subscriber.next({
              data: { type: 'products', products, productIds } as SseAiEvent,
            });
          }

          // 5. Emit completion event
          subscriber.next({
            data: { type: 'done' } as SseAiEvent,
          });

          subscriber.complete();
        } catch (error) {
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }

          if (!subscriber.closed) {
            this.logger.error(`Error in streamChat: ${error instanceof Error ? error.message : String(error)}`);
            subscriber.next({
              data: {
                type: 'token',
                token: 'I apologize, but I encountered a momentary connection issue. Please feel free to ask again or contact our support team on WhatsApp!',
              } as SseAiEvent,
            });
            subscriber.next({ data: { type: 'done' } as SseAiEvent });
            subscriber.complete();
          }
        }
      })();

      return () => {
        isCancelled = true;
      };
    });
  }

  /**
   * Get Shipping Context
   * @returns Shipping Context
   */
  // region Shipping Context
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
   * Get Site Settings Context
   * @returns Site Settings Context
   */
  // region Site Settings Context
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
   * Database Grounding: Semantic Vector Search & Keyword Fallback
   * @param query 
   * @returns MatchedProduct[]
   */
  // region Search Products
  private async searchProducts(query: string): Promise<MatchedProduct[]> {
    try {
      // Step 1: Semantic Vector Search via Dedicated AI Vector DB (pgvector)
      if (this.vectorDb.isReady) {
        const queryEmbedding = await this.embeddingService.generateEmbedding(query);
        const similarResults = await this.vectorDb.searchSimilarProducts(queryEmbedding, 6);

        if (similarResults.length > 0) {
          const matchedIds = similarResults.map((s) => s.product_id);

          const products = await this.prisma.product.findMany({
            where: {
              id: { in: matchedIds },
              status: 'active',
            },
            include: {
              category: true,
              sub_category: true,
            },
          });

          // Preserve vector similarity ranking order
          products.sort((a, b) => matchedIds.indexOf(a.id) - matchedIds.indexOf(b.id));

          if (products.length > 0) {
            this.logger.log(`Semantic Vector RAG matched ${products.length} products for: "${query}"`);
            return products;
          }
        }
      }

      // Step 2: Keyword Fallback (if Vector DB empty or returning 0)
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

      let products = await this.prisma.product.findMany({
        where: whereClause,
        take: 6,
        include: {
          category: true,
          sub_category: true,
        },
        orderBy: { created_at: 'desc' },
      });

      // Step 3: If no keyword match found, supply latest active products for context
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
   * Checks if the user is explicitly requesting product recommendations or confirming interest.
   */
  // region Is User Asking Products
  private isUserAskingForProducts(query: string, history?: { role: string; content: string }[]): boolean {
    const q = query.toLowerCase().trim();

    // 1. Operational & store policy inquiries are NEVER product recommendation requests
    const nonProductIntent =
      /\b(shipping|delivery|track|tracking|shipment|courier|return|refund|exchange|policy|policies|payment|cash on delivery|cod|contact|phone|whatsapp|address|location|office|help desk|ডেলিভারি|শিপিং|ট্র্যাক|ঠিকানা|যোগাযোগ|ফেরত)\b/i;
    if (nonProductIntent.test(q)) {
      return false;
    }

    // 2. Explicit product request phrases
    const explicitProductPatterns = [
      /\b(suggest|recommend)\b.*\b(product|products|item|items|something|brand|skincare|routine|serum|cream|moisturizer|sunscreen|cleanser|oil|lotion|shampoo|lipstick|foundation)\b/i,
      /\b(product|products|item|items)\b.*\b(suggest|recommend|recommendation|suggestions|suggestion)\b/i,
      /\b(show me|give me|tell me)\b.*\b(product|products|items|options|collection|catalog)\b/i,
      /\b(what|which)\b.*\b(product|products|serum|cream|moisturizer|sunscreen|cleanser)\b.*\b(should|to|can)\b/i,
      /\b(want to buy|looking to buy|order product|purchase)\b/i,
      /\b(suggest me|recommend me|suggest for me|recommend for me)\b/i,
      /\b(প্রোডাক্ট|পণ্য)\b.*\b(সাজেস্ট|সুপারিশ|দেখান|কিনব|কিনি|লাগবে)\b/i,
      /\b(সাজেস্ট|সুপারিশ)\b.*\b(করুন|করো|দিন|দেখান)\b/i,
      /\b(কোন প্রোডাক্ট|কী প্রোডাক্ট|কি প্রোডাক্ট)\b/i,
    ];

    if (explicitProductPatterns.some((pattern) => pattern.test(q))) {
      return true;
    }

    // 3. Check affirmative confirmation ONLY if the assistant previously asked to suggest products
    const affirmativePatterns = [
      /^yes\b/i,
      /^yeah\b/i,
      /^yep\b/i,
      /^sure\b/i,
      /^ok\b/i,
      /^okay\b/i,
      /^please\b/i,
      /^pls\b/i,
      /^please do\b/i,
      /^hae\b/i,
      /^ha\b/i,
      /^haa\b/i,
      /^ji\b/i,
      /^হাঁ/i,
      /^হ্যাঁ/i,
      /^জি/i,
      /^অবশ্যই/i,
      /^দেখান/i,
      /^বলুন/i,
    ];

    const isAffirmative = affirmativePatterns.some((pattern) => pattern.test(q));

    if (isAffirmative && history && history.length > 0) {
      const lastAssistantMsg = [...history].reverse().find((m) => m.role === 'assistant');
      if (lastAssistantMsg) {
        const lower = lastAssistantMsg.content.toLowerCase();
        if (
          lower.includes('suggest') ||
          lower.includes('velina elite has') ||
          lower.includes('সাজেস্ট') ||
          lower.includes('উপকারে আসবে') ||
          lower.includes('পণ্য রয়েছে')
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Constructs the System Prompt with Multilingual, Grounding & Permission Rules
   */
  // region Build System Prompt
  private buildSystemPrompt(
    shippingContext: string,
    settingsContext: string,
    products: MatchedProduct[],
    wantsProducts: boolean,
  ): string {
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

STRICT PRODUCT RECOMMENDATION RULES:
${
  wantsProducts
    ? `The customer HAS SPECIFICALLY REQUESTED product recommendations or confirmed they want to see product options.
- Warmly introduce your recommendations with: "Velina Elite has these items that will help you out, please check!" (or in Bangla: "ভেলিনা এলিট-এ এই চমৎকার পণ্যগুলো রয়েছে যা আপনার উপকারে আসবে, দেখে নিন:").
- Highlight product names in **bold**, e.g. **Skin1004 Centella Sun Serum**.
- At the very end of your response, you MUST include the exact tag with matching IDs:
  [RECOMMENDED_PRODUCTS: id1, id2]
- Only include IDs from the AVAILABLE PRODUCTS list above.`
    : `The customer HAS NOT asked for products yet.
- DO NOT recommend or mention specific products.
- DO NOT display product cards.
- NEVER include the [RECOMMENDED_PRODUCTS: ...] tag.
- If the customer asks about shipping, orders, delivery, returns, or store policies: answer their question clearly and politely. DO NOT offer or push products.
- If the customer asks for beauty/skincare consultation: provide routine guidance, and end by asking:
  "Can I suggest you products we have for this? Velina Elite has these items that will help you out, please check!"
  (or in Bangla: "আপনি কি চান আমি এর জন্য কিছু প্রোডাক্ট সাজেস্ট করি? ভেলিনা এলিট-এ এমন চমৎকার কিছু পণ্য রয়েছে যা আপনার উপকারে আসবে!")`
}`;
  }

  /**
   * Extracts [RECOMMENDED_PRODUCTS: ...] tags and cleans text
   */
  // region Prouduct Reommends
  private extractProductRecommendations(
    text: string,
    matchedProducts: MatchedProduct[],
    wantsProducts: boolean,
    userQuery: string,
  ): { cleanReply: string; productIds: number[] } {
    const regex = /\[RECOMMENDED_PRODUCTS:\s*([\d,\s]+)\]/i;
    const match = text.match(regex);

    let productIds: number[] = [];
    let cleanReply = text;

    if (match) {
      cleanReply = text.replace(match[0], '').trim();
      if (wantsProducts) {
        productIds = match[1]
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n));
      }
    }

    // Clean up any stray "(ID 11)" leaked into the conversation
    cleanReply = cleanReply
      .replace(/\s*\((?:ID|id)\s*\d+\)/g, '')
      .replace(/\s*\[(?:ID|id):\s*\d+\]/g, '')
      .trim();

    // If user explicitly asked for products, but model mentioned products in bold without the tag
    if (wantsProducts && productIds.length === 0 && matchedProducts.length > 0) {
      const lowerReply = cleanReply.toLowerCase();
      const mentioned = matchedProducts.filter((p) =>
        lowerReply.includes(p.title.toLowerCase())
      );
      if (mentioned.length > 0) {
        productIds = mentioned.slice(0, 3).map((p) => p.id);
      } else {
        productIds = matchedProducts.slice(0, 3).map((p) => p.id);
      }
    }

    // If user did NOT ask for products:
    // Strictly guarantee that no product IDs are returned
    if (!wantsProducts) {
      productIds = [];

      // Check if this inquiry is specifically about skincare, beauty, or cosmetic concerns
      const isBeautyOrSkinQuery =
        /\b(skin|skincare|face|acne|pimple|breakout|dry|oily|sensitive|wrinkle|aging|dark spot|pigmentation|glow|hydration|barrier|sunscreen|spf|serum|cream|moisturizer|cleanser|toner|hair|haircare|dandruff|makeup|lipstick|foundation|ত্বক|ব্রণ|তৈলাক্ত|শুষ্ক|চুল|রূপচর্চা)\b/i.test(userQuery);

      const isStorePolicy =
        /\b(shipping|delivery|track|tracking|shipment|courier|return|refund|exchange|policy|policies|payment|contact|phone|whatsapp|address|ডেলিভারি|শিপিং|ট্র্যাক)\b/i.test(userQuery);

      const lowerReply = cleanReply.toLowerCase();
      const hasOffer =
        lowerReply.includes('suggest') ||
        lowerReply.includes('velina elite has') ||
        lowerReply.includes('সাজেস্ট') ||
        lowerReply.includes('উপকারে আসবে') ||
        lowerReply.includes('পণ্য রয়েছে');

      // Only prompt for product suggestions if this is a genuine beauty/skin inquiry AND not a store policy question
      if (!hasOffer && isBeautyOrSkinQuery && !isStorePolicy) {
        const isBangla = /[\u0980-\u09FF]/.test(userQuery) || /\b(koto|ache|bhai|bhaiya|lagbe|hobe|er|jonno)\b/i.test(userQuery);
        const offerPrompt = isBangla
          ? `\n\nআপনি কি চান আমি এর জন্য কিছু প্রোডাক্ট সাজেস্ট করি? ভেলিনা এলিট-এ এমন চমৎকার কিছু পণ্য রয়েছে যা আপনার উপকারে আসবে!`
          : `\n\nCan I suggest you products we have for this? Velina Elite has these items that will help you out, please check!`;
        cleanReply += offerPrompt;
      }
    }

    return { cleanReply, productIds };
  }

  /**
   * Local Fallback Generator in case LLM service experiences network issues
   */
  // region Local Fallback
  private generateLocalFallback(
    query: string,
    products: MatchedProduct[],
    shippingContext: string,
    history?: { role: string; content: string }[],
  ): string {
    const q = query.toLowerCase();
    const isBangla = /[\u0980-\u09FF]/.test(query) || /\b(koto|ache|bhai|bhaiya|lagbe|hobe|er|jonno)\b/i.test(query);

    // 1. Shipping, Order, or Delivery questions (NEVER suggest products here)
    if (
      q.includes('delivery') ||
      q.includes('shipping') ||
      q.includes('track') ||
      q.includes('order') ||
      q.includes('charge') ||
      q.includes('ডেলিভারি') ||
      q.includes('খরচ')
    ) {
      return isBangla
        ? `📦 ভেলিনা এলিট ডেলিভারি তথ্য:\n${shippingContext}\nক্যাশ অন ডেলিভারি সুবিধা রয়েছে! কোনো অর্ডার ট্র্যাকিং সংক্রান্ত সহায়তার জন্য যেকোনো সময় আমাদের জানান।`
        : `📦 Velina Elite Delivery Information:\n${shippingContext}\nCash on Delivery is available nationwide! If you need order tracking assistance or any other information, please let us know.`;
    }

    const wantsProducts = this.isUserAskingForProducts(query, history);

    // 2. If user specifically requested product suggestions or agreed to see them
    if (wantsProducts && products.length > 0) {
      const ids = products.slice(0, 3).map((p) => p.id).join(', ');
      return isBangla
        ? `ভেলিনা এলিট-এ এই চমৎকার পণ্যগুলো রয়েছে যা আপনার উপকারে আসবে, দেখে নিন:\n[RECOMMENDED_PRODUCTS: ${ids}]`
        : `Velina Elite has these items that will help you out, please check!\n[RECOMMENDED_PRODUCTS: ${ids}]`;
    }

    // 3. Beauty or Skincare inquiry (give advice first, offer to suggest products without showing cards)
    const isBeautyOrSkinQuery =
      /\b(skin|skincare|face|acne|pimple|breakout|dry|oily|sensitive|wrinkle|aging|dark spot|pigmentation|glow|hydration|barrier|sunscreen|spf|serum|cream|moisturizer|cleanser|toner|hair|haircare|dandruff|makeup|lipstick|foundation|ত্বক|ব্রণ|তৈলাক্ত|শুষ্ক|চুল|রূপচর্চা)\b/i.test(query);

    if (isBeautyOrSkinQuery) {
      return isBangla
        ? `ত্বকের সুস্থতা বজায় রাখতে একটি সঠিক স্কিনকেয়ার রুটিন (ক্লিনজার, হাইড্রেটিং ময়েশ্চারাইজার এবং ব্রড-স্পেকট্রাম সানস্ক্রিন) অত্যন্ত প্রয়োজনীয়।\n\nআপনি কি চান আমি এর জন্য কিছু প্রোডাক্ট সাজেস্ট করি? ভেলিনা এলিট-এ এমন চমৎকার কিছু পণ্য রয়েছে যা আপনার উপকারে আসবে!`
        : `Healthy, glowing skin starts with understanding your skin barrier! A gentle pH-balanced cleanser, deep restorative hydration, and daily broad-spectrum SPF make the ideal foundation.\n\nCan I suggest you products we have for this? Velina Elite has these items that will help you out, please check!`;
    }

    // 4. General greeting
    return isBangla
      ? `হ্যালো! আমি ভেলিনা এআই অ্যাসিস্ট্যান্ট। কীভাবে আপনাকে সাহায্য করতে পারি? আপনার ত্বকের যত্ন বা রূপচর্চা সম্পর্কে আমাকে নির্দ্বিধায় বলুন।`
      : `Hello! I am Velina AI Assistant, your personal luxury beauty advisor. How can I assist you with your skincare or beauty routine today?`;
  }
}
