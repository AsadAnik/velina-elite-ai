import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class HistoryMessageDto {
  @IsString()
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsArray()
  history?: HistoryMessageDto[];
}
