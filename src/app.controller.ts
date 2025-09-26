import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { readdirSync } from 'fs';
import { join } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('uploads-list')
  getUploadsList(): { files: string[] } {
    try {
      const uploadsDir = join(process.cwd(), 'uploads');
      const files = readdirSync(uploadsDir);
      return { files };
    } catch (error) {
      return { files: [] };
    }
  }
}
