import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class BulkUpdateItemInputDto {
  @ApiPropertyOptional({ example: 'MLA1234567890' })
  @IsString()
  @IsNotEmpty()
  meli_item_id: string;

  @ApiPropertyOptional({ example: 5600 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiPropertyOptional({ example: 900 })
  @IsOptional()
  @IsInt()
  @Min(0)
  available_quantity?: number;
}

/**
 * Accepts either { items: [...] } for many, or a single item flattened at
 * the top level ({ meli_item_id, price?, available_quantity? }) — no need
 * to wrap a lone MLA in an array. "items" wins if both are sent.
 */
export class BulkUpdateItemsDto {
  @ApiPropertyOptional({ type: [BulkUpdateItemInputDto] })
  @ValidateIf((dto: BulkUpdateItemsDto) => dto.items !== undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateItemInputDto)
  items?: BulkUpdateItemInputDto[];

  @ApiPropertyOptional({
    example: 'MLA1234567890',
    description: 'Solo si no mandás "items": actualiza un único ítem.',
  })
  @ValidateIf((dto: BulkUpdateItemsDto) => dto.items === undefined)
  @IsString()
  @IsNotEmpty()
  meli_item_id?: string;

  @ApiPropertyOptional({ example: 5600 })
  @ValidateIf((dto: BulkUpdateItemsDto) => dto.items === undefined)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiPropertyOptional({ example: 900 })
  @ValidateIf((dto: BulkUpdateItemsDto) => dto.items === undefined)
  @IsOptional()
  @IsInt()
  @Min(0)
  available_quantity?: number;
}

/** Normalizes either accepted shape into a plain items array. */
export function resolveBulkUpdateItems(
  dto: BulkUpdateItemsDto,
): BulkUpdateItemInputDto[] {
  if (dto.items) return dto.items;

  const single = new BulkUpdateItemInputDto();
  single.meli_item_id = dto.meli_item_id as string;
  single.price = dto.price;
  single.available_quantity = dto.available_quantity;
  return [single];
}
