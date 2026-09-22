import { HttpStatus } from '@nestjs/common';
import { AxiosError, AxiosHeaders } from 'axios';
import { MeliApiException } from './MeliApiException';

function meliAxiosError(status: number, data: unknown): AxiosError {
  const error = new AxiosError('Request failed');
  error.response = {
    status,
    data,
    statusText: '',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() } as never,
  };
  return error;
}

describe('MeliApiException', () => {
  describe('fromMeliError', () => {
    it('maps a 400 from ML to 422 and keeps the full cause array', () => {
      const cause = [
        {
          code: 'item.attributes.missing_required',
          type: 'error',
          message: 'The attributes [MODEL] are required for category MLA1591.',
          references: ['item.attributes'],
        },
      ];

      const exception = MeliApiException.fromMeliError(
        400,
        'item.attributes.missing_required',
        'The attributes [MODEL] are required for category MLA1591.',
        cause,
        false,
      );

      expect(exception.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(exception.getResponse()).toEqual({
        status: 400,
        code: 'item.attributes.missing_required',
        message: 'The attributes [MODEL] are required for category MLA1591.',
        source: 'meli',
        retryable: false,
        cause,
      });
    });

    it('maps a 404 from ML to 404', () => {
      const exception = MeliApiException.fromMeliError(
        404,
        'item_not_found',
        'Item not found',
      );

      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('maps any 5xx from ML to 502', () => {
      const exception = MeliApiException.fromMeliError(
        503,
        'internal_error',
        'Service unavailable',
        [],
        true,
      );

      expect(exception.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
      expect(
        (exception.getResponse() as { retryable: boolean }).retryable,
      ).toBe(true);
    });
  });

  describe('fromAxiosError', () => {
    it('extracts status/code/message/cause from a real ML error body', () => {
      const axiosError = meliAxiosError(403, {
        message: 'Metrics not available for this item.',
        error: 'forbidden',
        cause: [
          { code: 'metrics.forbidden', type: 'error', message: 'no access' },
        ],
      });

      const exception = MeliApiException.fromAxiosError(axiosError);

      expect(exception.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(exception.getResponse()).toMatchObject({
        status: 403,
        code: 'metrics.forbidden',
        message: 'Metrics not available for this item.',
        source: 'meli',
      });
    });

    it('falls back to the top-level error field when there is no cause array', () => {
      const axiosError = meliAxiosError(400, {
        message: 'bad request',
        error: 'bad_request',
      });

      const exception = MeliApiException.fromAxiosError(axiosError);

      expect(exception.getResponse()).toMatchObject({
        code: 'bad_request',
        cause: [],
      });
    });

    it('maps a network/timeout error (no response) to an upstream-timeout 502', () => {
      const axiosError = new AxiosError('timeout of 15000ms exceeded');
      axiosError.response = undefined;

      const exception = MeliApiException.fromAxiosError(axiosError);

      expect(exception.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
      expect(exception.getResponse()).toMatchObject({
        source: 'meli-api',
        retryable: true,
      });
    });
  });

  describe('skuConflict', () => {
    it('returns a 409 sourced from meli-api', () => {
      const exception = MeliApiException.skuConflict('AEB 35 SC/1', [
        { listing_type_id: 'gold_special', meli_item_id: 'MLA1' },
      ]);

      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(exception.getResponse()).toMatchObject({
        code: 'sku_already_exists',
        source: 'meli-api',
        retryable: false,
      });
    });
  });

  describe('tokenUnavailable', () => {
    it('returns a 503 sourced from meli-api', () => {
      const exception = MeliApiException.tokenUnavailable();

      expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    });
  });
});
