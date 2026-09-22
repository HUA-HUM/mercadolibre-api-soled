import { ApiProperty } from '@nestjs/swagger';
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
  ValidateNested,
} from 'class-validator';

export class BulkUpdateItemInputDto {
  @ApiProperty({ example: 'MLA1234567890' })
  @IsString()
  @IsNotEmpty()
  meli_item_id: string;

  @ApiProperty({ required: false, example: 5600 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiProperty({ required: false, example: 900 })
  @IsOptional()
  @IsInt()
  @Min(0)
  available_quantity?: number;
}

export class BulkUpdateItemsDto {
  @ApiProperty({ type: [BulkUpdateItemInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateItemInputDto)
  items: BulkUpdateItemInputDto[];
}
