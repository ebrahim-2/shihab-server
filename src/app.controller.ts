import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('chat')
  async chat(@Body() body: any): Promise<any> {
    return this.appService.chat(body.query);
  }

  @Get('read-excel')
  async readExcel(): Promise<string> {
    await this.appService.readExcelFile();
    return 'done';
  }

  @Post('clear-data')
  async clearAllData() {
    await this.appService.clearAllData();
    return { message: 'All data cleared successfully' };
  }
}
