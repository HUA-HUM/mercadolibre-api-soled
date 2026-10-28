import { MeliItemPublishRepository } from './MeliItemPublishRepository';

/** Un 409 de ML: todavia esta propagando el cierre. */
function conflicto(): Error & { status: number } {
  return Object.assign(new Error('optimistic locking'), { status: 409 });
}

function repo(put: jest.Mock) {
  return new MeliItemPublishRepository({ put } as never);
}

describe('MeliItemPublishRepository.deleteItem', () => {
  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: true });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('cierra primero y despues marca el item como eliminado', async () => {
    const put = jest
      .fn()
      .mockResolvedValueOnce({ status: 'closed', sub_status: [] })
      .mockResolvedValueOnce({ status: 'closed' });

    const result = await repo(put).deleteItem('MLA123');

    expect(put).toHaveBeenNthCalledWith(1, '/items/MLA123', {
      status: 'closed',
    });
    expect(put).toHaveBeenNthCalledWith(2, '/items/MLA123', { deleted: true });
    expect(result).toEqual({
      meli_item_id: 'MLA123',
      status: 'closed',
      deleted: true,
    });
  });

  it('reintenta el borrado si ML todavia esta propagando el cierre', async () => {
    const put = jest
      .fn()
      .mockResolvedValueOnce({ status: 'closed', sub_status: [] })
      .mockRejectedValueOnce(conflicto())
      .mockResolvedValueOnce({ status: 'closed' });

    const result = await repo(put).deleteItem('MLA123');

    expect(put).toHaveBeenCalledTimes(3);
    expect(result.deleted).toBe(true);
  });

  it('propaga un error que no sea de bloqueo optimista', async () => {
    const put = jest
      .fn()
      .mockResolvedValueOnce({ status: 'closed', sub_status: [] })
      .mockRejectedValue(
        Object.assign(new Error('no autorizado'), { status: 403 }),
      );

    await expect(repo(put).deleteItem('MLA123')).rejects.toThrow(
      'no autorizado',
    );
    expect(put).toHaveBeenCalledTimes(2);
  });
});
