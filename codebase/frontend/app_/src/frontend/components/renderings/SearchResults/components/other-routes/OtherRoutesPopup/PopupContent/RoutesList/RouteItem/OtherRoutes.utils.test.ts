import { mockHotel } from 'frontend/__mocks__';
import { IOffer } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';

import { buildUrl } from './OtherRoutesItem.utils';

describe('OtherRoutesItem.utils', () => {
    describe('buildUrl', () => {
        it('should return correct URL when all parameters are provided', () => {
            const mockBuildHotelDetailsQuery = jest.fn().mockReturnValue('query-string');
            const mockHotelDetailsUrl = jest.fn().mockReturnValue('https://example.com/hotel-details?query-string');

            const result = buildUrl({
                offer: {
                    transfers: [{ code: 'T123' }],
                    date: '2023-10-01',
                    stay: 7,
                    hotel: mockHotel,
                } as IOffer,
                routeOutbound: { depPt: 'origin123', id: 'outbound123' } as IRoute,
                isPromoPage: true,
                currentPath: '/promo',
                routeInbound: { id: 'inbound123' } as IRoute,
                buildHotelDetailsQuery: mockBuildHotelDetailsQuery,
                hotelDetailsUrl: mockHotelDetailsUrl,
            });

            expect(mockBuildHotelDetailsQuery).toHaveBeenCalledWith(
                { date: '2023-10-01', hotel: mockHotel, stay: 7, transfers: [{ code: 'T123' }] },
                {
                    dtransfer: 'T123',
                    inId: 'inbound123',
                    org: ['origin123'],
                    otherRoutes: 'origin123',
                    outId: 'outbound123',
                    promo: '/promo',
                    transfer: 'T123',
                },
                { from: '01-10-2023', to: '08-10-2023' },
            );
            expect(result).toBe('https://example.com/hotel-details?query-string');
        });

        it('should return URL without promo parameter when isPromoPage is false', () => {
            const mockBuildHotelDetailsQuery = jest.fn().mockReturnValue('query-string');
            const mockHotelDetailsUrl = jest.fn().mockReturnValue('https://example.com/hotel-details?query-string');

            const result = buildUrl({
                offer: { transfers: [{ code: 'T123' }], date: '2023-10-01', stay: 7, hotel: mockHotel } as IOffer,
                routeOutbound: { depPt: 'origin123', id: 'outbound123' } as IRoute,
                isPromoPage: false,
                currentPath: '/promo',
                routeInbound: { id: 'inbound123' } as IRoute,
                buildHotelDetailsQuery: mockBuildHotelDetailsQuery,
                hotelDetailsUrl: mockHotelDetailsUrl,
            });

            expect(mockBuildHotelDetailsQuery).toHaveBeenCalledWith(
                expect.any(Object),
                expect.not.objectContaining({ Promo: '/promo' }),
                expect.any(Object),
            );
            expect(result).toBe('https://example.com/hotel-details?query-string');
        });

        it('should return URL with default transfer when no transfers are available', () => {
            const mockBuildHotelDetailsQuery = jest.fn().mockReturnValue('query-string');
            const mockHotelDetailsUrl = jest.fn().mockReturnValue('https://example.com/hotel-details?query-string');

            const result = buildUrl({
                offer: { transfers: [] as any, date: '2023-10-01', stay: 7, hotel: mockHotel } as IOffer,
                routeOutbound: { depPt: 'origin123', id: 'outbound123' } as IRoute,
                isPromoPage: false,
                currentPath: '/promo',
                routeInbound: { id: 'inbound123' } as IRoute,
                buildHotelDetailsQuery: mockBuildHotelDetailsQuery,
                hotelDetailsUrl: mockHotelDetailsUrl,
            });

            expect(mockBuildHotelDetailsQuery).toHaveBeenCalledWith(
                { date: '2023-10-01', hotel: mockHotel, stay: 7, transfers: [] },
                {
                    dtransfer: '',
                    inId: 'inbound123',
                    otherRoutes: 'origin123',
                    outId: 'outbound123',
                    transfer: '',
                },
                { from: '01-10-2023', to: '08-10-2023' },
            );
            expect(result).toBe('https://example.com/hotel-details?query-string');
        });
    });
});
