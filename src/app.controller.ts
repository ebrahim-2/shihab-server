import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UserDecorator } from './auth/user.decorator';
import { User } from './auth/entities/user.entity';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

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

  @Post('create-message')
  @UseGuards(JwtAuthGuard)
  async createMessage(
    @Body() body: CreateMessageDto,
    @UserDecorator() user: User,
  ) {
    return this.appService.createMessage(body, user);
  }

  @Get('get-messages/:id')
  @UseGuards(JwtAuthGuard)
  async getMessages(@Param('id') id: string, @UserDecorator() user: User) {
    return this.appService.getMessagesByPollId(parseInt(id));
  }

  @Get('get-messages-polls')
  @UseGuards(JwtAuthGuard)
  async getMessagesPolls(@UserDecorator() user: User) {
    return this.appService.getMessagesPoll(user);
  }
}
