import { Inject, Injectable } from '@nestjs/common';
import type { IMeliHttpClient } from 'src/core/adapters/repositories/mercadolibre/http/IMeliHttpClient';
import { IMeliProductDetailRepository } from 'src/core/adapters/repositories/mercadolibre/products/get/IMeliProductDetailRepository';
import { MeliProductDetail } from 'src/core/entitis/mercadolibre/products/get/MeliProductDetail';

type MeliAttribute = {
  id?: string;
  name?: string;
  value_id?: string | null;
  value_name?: string | null;
  values?: { id?: string | null; name?: string | null }[];
};

@Injectable()
export class MeliProductDetailRepository implements IMeliProductDetailRepository {
  constructor(
    @Inject('IMeliHttpClient')
    private readonly httpClient: IMeliHttpClient,
  ) {}

  async getProductDetail(itemId: string): Promise<MeliProductDetail | null> {
    if (!itemId) return null;

    const item = await this.httpClient.get<any>(`/items/${itemId}`);
    if (!item) return null;

    const descriptionResponse = await this.httpClient
      .get<any>(`/items/${itemId}/description`)
      .catch(() => null);

    const categoryResponse = item.category_id
      ? await this.httpClient
          .get<any>(`/categories/${item.category_id}`)
          .catch(() => null)
      : null;

    const attributes = item.attributes ?? [];
    const sellerSkuAttr = this.findAttribute(attributes, ['SELLER_SKU']);
    const brandAttr = this.findAttribute(attributes, ['BRAND']);
    const modelAttr = this.findAttribute(attributes, ['MODEL']);
    const gtinAttr = this.findAttribute(attributes, [
      'GTIN',
      'EAN',
      'UPC',
      'ISBN',
      'BAR_CODE',
    ]);

    const sellerSku = sellerSkuAttr?.value_name ?? item.seller_custom_field;
    const brand = brandAttr?.value_name ?? undefined;
    const model = modelAttr?.value_name ?? undefined;
    const gtin = gtinAttr?.value_name ?? undefined;
    const pictures =
      item.pictures?.map((pic: any) => pic.secure_url ?? pic.url) ?? [];
    const categoryPath =
      categoryResponse?.path_from_root?.map((category: any) => ({
        id: category.id,
        name: category.name,
      })) ??
      [];
    const now = new Date().toISOString();
    const updatedAt = item.last_updated ?? now;

    return {
      id: item.id,
      meli_item_id: item.id,
      seller_id: item.seller_id,
      sku: sellerSku,
      categoryId: item.category_id,
      category_id: item.category_id,
      category_name: categoryResponse?.name,
      category_path: categoryPath,
      title: item.title,
      description: descriptionResponse?.plain_text ?? undefined,
      price: item.price,
      base_price: item.base_price,
      original_price: item.original_price ?? null,
      currency: item.currency_id,
      stock: item.available_quantity,
      available_quantity: item.available_quantity,
      soldQuantity: item.sold_quantity,
      sold_quantity: item.sold_quantity,
      status: item.status,
      condition: item.condition,
      condition_type: item.condition,
      permalink: item.permalink,
      thumbnail: item.thumbnail,
      pictures,
      sellerSku,
      brand,
      model,
      gtin,
      attributes,
      warranty: item.warranty,
      listing_type_id: item.listing_type_id,
      buying_mode: item.buying_mode,
      catalog_listing: item.catalog_listing ?? false,
      domain_id: item.domain_id,
      video_id: item.video_id ?? null,
      logistic_type: item.shipping?.logistic_type,
      shipping_mode: item.shipping?.mode,
      freeShipping: item.shipping?.free_shipping ?? false,
      free_shipping: item.shipping?.free_shipping ?? false,
      local_pick_up: item.shipping?.local_pick_up ?? false,
      has_variations: (item.variations?.length ?? 0) > 0,
      variations: item.variations ?? [],
      health: item.health,
      lastUpdated: updatedAt,
      raw_payload: {
        item,
        description: descriptionResponse,
        category: categoryResponse,
      },
      last_webhook_at: null,
      last_seen_at: now,
      created_at: item.date_created,
      updated_at: updatedAt,
    };
  }

  private findAttribute(
    attributes: MeliAttribute[],
    ids: string[],
  ): MeliAttribute | undefined {
    return attributes.find((attr) => attr.id && ids.includes(attr.id));
  }
}
