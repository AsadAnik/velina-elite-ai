import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('ratings')
@Controller()
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) { }

  /**
   * Create a rating (Customer only)
   * @param req - Authenticated user from request
   * @param createRatingDto - Rating data to create
   * @returns Created rating object
   */
  @Post('ratings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.customer)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a rating (Customer only)' })
  create(@Request() req, @Body() createRatingDto: CreateRatingDto) {
    return this.ratingsService.create(req.user.sub, createRatingDto);
  }

  /**
   * Get all ratings for a specific product
   * @param productId ID of the product
   * @returns All ratings for the specific product
   */
  @Get('products/:productId/ratings')
  @ApiOperation({ summary: 'Get all ratings for a specific product' })
  findAllForProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.ratingsService.findAllForProduct(productId);
  }

  /**
   * Get all ratings (Admin only)
   * @returns All ratings
   */
  @Get('admin/ratings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all ratings (Admin only)' })
  findAll() {
    return this.ratingsService.findAll();
  }

  /**
   * Update a rating (Admin only)
   * @param id - ID of the rating to update
   * @param updateRatingDto - Updated rating data
   * @returns Updated rating object
   */
  @Put('admin/ratings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a rating (Admin only)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateRatingDto: UpdateRatingDto) {
    return this.ratingsService.update(id, updateRatingDto);
  }

  /**
   * Delete a rating (Admin only)
   * @param id - ID of the rating to delete
   * @returns Confirmation of deletion
   */
  @Delete('admin/ratings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a rating (Admin only)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ratingsService.remove(id);
  }

  /**
   * Seed realistic ratings (8-10 ratings per product, 4.5 - 5 stars) (Admin only)
   * @returns Confirmation of seeding
   */
  @Post('admin/ratings/seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed realistic ratings (8-10 ratings per product, 4.5 - 5 stars) (Admin only)' })
  seedRatings() {
    return this.ratingsService.seedRatings();
  }
}
