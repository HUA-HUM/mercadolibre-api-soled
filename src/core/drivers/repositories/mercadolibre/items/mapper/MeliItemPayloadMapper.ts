import { CreateItemDto } from 'src/app/controllers/items/dto/CreateItemDto';
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
    pictures: dto.pictures.slice(0, MAX_PICTURES).map((url) => ({ source: url })),
    attributes: buildAttributes(dto),
    sale_terms: dto.sale_terms?.length ? dto.sale_terms : DEFAULT_SALE_TERMS,
    shipping: {
      mode: dto.shipping.mode,
      free_shipping: dto.shipping.free_shipping,
    },
  };
}

function buildAttributes(dto: CreateItemDto): MeliItemAttributePayload[] {
  const attributes: MeliItemAttributePayload[] = (dto.attributes ?? []).map(
    (attribute) => {
      const mapped: MeliItemAttributePayload = { id: attribute.id };
      if (attribute.value_id) mapped.value_id = attribute.value_id;
      if (attribute.value_name) mapped.value_name = attribute.value_name;
      return mapped;
    },
  );

  const hasSellerSku = attributes.some((attribute) => attribute.id === 'SELLER_SKU');
  if (!hasSellerSku) {
    attributes.push({ id: 'SELLER_SKU', value_name: dto.sku });
  }

  return attributes;
}
