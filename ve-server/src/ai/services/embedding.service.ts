import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private extractor: any = null;
  private isLocalModelReady = false;

  async onModuleInit() {
    await this.initLocalModel();
  }

  /**
   * Initializes local in-process embedding pipeline using HuggingFace Xenova.
   * Runs all-MiniLM-L6-v2 in server RAM (384 dimensions).
   * 
   * We use `@xenova/transformers`, an open-source library that runs real Hugging Face models
   * inside Node.js process using WebAssembly and ONNX Runtime.
   * 
   * Xenova/all-MiniLM-L6-v2 is a small, fast, and effective embedding model. 
   * It is only ~23 MB in size, but it is trained on over 1 billion sentence pairs to understand deep semantic meaning.
   * It outputs exactly 384 dimensions (coordinates), which matches our vector(384) in PostgreSQL.
   */
  async initLocalModel() {
    try {
      this.logger.log('Loading local embedding model (Xenova/all-MiniLM-L6-v2)...');
      // Dynamic import of Hugging Face Library ensures compatibility and non-blocking startup
      // @ts-ignore
      const { pipeline, env } = await import('@xenova/transformers');
      env.allowLocalModels = false;

      /**
       * Download and load the neural network into server RAM
       * In Hugging Face terminology, 
       * `feature-extraction` means: "Don't generate new words (like ChatGPT does); 
       * instead, extract the numerical meaning (the vector features) of the words."
       */
      this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      this.isLocalModelReady = true;
      this.logger.log('Local embedding model initialized successfully (384 dimensions).');

    } catch (error) {
      this.isLocalModelReady = false;
      this.logger.warn(
        `Local @xenova/transformers model not ready yet (${error instanceof Error ? error.message : String(error)}). Will use fallback embedding method.`,
      );
    }
  }

  /**
   * Generates a 384-dimensional vector embedding for a given text query.
   */
  // region GENERATE EMBEDDING
  async generateEmbedding(text: string): Promise<number[]> {
    const cleanText = text.replace(/\n+/g, ' ').trim();

    // 1. Try local in-process model if ready
    if (this.isLocalModelReady && this.extractor) {
      try {
        const output = await this.extractor(cleanText, {
          pooling: 'mean',
          normalize: true,
        });
        return Array.from(output.data);
      } catch (err) {
        this.logger.warn(`Local embedding extraction failed: ${err}`);
      }
    }

    // 2. Fallback: Fast deterministic semantic hash embedding generator (384 floats)
    // Ensures the system never crashes or hangs even if offline or before model download
    return this.generateDeterministicVector(cleanText, 384);
  }

  /**
   * Deterministic vector generator producing normalized 384-float vectors
   * based on token n-grams and character hashes as a bulletproof offline fallback.
   */
  // region DETERMINISTIC VECTOR
  private generateDeterministicVector(text: string, dimensions = 384): number[] {
    const vector = new Array(dimensions).fill(0);
    const tokens = text.toLowerCase().split(/\s+/);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      let hash = 0;
      for (let j = 0; j < token.length; j++) {
        hash = (hash << 5) - hash + token.charCodeAt(j);
        hash |= 0;
      }

      const index = Math.abs(hash) % dimensions;
      const weight = 1.0 / Math.sqrt(i + 1);
      vector[index] += weight;

      // Bigram feature
      if (i > 0) {
        const bigram = `${tokens[i - 1]}_${token}`;
        let biHash = 0;
        for (let k = 0; k < bigram.length; k++) {
          biHash = (biHash << 5) - biHash + bigram.charCodeAt(k);
          biHash |= 0;
        }
        const biIndex = Math.abs(biHash) % dimensions;
        vector[biIndex] += weight * 0.5;
      }
    }

    // L2 Normalize
    let norm = 0;
    for (let i = 0; i < dimensions; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm) || 1.0;

    return vector.map((v) => v / norm);
  }

  get isReady(): boolean {
    return this.isLocalModelReady;
  }
}

