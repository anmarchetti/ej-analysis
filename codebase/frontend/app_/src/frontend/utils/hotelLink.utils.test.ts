import { IOffer } from 'models/data/IOffer';

import { getHotelLinkWithPrice } from './hotelLink.utils';

describe('getHotelLinkWithPrice', () => {
    let mockOffer: IOffer;

    beforeEach(() => {
        mockOffer = {
            price: 500,
        } as IOffer;

        global.window = Object.create(window);
        Object.defineProperty(window, 'location', {
            value: { origin: 'https://www.example.com' },
            writable: true,
        });
    });

    it('should return an empty string if hotelLink is empty', () => {
        expect(getHotelLinkWithPrice(mockOffer, '')).toBe('');
    });

    it('should append searchPrice to hotelLink if price is defined', () => {
        const result = getHotelLinkWithPrice(mockOffer, '/hotel/123');
        expect(result).toBe('/hotel/123?searchPrice=500');
    });

    it('should preserve existing query parameters when adding searchPrice', () => {
        const result = getHotelLinkWithPrice(mockOffer, '/hotel/123?promo=true');
        expect(result).toBe('/hotel/123?promo=true&searchPrice=500');
    });

    it('should not add searchPrice when hotelLink already has searchPrice', () => {
        const result = getHotelLinkWithPrice(mockOffer, '/hotel/123?searchPrice=300');
        expect(result).toBe('/hotel/123?searchPrice=500');
    });

    it('should handle URLs with multiple existing parameters correctly', () => {
        const result = getHotelLinkWithPrice(mockOffer, '/hotel/123?promo=true&discount=20');
        expect(result).toBe('/hotel/123?promo=true&discount=20&searchPrice=500');
    });

    it('should correctly encode searchPrice in the URL', () => {
        mockOffer.price = 123.45;
        const result = getHotelLinkWithPrice(mockOffer, '/hotel/123');
        expect(result).toBe('/hotel/123?searchPrice=123.45');
    });
});
