import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiInfo, AppService } from './app.service';

/**
 * AppController exposes the API home/health route. It carries no business
 * logic — it just delegates to AppService and points callers to the docs.
 */
@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** GET /api — landing route confirming the API is running and where the docs live. */
  @Get()
  @ApiOperation({ summary: 'API home — service status and docs link' })
  getHome(): ApiInfo {
    return this.appService.getInfo();
  }
}
