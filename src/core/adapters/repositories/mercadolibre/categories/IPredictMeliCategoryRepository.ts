import { CategoryPrediction } from 'src/core/entitis/mercadolibre/categories/CategoryPrediction';

export interface IPredictMeliCategoryRepository {
  predict(title: string, limit: number): Promise<CategoryPrediction[]>;
}
