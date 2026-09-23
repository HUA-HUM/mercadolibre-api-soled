import type { IMeliHttpClient } from 'src/core/adapters/repositories/mercadolibre/http/IMeliHttpClient';
import { MeliApiException } from '../http/error/MeliApiException';
import { MeliItemPublishRepository } from './MeliItemPublishRepository';
import { MeliCreateItemPayload } from './mapper/MeliItemPayloadMapper';

function buildHttpClientMock(postImpl: () => Promise<unknown>) {
  return {
    get: jest.fn(),
    post: jest.fn(postImpl),
    put: jest.fn(),
    delete: jest.fn(),
  } as unknown as IMeliHttpClient;
}

const payload = {} as MeliCreateItemPayload;

describe('MeliItemPublishRepository.validate', () => {
  it('resolves with no warnings when ML accepts the item outright', async () => {
    const httpClient = buildHttpClientMock(() => Promise.resolve(undefined));
    const repo = new MeliItemPublishRepository(httpClient);

    await expect(repo.validate(payload)).resolves.toEqual({ warnings: [] });
  });

  it('treats a 400 with only warning-type causes as valid, and returns them', async () => {
    const warningsOnlyError = MeliApiException.fromMeliError(
      400,
      'shipping.lost_me1_by_user',
      'shipping.lost_me1_by_user',
      [
        { code: 'shipping.lost_me1_by_user', type: 'warning', message: '...' },
        {
          code: 'shipping.free_shipping.cost_exceeded',
          type: 'warning',
          message: '...',
        },
      ],
      false,
    );
    const httpClient = buildHttpClientMock(() =>
      Promise.reject(warningsOnlyError),
    );
    const repo = new MeliItemPublishRepository(httpClient);

    const result = await repo.validate(payload);

    expect(result.warnings).toHaveLength(2);
    expect(result.warnings.every((w) => w.type === 'warning')).toBe(true);
  });

  it('still rejects when at least one cause is a real error, even mixed with warnings', async () => {
    const mixedError = MeliApiException.fromMeliError(
      400,
      'item.attributes.missing_required',
      'The attributes [MODEL] are required.',
      [
        { code: 'shipping.lost_me1_by_user', type: 'warning', message: '...' },
        {
          code: 'item.attributes.missing_required',
          type: 'error',
          message: 'The attributes [MODEL] are required.',
        },
      ],
      false,
    );
    const httpClient = buildHttpClientMock(() => Promise.reject(mixedError));
    const repo = new MeliItemPublishRepository(httpClient);

    await expect(repo.validate(payload)).rejects.toBe(mixedError);
  });

  it('rejects meli-api-originated errors (e.g. token unavailable) even with an empty cause', async () => {
    const tokenError = MeliApiException.tokenUnavailable();
    const httpClient = buildHttpClientMock(() => Promise.reject(tokenError));
    const repo = new MeliItemPublishRepository(httpClient);

    await expect(repo.validate(payload)).rejects.toBe(tokenError);
  });
});
