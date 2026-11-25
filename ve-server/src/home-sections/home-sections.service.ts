import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateHomeSectionDto } from './dto/create-home-section.dto';
import { UpdateHomeSectionDto } from './dto/update-home-section.dto';
import { CreateHomeSectionItemDto } from './dto/create-home-section-item.dto';
import { UpdateHomeSectionItemDto } from './dto/update-home-section-item.dto';
import { ReorderItemDto } from './dto/reorder-home-sections.dto';

@Injectable()
export class HomeSectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  /**
   * Get all public active sections with active items for storefront home page
   * @returns Array of public active sections with active items
   */
  // region GET PUBLIC SECTIONS
  async getPublicSections() {
    const sections = await this.prisma.homeSection.findMany({
      where: { is_active: true },
      orderBy: { order_index: 'asc' },
      include: {
        items: {
          where: { is_active: true },
          orderBy: { order_index: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                regular_price: true,
                mrp_price: true,
                currency_symbol: true,
                images_url: true,
                status: true,
                stock_quantity: true,
              },
            },
          },
        },
      },
    });

    return sections.map((section) => {
      const max = section.max_items > 0 ? section.max_items : section.items.length;
      return {
        ...section,
        items: section.items.slice(0, max),
      };
    });
  }

  /**
   * Get all sections for admin dashboard
   * @returns Array of all sections
   */
  // region GET ALL SECTIONS
  async getAllSections() {
    return this.prisma.homeSection.findMany({
      orderBy: { order_index: 'asc' },
      include: {
        items: {
          orderBy: { order_index: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                regular_price: true,
                mrp_price: true,
                currency_symbol: true,
                images_url: true,
                status: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get home section by ID
   * @param id Section ID
   * @returns Home section object
   */
  // region GET SECTION BY ID
  async getSectionById(id: number) {
    const section = await this.prisma.homeSection.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order_index: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                regular_price: true,
                mrp_price: true,
                currency_symbol: true,
                images_url: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Home section with ID ${id} not found`);
    }

    return section;
  }

  /**
   * Create home section
   * @param dto Home section data
   * @returns Created home section object
   */
  // region CREATE SECTION
  async createSection(dto: CreateHomeSectionDto) {
    let orderIndex = dto.order_index;
    if (orderIndex === undefined || orderIndex === null) {
      const maxOrder = await this.prisma.homeSection.aggregate({
        _max: { order_index: true },
      });
      orderIndex = (maxOrder._max.order_index ?? -1) + 1;
    }

    return this.prisma.homeSection.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        badge_text: dto.badge_text,
        description: dto.description,
        section_type: dto.section_type || 'deals_grid',
        bg_type: dto.bg_type || 'gradient',
        bg_color: dto.bg_color,
        bg_gradient: dto.bg_gradient,
        bg_image: dto.bg_image,
        banner_image: dto.banner_image,
        banner_url: dto.banner_url,
        button_text: dto.button_text,
        button_url: dto.button_url,
        order_index: orderIndex,
        is_active: dto.is_active !== undefined ? dto.is_active : true,
        max_items: dto.max_items !== undefined ? dto.max_items : 4,
      },
      include: {
        items: true,
      },
    });
  }

  /**
   * Update home section
   * @param id Section ID
   * @param dto Home section data
   * @returns Updated home section object
   */
  // region UPDATE SECTION
  async updateSection(id: number, dto: UpdateHomeSectionDto) {
    await this.getSectionById(id);

    return this.prisma.homeSection.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.badge_text !== undefined && { badge_text: dto.badge_text }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.section_type !== undefined && { section_type: dto.section_type }),
        ...(dto.bg_type !== undefined && { bg_type: dto.bg_type }),
        ...(dto.bg_color !== undefined && { bg_color: dto.bg_color }),
        ...(dto.bg_gradient !== undefined && { bg_gradient: dto.bg_gradient }),
        ...(dto.bg_image !== undefined && { bg_image: dto.bg_image }),
        ...(dto.banner_image !== undefined && { banner_image: dto.banner_image }),
        ...(dto.banner_url !== undefined && { banner_url: dto.banner_url }),
        ...(dto.button_text !== undefined && { button_text: dto.button_text }),
        ...(dto.button_url !== undefined && { button_url: dto.button_url }),
        ...(dto.order_index !== undefined && { order_index: dto.order_index }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
        ...(dto.max_items !== undefined && { max_items: dto.max_items }),
      },
      include: {
        items: {
          orderBy: { order_index: 'asc' },
          include: { product: true },
        },
      },
    });
  }

  /**
   * Reorder home sections
   * @param items Array of section IDs and their new order indexes
   * @returns Updated array of home sections
   */
  // region REORDER SECTIONS
  async reorderSections(items: ReorderItemDto[]) {
    if (!items || items.length === 0) {
      throw new BadRequestException('Items array is required');
    }

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.homeSection.update({
          where: { id: item.id },
          data: { order_index: item.order_index },
        }),
      ),
    );

    return this.getAllSections();
  }

  /**
   * Delete home section
   * @param id Section ID
   * @returns Deleted home section object
   */
  // region DELETE SECTION
  async deleteSection(id: number) {
    const section = await this.getSectionById(id);

    // Delete section images from Cloudinary if applicable
    if (section.banner_image) {
      await this.cloudinaryService.deleteFile(section.banner_image);
    }
    if (section.bg_image) {
      await this.cloudinaryService.deleteFile(section.bg_image);
    }
    for (const item of section.items) {
      if (item.image_url) {
        await this.cloudinaryService.deleteFile(item.image_url);
      }
    }

    return this.prisma.homeSection.delete({
      where: { id },
    });
  }

  /**
   * Add item to home section
   * @param sectionId Section ID
   * @param dto Item data
   * @returns Created item object
   */
  // region ADD ITEM
  async addItem(sectionId: number, dto: CreateHomeSectionItemDto) {
    await this.getSectionById(sectionId);

    let orderIndex = dto.order_index;
    if (orderIndex === undefined || orderIndex === null) {
      const maxOrder = await this.prisma.homeSectionItem.aggregate({
        where: { section_id: sectionId },
        _max: { order_index: true },
      });
      orderIndex = (maxOrder._max.order_index ?? -1) + 1;
    }

    return this.prisma.homeSectionItem.create({
      data: {
        section_id: sectionId,
        title: dto.title,
        subtitle: dto.subtitle,
        description: dto.description,
        tag: dto.tag,
        tag_bg: dto.tag_bg,
        image_url: dto.image_url,
        link_url: dto.link_url,
        button_text: dto.button_text,
        bg_gradient: dto.bg_gradient,
        bg_color: dto.bg_color,
        product_id: dto.product_id,
        order_index: orderIndex,
        is_active: dto.is_active !== undefined ? dto.is_active : true,
      },
      include: {
        product: true,
      },
    });
  }

  /**
   * Update home section item
   * @param itemId Item ID
   * @param dto Item data
   * @returns Updated item object
   */
  // region UPDATE ITEM
  async updateItem(itemId: number, dto: UpdateHomeSectionItemDto) {
    const item = await this.prisma.homeSectionItem.findUnique({
      where: { id: itemId },
    });
    if (!item) {
      throw new NotFoundException(`Section item with ID ${itemId} not found`);
    }

    return this.prisma.homeSectionItem.update({
      where: { id: itemId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.tag !== undefined && { tag: dto.tag }),
        ...(dto.tag_bg !== undefined && { tag_bg: dto.tag_bg }),
        ...(dto.image_url !== undefined && { image_url: dto.image_url }),
        ...(dto.link_url !== undefined && { link_url: dto.link_url }),
        ...(dto.button_text !== undefined && { button_text: dto.button_text }),
        ...(dto.bg_gradient !== undefined && { bg_gradient: dto.bg_gradient }),
        ...(dto.bg_color !== undefined && { bg_color: dto.bg_color }),
        ...(dto.product_id !== undefined && { product_id: dto.product_id }),
        ...(dto.order_index !== undefined && { order_index: dto.order_index }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
      include: {
        product: true,
      },
    });
  }

  /**
   * Reorder home section items
   * @param sectionId Section ID
   * @param items Array of item IDs and their new order indexes
   * @returns Updated array of home section items
   */
  // region REORDER ITEMS
  async reorderItems(sectionId: number, items: ReorderItemDto[]) {
    if (!items || items.length === 0) {
      throw new BadRequestException('Items array is required');
    }

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.homeSectionItem.update({
          where: { id: item.id },
          data: { order_index: item.order_index },
        }),
      ),
    );

    return this.getSectionById(sectionId);
  }

  /**
   * Delete home section item
   * @param itemId Item ID
   * @returns Deleted item object
   */
  // region DELETE ITEM
  async deleteItem(itemId: number) {
    const item = await this.prisma.homeSectionItem.findUnique({
      where: { id: itemId },
    });
    if (!item) {
      throw new NotFoundException(`Section item with ID ${itemId} not found`);
    }

    if (item.image_url) {
      await this.cloudinaryService.deleteFile(item.image_url);
    }

    return this.prisma.homeSectionItem.delete({
      where: { id: itemId },
    });
  }
}
