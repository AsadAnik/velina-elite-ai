import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from '../dto/create-category.dto';

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * CREATE CATEGORY SERVICE
     * @param dto createCategoryDto
     * @returns Object
     */
    // region Create Category
    async createCategory(dto: CreateCategoryDto) {
        return this.prisma.category.create({
            data: {
                name: dto.name,
            },
        });
    }

    /**
     * FIND ALL CATEGORY SERVICE
     * @returns Object
     */
    // region Find All Categories
    async findAllCategories() {
        return this.prisma.category.findMany({
            include: {
                sub_categories: true,
                products: true,
            }
        });
    }

    /**
     * FIND ONE CATEGORY SERVICE
     * @param id category_id
     * @returns Object
     */
    // region Find One Category
    async findOneCategory(id: number) {
        return this.prisma.category.findUnique({
            where: { id },
            include: {
                sub_categories: true,
                products: true,
            }
        });
    }

    /**
     * UPDATE CATEGORY SERVICE
     * @param id category_id
     * @param dto createCategoryDto
     * @returns Object
     */
    // region Update Category
    async updateCategory(id: number, dto: CreateCategoryDto) {
        return this.prisma.category.update({
            where: { id },
            data: {
                name: dto.name,
            },
        });
    }

    /**
     * DELETE CATEGORY SERVICE
     * @param id category_id
     * @returns Object
     */
    // region Delete Category
    async deleteCategory(id: number) {
        return this.prisma.category.delete({
            where: { id },
        });
    }
}
