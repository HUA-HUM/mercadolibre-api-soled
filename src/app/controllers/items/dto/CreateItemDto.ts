import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  MELI_LISTING_TYPES,
  MeliListingType,
} from 'src/core/entitis/mercadolibre/items/MeliListingType';

export class AttributeInputDto {
  @ApiProperty({ example: 'BRAND' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({ example: '9344' })
  @IsOptional()
  @IsString()
  value_id?: string;

  @ApiPropertyOptional({ example: 'Weidmuller' })
  @IsOptional()
  @IsString()
  value_name?: string;
}

export class SaleTermDto {
  @ApiProperty({ example: 'WARRANTY_TYPE' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Garantía del vendedor' })
  @IsString()
  @IsNotEmpty()
  value_name: string;
}

export class ShippingDto {
  @ApiProperty({ example: 'me2' })
  @IsString()
  @IsNotEmpty()
  mode: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  free_shipping: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Retiro en persona por el domicilio del vendedor.',
  })
  @IsOptional()
  @IsBoolean()
  local_pick_up?: boolean;

  @ApiPropertyOptional({
    example: 'xd_drop_off',
    description:
      'Modalidad logistica. "self_service" es Flex; con Flex activo ML no deja editar el tiempo de disponibilidad del producto.',
  })
  @IsOptional()
  @IsString()
  logistic_type?: string;

  @ApiPropertyOptional({
    example: [],
    description:
      'Tags de envio de ML. "self_service_in" pide Flex; mandar la lista vacia es pedir explicitamente que no lo active.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateItemDto {
  @ApiProperty({ example: 'AEB 35 SC/1' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({
    example: 'Ángulo De Fijación Lateral Weidmuller Aeb 35 Sc/1',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'MLA1591' })
  @IsString()
  @IsNotEmpty()
  category_id: string;

  @ApiProperty({ example: 5432 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 1050 })
  @IsInt()
  @Min(0)
  available_quantity: number;

  @ApiProperty({ example: 'new', enum: ['new', 'used'] })
  @IsIn(['new', 'used'])
  condition: 'new' | 'used';

  @ApiProperty({
    example: [
      'https://s3.coresagroup.com/WEIDMULLER/IMG/Fabricante/1991920000.jpg',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  pictures: string[];

  @ApiPropertyOptional({ type: [AttributeInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeInputDto)
  attributes?: AttributeInputDto[];

  @ApiPropertyOptional({
    type: [SaleTermDto],
    description:
      'Si no viene, meli-api aplica "Garantía del vendedor" / "6 meses" por defecto.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleTermDto)
  sale_terms?: SaleTermDto[];

  @ApiProperty({ type: ShippingDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => ShippingDto)
  shipping: ShippingDto;

  @ApiProperty({ example: 'Texto plano, sin HTML.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    example: ['gold_special'],
    enum: MELI_LISTING_TYPES,
    isArray: true,
    description:
      'Tipos de publicacion a crear. Si no viene, se crean los dos (gold_special y gold_pro).',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsIn(MELI_LISTING_TYPES, { each: true })
  listing_types?: MeliListingType[];
}
