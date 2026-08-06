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
  constructor(private readonly ratingsService: RatingsService) {}

  @Post('ratings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.customer)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a rating (Customer only)' })
  create(@Request() req, @Body() createRatingDto: CreateRatingDto) {
    return this.ratingsService.create(req.user.sub, createRatingDto);
  }

  @Get('products/:productId/ratings')
  @ApiOperation({ summary: 'Get all ratings for a specific product' })
  findAllForProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.ratingsService.findAllForProduct(productId);
  }

  @Get('admin/ratings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all ratings (Admin only)' })
  findAll() {
    return this.ratingsService.findAll();
  }

  @Put('admin/ratings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a rating (Admin only)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateRatingDto: UpdateRatingDto) {
    return this.ratingsService.update(id, updateRatingDto);
  }

  @Delete('admin/ratings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a rating (Admin only)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ratingsService.remove(id);
  }
}
