import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PollinationsProvider } from './providers/pollinations.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { VectorDbService } from './services/vector-db.service';
import { EmbeddingService } from './services/embedding.service';
import { ProductVectorSyncService } from './services/product-vector-sync.service';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [
    AiService,
    PollinationsProvider,
    VectorDbService,
    EmbeddingService,
    ProductVectorSyncService,
  ],
  exports: [AiService, ProductVectorSyncService, VectorDbService],
})
export class AiModule {}
