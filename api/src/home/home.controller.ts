import { Controller, Get } from '@nestjs/common';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {
  constructor(private home: HomeService) {}

  /** Feed public homepage — plats du jour + offres + restaurants populaires */
  @Get('feed')
  getFeed() {
    return this.home.getFeed();
  }
}
