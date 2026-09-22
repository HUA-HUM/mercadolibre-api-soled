import { Inject, Injectable } from '@nestjs/common';
import type { IMeliHttpClient } from 'src/core/adapters/repositories/mercadolibre/http/IMeliHttpClient';
import { IPredictMeliCategoryRepository } from 'src/core/adapters/repositories/mercadolibre/categories/IPredictMeliCategoryRepository';
import { CategoryPrediction } from 'src/core/entitis/mercadolibre/categories/CategoryPrediction';

type MeliDomainDiscoveryResult = {
  category_id: string;
  category_name: string;
  domain_id: string;
  domain_name: string;
};

@Injectable()
export class PredictMeliCategoryRepository implements IPredictMeliCategoryRepository {
  constructor(
    @Inject('IMeliHttpClient')
    private readonly httpClient: IMeliHttpClient,
  ) {}

  async predict(title: string, limit: number): Promise<CategoryPrediction[]> {
    const query = new URLSearchParams({ q: title, limit: String(limit) });

    const results = await this.httpClient.get<MeliDomainDiscoveryResult[]>(
      `/sites/MLA/domain_discovery/search?${query.toString()}`,
    );

    if (!results) return [];

    return results.map((r) => ({
      category_id: r.category_id,
      category_name: r.category_name,
      domain_id: r.domain_id,
      domain_name: r.domain_name,
    }));
  }
}
