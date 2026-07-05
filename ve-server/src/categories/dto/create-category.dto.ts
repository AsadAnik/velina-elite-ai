import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { Type } from 'class-transformer';

export class CreateCategoryDto {
    @ApiProperty({ example: 'Category Name' })
    @IsString()
    @Type(() => String)
    name: string;
}