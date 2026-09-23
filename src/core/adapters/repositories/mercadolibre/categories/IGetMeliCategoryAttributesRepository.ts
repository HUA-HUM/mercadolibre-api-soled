import { CategoryAttributesResult } from 'src/core/entitis/mercadolibre/categories/CategoryAttribute';

export interface IGetMeliCategoryAttributesRepository {
  getAttributes(categoryId: string): Promise<CategoryAttributesResult>;
}
