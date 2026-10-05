import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiService, ChatResponse } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Chat with Velina AI Assistant' })
  async chat(@Body() dto: ChatRequestDto): Promise<ChatResponse> {
    return this.aiService.processChat(dto);
  }
}
