import { QueryParamName } from 'models/enum/QueryParamName';
import SitePath from 'models/enum/SitePath';

import {
    addParamsToPath,
    buildSitecorePath,
    getPathFromLayoutPath,
    isBookingFlow,
    isHotelDetails,
    ISitecoreLayoutParams,
} from './buildSitecorePath';

describe('buildSitecorePath', () => {
    describe('isHotelDetails', () => {
        test('returns true if isBookingFlow is true and path is not in BookingFlowPages', () => {
            const query = {
                [QueryParamName.IsBookingFlow]: true,
            };
            const result = isHotelDetails(query as any, SitePath.ViewBooking);
            expect(result).toBeTruthy();
        });

        test('returns true if path no in BookingFlowPages with strict mode', () => {
            const query = {
                [QueryParamName.IsBookingFlow]: true,
            };
            const result = isHotelDetails(query as any, SitePath.ViewBooking, true);
            expect(result).toBeTruthy();
        });

        test('returns false if path exists in BookingFlowPages with strict mode', () => {
            const query = {
                [QueryParamName.IsBookingFlow]: true,
            };
            const result = isHotelDetails(query as any, SitePath.GuestsDetails, true);
            expect(result).toBeFalsy();
        });
    });

    describe('isBookingFlow', () => {
        test('returns true if search contains isBookingFlow=true', () => {
            const search = `?${QueryParamName.IsBookingFlow}=true&otherParam=value`;
            const result = isBookingFlow(search);
            expect(result).toBeTruthy();
        });
    });

    describe('addParamsToPath', () => {
        test('returns the path with appended params', () => {
            const path = '/path';
            const params = [
                ['param1', 'value1'],
                ['param2', 'value2'],
            ];
            const result = addParamsToPath(path, params);

            expect(result).toBe('/path&param1=value1&param2=value2');
        });
    });

    describe('getPathFromLayoutPath', () => {
        it('returns SitePath.Home if layoutPath is undefined', () => {
            const result = getPathFromLayoutPath(undefined as any);
            expect(result).toBe(SitePath.Home);
        });

        it('should compare layoutPath with prefixes inside', () => {
            const result = getPathFromLayoutPath('/destinations/layout-path');

            expect(result).toBe('/layout-path');
        });

        it('should return layoutPath, that not compare with prefixes inside', () => {
            const result = getPathFromLayoutPath('/any-layout-path/layout-path');
            expect(result).toBe('/any-layout-path/layout-path');
        });
    });

    describe('buildSitecorePath', () => {
        it('returns the path with appended search params', () => {
            const params: ISitecoreLayoutParams = {
                campaignId: '123',
                goal: 'checkout',
                isHotelDetails: true,
                theme: 'theme',
                accId: 'accId',
            };
            const result = buildSitecorePath('/path', params);

            expect(result[0]).toBe('/hotel-details&sc_camp=123&sc_trk=checkout&theme=theme&accId=accId');
            expect(result[1]).toBe('/path&sc_camp=123&sc_trk=checkout');
        });

        it('should return params with static path', () => {
            const params: ISitecoreLayoutParams = {
                campaignId: '123',
                goal: 'checkout',
                isHotelDetails: true,
                theme: 'theme',
                accId: 'accId',
            };
            const result = buildSitecorePath('/booking/', params);

            expect(result[0]).toBe('/booking&sc_camp=123&sc_trk=checkout');
        });

        it('should return params with empty SitecoreLayoutParams', () => {
            const params: ISitecoreLayoutParams = {};
            const result = buildSitecorePath('/path', params);

            expect(result[0]).toBe('/path');
        });
    });
});
