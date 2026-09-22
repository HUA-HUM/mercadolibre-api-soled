import { NotFoundException } from '@nestjs/common';
import type { IMeliHttpClient } from 'src/core/adapters/repositories/mercadolibre/http/IMeliHttpClient';
import { GetMeliCategoryAttributesRepository } from './GetMeliCategoryAttributesRepository';

function buildHttpClientMock(response: unknown) {
  const get = jest.fn().mockResolvedValue(response);
  const client = {
    get,
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  } as unknown as IMeliHttpClient;

  return { client, get };
}

describe('GetMeliCategoryAttributesRepository', () => {
  it('marks an attribute as required when tagged required or catalog_required', async () => {
    const { client: httpClient } = buildHttpClientMock([
      {
        id: 'BRAND',
        name: 'Marca',
        value_type: 'string',
        tags: { required: true },
      },
      {
        id: 'MODEL',
        name: 'Modelo',
        value_type: 'string',
        tags: { catalog_required: true },
      },
      { id: 'COLOR', name: 'Color', value_type: 'list', tags: {} },
    ]);
    const repo = new GetMeliCategoryAttributesRepository(httpClient);

    const result = await repo.getAttributes('MLA1591');

    expect(result.attributes.find((a) => a.id === 'BRAND')?.required).toBe(
      true,
    );
    expect(result.attributes.find((a) => a.id === 'MODEL')?.required).toBe(
      true,
    );
    expect(result.attributes.find((a) => a.id === 'COLOR')?.required).toBe(
      false,
    );
  });

  it('discards attributes tagged read_only, hidden or fixed', async () => {
    const { client: httpClient } = buildHttpClientMock([
      { id: 'A', name: 'A', value_type: 'string', tags: { read_only: true } },
      { id: 'B', name: 'B', value_type: 'string', tags: { hidden: true } },
      { id: 'C', name: 'C', value_type: 'string', tags: { fixed: true } },
      { id: 'D', name: 'D', value_type: 'string', tags: {} },
    ]);
    const repo = new GetMeliCategoryAttributesRepository(httpClient);

    const result = await repo.getAttributes('MLA1591');

    expect(result.attributes.map((a) => a.id)).toEqual(['D']);
  });

  it('normalizes closed value lists into { id, name }', async () => {
    const { client: httpClient } = buildHttpClientMock([
      {
        id: 'COLOR',
        name: 'Color',
        value_type: 'list',
        tags: {},
        values: [
          { id: '52049', name: 'Blanco' },
          { id: '52053', name: 'Negro' },
        ],
      },
    ]);
    const repo = new GetMeliCategoryAttributesRepository(httpClient);

    const result = await repo.getAttributes('MLA1591');

    expect(result.attributes[0].allowed_values).toEqual([
      { id: '52049', name: 'Blanco' },
      { id: '52053', name: 'Negro' },
    ]);
  });

  it('throws NotFoundException when ML has no such category', async () => {
    const { client: httpClient } = buildHttpClientMock(null);
    const repo = new GetMeliCategoryAttributesRepository(httpClient);

    await expect(repo.getAttributes('MLA_NOPE')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('caches the result for 24h instead of calling ML again', async () => {
    const { client: httpClient, get: getMock } = buildHttpClientMock([
      { id: 'BRAND', name: 'Marca', value_type: 'string', tags: {} },
    ]);
    const repo = new GetMeliCategoryAttributesRepository(httpClient);

    await repo.getAttributes('MLA1591');
    await repo.getAttributes('MLA1591');

    expect(getMock).toHaveBeenCalledTimes(1);
  });
});
