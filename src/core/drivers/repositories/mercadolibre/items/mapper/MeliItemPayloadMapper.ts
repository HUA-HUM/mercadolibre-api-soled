import {
  AttributeInputDto,
  CreateItemDto,
} from 'src/app/controllers/items/dto/CreateItemDto';
import { UpdateItemDto } from 'src/app/controllers/items/dto/UpdateItemDto';
import { MeliListingType } from 'src/core/entitis/mercadolibre/items/MeliListingType';

const DEFAULT_SALE_TERMS = [
  { id: 'WARRANTY_TYPE', value_name: 'Garantía del vendedor' },
  { id: 'WARRANTY_TIME', value_name: '6 meses' },
];

const MAX_PICTURES = 10;

export interface MeliItemAttributePayload {
  id: string;
  value_id?: string;
  value_name?: string;
}

export interface MeliCreateItemPayload {
  title: string;
  category_id: string;
  price: number;
  currency_id: 'ARS';
  available_quantity: number;
  buying_mode: 'buy_it_now';
  listing_type_id: MeliListingType;
  condition: 'new' | 'used';
  seller_custom_field: string;
  pictures: { source: string }[];
  attributes: MeliItemAttributePayload[];
  sale_terms: { id: string; value_name: string }[];
  shipping: { mode: string; free_shipping: boolean };
}

/** Builds the exact body ML expects for POST /items (and /items/validate). */
export function toMeliCreatePayload(
  dto: CreateItemDto,
  listingType: MeliListingType,
): MeliCreateItemPayload {
  return {
    title: dto.title,
    category_id: dto.category_id,
    price: dto.price,
    currency_id: 'ARS',
    available_quantity: dto.available_quantity,
    buying_mode: 'buy_it_now',
    listing_type_id: listingType,
    condition: dto.condition,
    seller_custom_field: dto.sku,
    pictures: mapPictures(dto.pictures),
    attributes: buildCreateAttributes(dto),
    sale_terms: dto.sale_terms?.length ? dto.sale_terms : DEFAULT_SALE_TERMS,
    shipping: {
      mode: dto.shipping.mode,
      free_shipping: dto.shipping.free_shipping,
    },
  };
}

/** Body for PUT /items/{id}: only the fields the caller actually sent. */
export function toMeliUpdatePayload(
  dto: UpdateItemDto,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (dto.price !== undefined) payload.price = dto.price;
  if (dto.available_quantity !== undefined) {
    payload.available_quantity = dto.available_quantity;
  }
  if (dto.title !== undefined) payload.title = dto.title;
  if (dto.pictures !== undefined) payload.pictures = mapPictures(dto.pictures);
  if (dto.attributes !== undefined) {
    payload.attributes = mapAttributeInputs(dto.attributes);
  }

  return payload;
}

export function mapPictures(urls: string[]): { source: string }[] {
  return urls.slice(0, MAX_PICTURES).map((url) => ({ source: url }));
}

export function mapAttributeInputs(
  attributes: AttributeInputDto[],
): MeliItemAttributePayload[] {
  return attributes.map((attribute) => {
    const mapped: MeliItemAttributePayload = { id: attribute.id };
    if (attribute.value_id) mapped.value_id = attribute.value_id;
    if (attribute.value_name) mapped.value_name = attribute.value_name;
    return mapped;
  });
}

function buildCreateAttributes(dto: CreateItemDto): MeliItemAttributePayload[] {
  const attributes = mapAttributeInputs(dto.attributes ?? []);

  const hasSellerSku = attributes.some(
    (attribute) => attribute.id === 'SELLER_SKU',
  );
  if (!hasSellerSku) {
    attributes.push({ id: 'SELLER_SKU', value_name: dto.sku });
  }

  return attributes;
}
