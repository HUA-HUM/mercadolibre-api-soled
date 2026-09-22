import { Inject, Injectable } from '@nestjs/common';
import type { IGetMeliCategoryAttributesRepository } from 'src/core/adapters/repositories/mercadolibre/categories/IGetMeliCategoryAttributesRepository';
import { CategoryAttributesResult } from 'src/core/entitis/mercadolibre/categories/CategoryAttribute';

@Injectable()
export class GetMeliCategoryAttributesService {
  constructor(
    @Inject('IGetMeliCategoryAttributesRepository')
    private readonly repo: IGetMeliCategoryAttributesRepository,
  ) {}

  async getAttributes(categoryId: string): Promise<CategoryAttributesResult> {
    return this.repo.getAttributes(categoryId);
  }
}
