import { getSitecoreFieldsBunch } from 'frontend/utils/tests.utils';
import { PromocodeStatuses } from 'models/data/IPromocode';

import * as utils from './PriceJumpPopup.utils';

const { getAmendmentDescriptionTemplate, getPriceJumpPopupOptions, getPromoCodeSubtitle, getPrices } = utils;

describe('PriceJumpPopup.utils', () => {
    describe('getPrices', () => {
        it('should call getPriceJumpPopupOptions with flight data', () => {
            const mockData = ['flight', 'transfer', 'dates', 'hotel', 'payment'].reduce(
                (acc, item) => ({
                    ...acc,
                    [item]: {
                        isPage: item === 'flight',
                        price: item === 'flight' ? 11 : 0,
                        prevPrice: item === 'flight' ? 10 : 0,
                        totalPriceToBeShown: item === 'flight' ? 23 : 0,
                    },
                }),
                {},
            );

            const result = getPrices(mockData);

            expect(result).toStrictEqual({
                deltaPrice: 1,
                totalPrice: 23,
                isPriceJumpPopupShownByPrice: true,
            });
        });
    });

    describe('getPriceJumpPopupOptions', () => {
        it('Should give 0 with hindrance below 0.5', () => {
            const { deltaPrice } = getPriceJumpPopupOptions(100, 99.97) || {};

            expect(deltaPrice).toEqual(0);
        });

        it('Should return regular delta, total and isShow', () => {
            const result = getPriceJumpPopupOptions(100, 99);

            expect(result).toEqual({ deltaPrice: 1, totalPrice: 100, isPriceJumpPopupShownByPrice: true });
        });

        it('Should return negative delta and total', () => {
            const result = getPriceJumpPopupOptions(99, 100);

            expect(result).toEqual({ deltaPrice: -1, totalPrice: 99, isPriceJumpPopupShownByPrice: true });
        });

        it('Should work with 0', () => {
            const result = getPriceJumpPopupOptions(0, 100);

            expect(result).toEqual({ deltaPrice: -100, totalPrice: 0, isPriceJumpPopupShownByPrice: true });
        });

        it('Should return isShown equals false when no price change', () => {
            const result = getPriceJumpPopupOptions(100, 100);

            expect(result).toEqual({ deltaPrice: 0, totalPrice: 100, isPriceJumpPopupShownByPrice: false });
        });

        it('Should return totalPrice rounded up', () => {
            const result = getPriceJumpPopupOptions(45.28, 100);

            expect(result).toEqual({ deltaPrice: -54, totalPrice: 46, isPriceJumpPopupShownByPrice: true });
        });

        it('Should return deltaPrice with numbers pre-rounded', () => {
            const result = getPriceJumpPopupOptions(1000, 264.32);

            expect(result).toEqual({ deltaPrice: 735, totalPrice: 1000, isPriceJumpPopupShownByPrice: true });
        });

        it('Should returns default value', () => {
            const result = getPriceJumpPopupOptions(undefined, 99.97);

            expect(result).toStrictEqual({
                deltaPrice: 0,
                totalPrice: 0,
                isPriceJumpPopupShownByPrice: false,
            });
        });
    });

    describe('getAmendmentDescriptionTemplate', () => {
        let mockedTypes: Partial<Record<'flight' | 'transfer' | 'dates', boolean>>;
        const fields = getSitecoreFieldsBunch(['DefaultDescription', 'FlightDescription', 'TransferDescription']);

        beforeEach(() => {
            mockedTypes = { flight: false, transfer: false, dates: false };
        });

        it('Should return flight description for flight', () => {
            mockedTypes.flight = true;

            expect(getAmendmentDescriptionTemplate(mockedTypes, fields)).toBe(fields.FlightDescription.value);
        });

        it('Should return transfer description for transfer', () => {
            mockedTypes.transfer = true;

            expect(getAmendmentDescriptionTemplate(mockedTypes, fields)).toBe(fields.TransferDescription.value);
        });

        it('Should return default change description for any random type of change', () => {
            mockedTypes.dates = true;

            expect(getAmendmentDescriptionTemplate(mockedTypes, fields)).toBe(fields.DefaultDescription.value);
        });
    });

    describe('getPromoCodeSubtitle', () => {
        const fields = getSitecoreFieldsBunch(['PromoUpgradeLabel', 'PromoDowngradeLabel', 'PromoRemoveLabel']);

        it('Should return value for TIER_UPGRADE status', () => {
            expect(getPromoCodeSubtitle(fields, PromocodeStatuses.TIER_UPGRADE)).toBe(fields.PromoUpgradeLabel);
        });

        it('Should return value for TIER_DOWNGRADE status', () => {
            expect(getPromoCodeSubtitle(fields, PromocodeStatuses.TIER_DOWNGRADE)).toBe(fields.PromoDowngradeLabel);
        });

        it('Should return value for PROMOCODE_REMOVED status', () => {
            expect(getPromoCodeSubtitle(fields, PromocodeStatuses.PROMOCODE_REMOVED)).toBe(fields.PromoRemoveLabel);
        });

        it('Should return undefined when status has not been provided', () => {
            expect(getPromoCodeSubtitle(fields)).toBe(undefined);
        });
    });
});
