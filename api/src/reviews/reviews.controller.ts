import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ReplyReviewDto } from './dto/review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  // Public
  @Get('restaurant/:restaurantId')
  findByRestaurant(@Param('restaurantId') id: string) {
    return this.reviews.findByRestaurant(id);
  }

  // Client — laisser un avis
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateReviewDto, @CurrentUser() user: JwtUser) {
    return this.reviews.create(user.id, dto);
  }

  // Owner — voir ses avis
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: JwtUser) {
    return this.reviews.findMine(user.id);
  }

  // Owner — répondre (ESSENTIEL+)
  @Patch(':id/reply')
  @UseGuards(JwtAuthGuard)
  reply(@Param('id') id: string, @Body() dto: ReplyReviewDto, @CurrentUser() user: JwtUser) {
    return this.reviews.reply(id, user.id, dto);
  }
}
