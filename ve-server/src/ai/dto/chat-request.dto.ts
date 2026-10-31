import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class HistoryMessageDto {
  @ApiProperty({ example: 'user', enum: ['user', 'assistant'] })
  @IsString()
  role: 'user' | 'assistant';

  @ApiProperty({ example: 'Do you have serums for glowing skin?' })
  @IsString()
  content: string;
}

export class ChatRequestDto {
  @ApiProperty({ example: 'Recommend a night moisturizer for dry skin' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ type: () => [HistoryMessageDto] })
  @IsOptional()
  @IsArray()
  history?: HistoryMessageDto[];
}
