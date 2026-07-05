import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';

@Injectable()
export class SubCategoriesService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create Sub Category Service
     * @param dto 
     * @returns 
     */
    // region Create Sub Category
    async createSubCategory(dto: CreateSubCategoryDto) {
        const subCategoryExists = await this.prisma.subCategory.findFirst({ where: { name: dto.name } });
        if (subCategoryExists) {
            throw new BadRequestException('Sub Category already exists');
        }
        return this.prisma.subCategory.create({ data: dto });
    }

    /**
     * Update Sub Category Service
     * @param id category_id
     * @param dto createSubCategoryDto
     * @returns Object
     */
    // region Update Sub Category
    async updateSubCategory(id: number, dto: CreateSubCategoryDto) {
        return this.prisma.subCategory.update({ where: { id }, data: dto });
    }

    /**
     * Delete Sub Category Service
     * @param id category_id
     * @returns 
     */
    // region Delete Sub Category
    async deleteSubCategory(id: number) {
        return this.prisma.subCategory.delete({ where: { id } });
    }

    /**
     * Find All Sub Category Service
     * @param dto 
     * @returns 
     */
    // region Find All Sub Category
    async findAllSubCategories() {
        return this.prisma.subCategory.findMany({
            include: {
                category: true,
                products: true,
            }
        });
    }
}
