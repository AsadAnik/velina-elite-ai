import { PartialType } from '@nestjs/swagger';
import { CreateHomeSectionItemDto } from './create-home-section-item.dto';

export class UpdateHomeSectionItemDto extends PartialType(CreateHomeSectionItemDto) {}
