import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IMeliHttpClient } from 'src/core/adapters/repositories/mercadolibre/http/IMeliHttpClient';
import { IGetMeliCategoryAttributesRepository } from 'src/core/adapters/repositories/mercadolibre/categories/IGetMeliCategoryAttributesRepository';
import {
  CategoryAttribute,
  CategoryAttributesResult,
} from 'src/core/entitis/mercadolibre/categories/CategoryAttribute';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DISCARDED_TAGS = ['read_only', 'hidden', 'fixed'];

type MeliAttributeTags = Record<string, boolean> | undefined;

type MeliAttributeValue = { id?: string | null; name?: string | null };

type MeliAttribute = {
  id: string;
  name: string;
  value_type: string;
  hint?: string | null;
  tags?: MeliAttributeTags;
  values?: MeliAttributeValue[] | null;
  allowed_units?: { id?: string; name?: string }[] | null;
};

interface CacheEntry {
  data: CategoryAttributesResult;
  expiresAt: number;
}

@Injectable()
export class GetMeliCategoryAttributesRepository implements IGetMeliCategoryAttributesRepository {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    @Inject('IMeliHttpClient')
    private readonly httpClient: IMeliHttpClient,
  ) {}

  async getAttributes(categoryId: string): Promise<CategoryAttributesResult> {
    const cached = this.cache.get(categoryId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const raw = await this.httpClient.get<MeliAttribute[]>(
      `/categories/${categoryId}/attributes`,
    );

    if (!raw) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }

    const attributes = raw
      .filter((attribute) => !this.isDiscarded(attribute))
      .map((attribute) => this.normalize(attribute));

    const data: CategoryAttributesResult = {
      category_id: categoryId,
      attributes,
    };

    this.cache.set(categoryId, { data, expiresAt: Date.now() + CACHE_TTL_MS });

    return data;
  }

  // ML marks some attributes read_only/hidden/fixed on this endpoint but
  // still rejects item creation without them (item.attribute.missing_
  // conditional_required) — e.g. VALUE_ADDED_TAX / IMPORT_DUTY on some
  // categories. Never discard a conditional_required attribute, whatever
  // else it's tagged.
  private isDiscarded(attribute: MeliAttribute): boolean {
    const tags = attribute.tags;
    if (!tags) return false;
    if (tags.conditional_required) return false;
    return DISCARDED_TAGS.some((tag) => tags[tag]);
  }

  // NOTE: field names for "values"/"allowed_units" below are a best-effort
  // mapping of ML's public attributes schema. Verify against a real category
  // response during the manual smoke test (see plan) and adjust if ML's
  // current API differs.
  private normalize(attribute: MeliAttribute): CategoryAttribute {
    const tags = attribute.tags ?? {};

    return {
      id: attribute.id,
      name: attribute.name,
      value_type: attribute.value_type,
      required: Boolean(tags.required || tags.catalog_required),
      conditional_required: Boolean(tags.conditional_required),
      allowed_values: (attribute.values ?? [])
        .filter((value): value is { id: string; name: string } =>
          Boolean(value.id && value.name),
        )
        .map((value) => ({ id: value.id, name: value.name })),
      allowed_units: (attribute.allowed_units ?? [])
        .map((unit) => unit.id ?? unit.name)
        .filter((unit): unit is string => Boolean(unit)),
      hint: attribute.hint ?? null,
    };
  }
}
