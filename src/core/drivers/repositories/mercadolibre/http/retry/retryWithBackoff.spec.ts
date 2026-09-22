import { AxiosError, AxiosHeaders } from 'axios';
import { retryWithBackoff } from './retryWithBackoff';

function axiosErrorWithStatus(
  status: number,
  headers: Record<string, string> = {},
): AxiosError {
  const error = new AxiosError('request failed');
  error.response = {
    status,
    data: {},
    statusText: '',
    headers: new AxiosHeaders(headers),
    config: { headers: new AxiosHeaders() } as never,
  };
  return error;
}

function networkError(): AxiosError {
  const error = new AxiosError('timeout of 15000ms exceeded');
  error.response = undefined;
  return error;
}

describe('retryWithBackoff', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the result on first success without waiting', async () => {
    const fn = jest.fn().mockResolvedValue('ok');

    const result = await retryWithBackoff(fn);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 and eventually succeeds', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(axiosErrorWithStatus(429))
      .mockResolvedValueOnce('ok');

    const promise = retryWithBackoff(fn);
    await jest.runAllTimersAsync();

    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries on 5xx and on network errors', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(axiosErrorWithStatus(503))
      .mockRejectedValueOnce(networkError())
      .mockResolvedValueOnce('ok');

    const promise = retryWithBackoff(fn);
    await jest.runAllTimersAsync();

    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry 4xx business-rule errors (400/403/404)', async () => {
    const error = axiosErrorWithStatus(400);
    const fn = jest.fn().mockRejectedValue(error);

    // No timer advancement needed: a non-retryable error rejects on the first attempt.
    await expect(retryWithBackoff(fn)).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('stops after the max attempts and rethrows the last error', async () => {
    const error = axiosErrorWithStatus(500);
    const fn = jest.fn().mockRejectedValue(error);

    const promise = retryWithBackoff(fn, { maxAttempts: 3 });
    // Attach the rejection expectation before advancing timers so the
    // rejection is never left unhandled between attempts.
    const assertion = expect(promise).rejects.toBe(error);
    await jest.runAllTimersAsync();
    await assertion;

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('never retries when retryable is false, even for a transient error', async () => {
    const error = axiosErrorWithStatus(503);
    const fn = jest.fn().mockRejectedValue(error);

    await expect(retryWithBackoff(fn, { retryable: false })).rejects.toBe(
      error,
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('waits for the Retry-After header instead of the computed backoff', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(axiosErrorWithStatus(429, { 'retry-after': '5' }))
      .mockResolvedValueOnce('ok');

    const promise = retryWithBackoff(fn);
    await jest.advanceTimersByTimeAsync(4999);
    expect(fn).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);

    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
