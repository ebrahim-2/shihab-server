import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  message: string;

  @IsNumber()
  @IsOptional()
  messagePollId: number;
}
