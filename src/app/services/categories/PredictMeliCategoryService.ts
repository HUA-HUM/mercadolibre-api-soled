import { Inject, Injectable } from '@nestjs/common';
import type { IPredictMeliCategoryRepository } from 'src/core/adapters/repositories/mercadolibre/categories/IPredictMeliCategoryRepository';
import { CategoryPrediction } from 'src/core/entitis/mercadolibre/categories/CategoryPrediction';

@Injectable()
export class PredictMeliCategoryService {
  constructor(
    @Inject('IPredictMeliCategoryRepository')
    private readonly repo: IPredictMeliCategoryRepository,
  ) {}

  async predict(title: string, limit: number): Promise<CategoryPrediction[]> {
    return this.repo.predict(title, limit);
  }
}
