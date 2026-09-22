import { CreateItemDto } from 'src/app/controllers/items/dto/CreateItemDto';
import { toMeliCreatePayload } from './MeliItemPayloadMapper';

function buildDto(overrides: Partial<CreateItemDto> = {}): CreateItemDto {
  const dto = new CreateItemDto();
  dto.sku = 'AEB 35 SC/1';
  dto.title = 'Ángulo De Fijación Lateral Weidmuller Aeb 35 Sc/1';
  dto.category_id = 'MLA1591';
  dto.price = 5432;
  dto.available_quantity = 1050;
  dto.condition = 'new';
  dto.pictures = [
    'https://s3.coresagroup.com/WEIDMULLER/IMG/Fabricante/1991920000.jpg',
  ];
  dto.attributes = [
    { id: 'BRAND', value_name: 'Weidmuller' },
    { id: 'GTIN', value_name: '4050118376722' },
  ];
  dto.shipping = { mode: 'me2', free_shipping: false };
  dto.description = 'Texto plano, sin HTML.';
  return Object.assign(dto, overrides);
}

describe('toMeliCreatePayload', () => {
  it('fixes currency_id and buying_mode, and sets listing_type_id to the requested type', () => {
    const payload = toMeliCreatePayload(buildDto(), 'gold_pro');

    expect(payload.currency_id).toBe('ARS');
    expect(payload.buying_mode).toBe('buy_it_now');
    expect(payload.listing_type_id).toBe('gold_pro');
  });

  it('converts picture URLs to { source } and caps at 10', () => {
    const dto = buildDto({
      pictures: Array.from({ length: 15 }, (_, i) => `https://x.test/${i}.jpg`),
    });

    const payload = toMeliCreatePayload(dto, 'gold_special');

    expect(payload.pictures).toHaveLength(10);
    expect(payload.pictures[0]).toEqual({ source: 'https://x.test/0.jpg' });
  });

  it('puts sku in seller_custom_field and adds SELLER_SKU as an attribute', () => {
    const payload = toMeliCreatePayload(buildDto(), 'gold_special');

    expect(payload.seller_custom_field).toBe('AEB 35 SC/1');
    expect(payload.attributes).toContainEqual({
      id: 'SELLER_SKU',
      value_name: 'AEB 35 SC/1',
    });
  });

  it('does not duplicate SELLER_SKU when the caller already sent it', () => {
    const dto = buildDto({
      attributes: [{ id: 'SELLER_SKU', value_name: 'AEB 35 SC/1' }],
    });

    const payload = toMeliCreatePayload(dto, 'gold_special');

    expect(
      payload.attributes.filter((a) => a.id === 'SELLER_SKU'),
    ).toHaveLength(1);
  });

  it('keeps value_id or value_name exactly as given for each attribute', () => {
    const dto = buildDto({
      attributes: [
        { id: 'BRAND', value_id: '9344' },
        { id: 'MODEL', value_name: 'AEB 35' },
      ],
    });

    const payload = toMeliCreatePayload(dto, 'gold_special');

    expect(payload.attributes).toContainEqual({ id: 'BRAND', value_id: '9344' });
    expect(payload.attributes).toContainEqual({ id: 'MODEL', value_name: 'AEB 35' });
  });

  it('defaults to "Garantía del vendedor" / 6 meses when sale_terms is missing', () => {
    const payload = toMeliCreatePayload(buildDto({ sale_terms: undefined }), 'gold_special');

    expect(payload.sale_terms).toEqual([
      { id: 'WARRANTY_TYPE', value_name: 'Garantía del vendedor' },
      { id: 'WARRANTY_TIME', value_name: '6 meses' },
    ]);
  });

  it('respects sale_terms when the caller provides them', () => {
    const dto = buildDto({
      sale_terms: [{ id: 'WARRANTY_TYPE', value_name: 'Garantía de fábrica' }],
    });

    const payload = toMeliCreatePayload(dto, 'gold_special');

    expect(payload.sale_terms).toEqual([
      { id: 'WARRANTY_TYPE', value_name: 'Garantía de fábrica' },
    ]);
  });

  it('passes shipping through as given, without inventing defaults', () => {
    const dto = buildDto({ shipping: { mode: 'custom', free_shipping: true } });

    const payload = toMeliCreatePayload(dto, 'gold_special');

    expect(payload.shipping).toEqual({ mode: 'custom', free_shipping: true });
  });
});
