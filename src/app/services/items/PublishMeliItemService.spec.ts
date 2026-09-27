import { CreateItemDto } from 'src/app/controllers/items/dto/CreateItemDto';
import { MeliApiException } from 'src/core/drivers/repositories/mercadolibre/http/error/MeliApiException';
import { PublishMeliItemService } from './PublishMeliItemService';

function buildDto(overrides: Partial<CreateItemDto> = {}): CreateItemDto {
  return {
    sku: 'AEB 35 SC/1',
    title: 'Ángulo de fijación lateral Weidmuller',
    category_id: 'MLA458662',
    price: 2729,
    available_quantity: 1050,
    condition: 'new',
    pictures: ['https://s3.coresagroup.com/img.jpg'],
    shipping: { mode: 'me2', free_shipping: false },
    description: 'Texto plano.',
    ...overrides,
  } as CreateItemDto;
}

function buildRepo() {
  return {
    findExistingBySku: jest.fn().mockResolvedValue([]),
    create: jest
      .fn()
      .mockImplementation((payload: { listing_type_id: string }) =>
        Promise.resolve({
          meli_item_id: `MLA-${payload.listing_type_id}`,
          permalink: 'https://articulo.mercadolibre.com.ar/MLA-1',
          status: 'active',
          sub_status: [],
          description_saved: true,
          description_error: null,
          warnings: [],
        }),
      ),
    validate: jest.fn().mockResolvedValue({ warnings: [] }),
    update: jest.fn(),
    updateDescription: jest.fn(),
    updateStatus: jest.fn(),
  };
}

describe('PublishMeliItemService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, MELI_OFFICIAL_STORE_ID: '337362' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('create', () => {
    it('sin listing_types publica los dos tipos, como siempre', async () => {
      const repo = buildRepo();
      const service = new PublishMeliItemService(repo as never);

      const response = await service.create(buildDto());

      expect(Object.keys(response.results)).toEqual([
        'gold_special',
        'gold_pro',
      ]);
      expect(repo.create).toHaveBeenCalledTimes(2);
    });

    it('con listing_types ["gold_special"] publica solo la clásica', async () => {
      const repo = buildRepo();
      const service = new PublishMeliItemService(repo as never);

      const response = await service.create(
        buildDto({ listing_types: ['gold_special'] }),
      );

      expect(Object.keys(response.results)).toEqual(['gold_special']);
      expect(repo.create).toHaveBeenCalledTimes(1);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ listing_type_id: 'gold_special' }),
        'Texto plano.',
      );
    });

    it('crea la clásica aunque ya exista la premium, si solo se pide la clásica', async () => {
      const repo = buildRepo();
      repo.findExistingBySku.mockResolvedValue([
        {
          meli_item_id: 'MLA999',
          listing_type_id: 'gold_pro',
          status: 'active',
        },
      ]);
      const service = new PublishMeliItemService(repo as never);

      const response = await service.create(
        buildDto({ listing_types: ['gold_special'] }),
      );

      expect(Object.keys(response.results)).toEqual(['gold_special']);
      expect(response.results.gold_special).toMatchObject({ ok: true });
      expect(repo.create).toHaveBeenCalledTimes(1);
    });

    it('responde 409 si ya existe el único tipo pedido', async () => {
      const repo = buildRepo();
      repo.findExistingBySku.mockResolvedValue([
        {
          meli_item_id: 'MLA111',
          listing_type_id: 'gold_special',
          status: 'active',
        },
      ]);
      const service = new PublishMeliItemService(repo as never);

      await expect(
        service.create(buildDto({ listing_types: ['gold_special'] })),
      ).rejects.toBeInstanceOf(MeliApiException);
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('validate', () => {
    it('valida solo los tipos pedidos', async () => {
      const repo = buildRepo();
      const service = new PublishMeliItemService(repo as never);

      const response = await service.validate(
        buildDto({ listing_types: ['gold_special'] }),
      );

      expect(Object.keys(response.results)).toEqual(['gold_special']);
      expect(repo.validate).toHaveBeenCalledTimes(1);
    });

    it('sin listing_types valida los dos', async () => {
      const repo = buildRepo();
      const service = new PublishMeliItemService(repo as never);

      const response = await service.validate(buildDto());

      expect(Object.keys(response.results)).toEqual([
        'gold_special',
        'gold_pro',
      ]);
    });
  });
});
