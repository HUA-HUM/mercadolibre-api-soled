import { Inject, Injectable } from '@nestjs/common';
import type { IMeliProductDetailRepository } from 'src/core/adapters/repositories/mercadolibre/products/get/IMeliProductDetailRepository';
import {
  MeliProductDetail,
  MeliProductDetailBulkResult,
} from 'src/core/entitis/mercadolibre/products/get/MeliProductDetail';

const BULK_CONCURRENCY = 5;

@Injectable()
export class GetMeliProductDetailService {
  constructor(
    @Inject('IMeliProductDetailRepository')
    private readonly meliProductDetailRepository: IMeliProductDetailRepository,
  ) {}

  async execute(itemId: string): Promise<MeliProductDetail | null> {
    if (!itemId) {
      throw new Error('ItemId is required');
    }

    const product =
      await this.meliProductDetailRepository.getProductDetail(itemId);

    if (!product) {
      return null;
    }

    return product;
  }

  async executeBulk(itemIds: string[]): Promise<MeliProductDetailBulkResult> {
    const uniqueItemIds = [...new Set(itemIds.map((id) => id.trim()))].filter(
      Boolean,
    );
    const results: MeliProductDetail[] = [];
    const notFound: string[] = [];

    for (
      let index = 0;
      index < uniqueItemIds.length;
      index += BULK_CONCURRENCY
    ) {
      const chunk = uniqueItemIds.slice(index, index + BULK_CONCURRENCY);
      const products = await Promise.all(
        chunk.map(async (itemId) => ({
          itemId,
          product:
            await this.meliProductDetailRepository.getProductDetail(itemId),
        })),
      );

      products.forEach(({ itemId, product }) => {
        if (product) {
          results.push(product);
          return;
        }

        notFound.push(itemId);
      });
    }

    return { results, notFound };
  }
}
