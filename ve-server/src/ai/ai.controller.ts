import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Post,
  Query,
  Sse,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { AiService, ChatResponse } from './ai.service';
import { ChatRequestDto, HistoryMessageDto } from './dto/chat-request.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Chat with Velina AI Assistant (Blocking / Mobile & Web)',
    description: 'Generates a full response along with grounded product recommendation cards.',
  })
  @ApiResponse({ status: 200, description: 'Successful chat response with recommended products' })
  async chat(@Body() dto: ChatRequestDto): Promise<ChatResponse> {
    return this.aiService.processChat(dto);
  }

  @Sse('chat-stream')
  @ApiOperation({
    summary: 'Stream chat response via SSE (Typewriter effect for Mobile & Web)',
    description: 'Keeps an open HTTP stream that pushes status updates, text tokens, product cards, and completion signals.',
  })
  @ApiQuery({
    name: 'message',
    type: String,
    required: true,
    description: 'User inquiry or message',
    example: 'Suggest a moisturizer for sensitive skin',
  })
  @ApiQuery({
    name: 'history',
    type: String,
    required: false,
    description: 'JSON-encoded array of previous conversation messages [{"role":"user"|"assistant","content":"..."}]',
  })
  chatStream(
    @Query('message') message: string,
    @Query('history') historyRaw?: string,
  ): Observable<MessageEvent> {
    let history: HistoryMessageDto[] = [];
    if (historyRaw) {
      try {
        const parsed = JSON.parse(historyRaw);
        if (Array.isArray(parsed)) {
          history = parsed;
        }
      } catch {
        // Fallback to empty history if JSON parsing fails
      }
    }

    return this.aiService.streamChat({
      message: message || '',
      history,
    });
  }
}
