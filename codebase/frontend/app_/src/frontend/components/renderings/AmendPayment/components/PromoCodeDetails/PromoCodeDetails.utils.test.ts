import { CurrencyCode } from 'code/currency';
import { IApiInnerError } from 'models/data/ApiErrorData';
import { PromocodeStatuses } from 'models/data/IPromocode';

import {
    getPromocodeHeading,
    getPromocodeTitleFieldByStatus,
    getShouldShowPromocode,
    getTransferPromocodeSubtextByStatus,
} from './PromoCodeDetails.utils';

describe('PromoCodeDetails.utils', () => {
    // eslint-disable-next-line
    const { mockPromoCodeFields } = require('./PromoCodeDetails.test');

    describe('getTransferPromocodeSubtextByStatus', () => {
        it('Should return errors for upgrade status', () => {
            const result = getTransferPromocodeSubtextByStatus(
                PromocodeStatuses.TIER_UPGRADE,
                mockPromoCodeFields,
                jest.fn(value => `${CurrencyCode.GBP} ${value}`),
                CurrencyCode.GBP,
                'PromoCode',
                [{ code: 'errorCode', message: 'Error message' }],
            ) as IApiInnerError[];

            expect(result.length).toBe(1);
            expect(result[0].code).toBe(PromocodeStatuses.TIER_UPGRADE);
            expect(result[0].message).toBe('PromoCodeUpdatedSubtext');
        });

        it('Should return errors for downgrade status', () => {
            const result = getTransferPromocodeSubtextByStatus(
                PromocodeStatuses.TIER_DOWNGRADE,
                mockPromoCodeFields,
                jest.fn(value => `${CurrencyCode.GBP} ${value}`),
                CurrencyCode.GBP,
                'PromoCode',
                [{ code: 'errorCode', message: 'Error message' }],
            ) as IApiInnerError[];

            expect(result.length).toBe(1);
            expect(result[0].code).toBe(PromocodeStatuses.TIER_DOWNGRADE);
            expect(result[0].message).toBe('PromoCodeDowngradedSubtext');
        });

        it('Should return errors for removed status', () => {
            const result = getTransferPromocodeSubtextByStatus(
                PromocodeStatuses.PROMOCODE_REMOVED,
                mockPromoCodeFields,
                jest.fn(value => `${CurrencyCode.GBP} ${value}`),
                CurrencyCode.GBP,
                'PromoCode',
                undefined,
            ) as IApiInnerError[];

            expect(result.length).toBe(1);
            expect(result[0].code).toBe(PromocodeStatuses.PROMOCODE_REMOVED);
            expect(result[0].message).toBe('PromoCodeRemovedDefaultError');
        });

        it('Should return errors for error status', () => {
            const result = getTransferPromocodeSubtextByStatus(
                PromocodeStatuses.ERROR,
                mockPromoCodeFields,
                jest.fn(value => `${CurrencyCode.GBP} ${value}`),
                CurrencyCode.GBP,
                'PromoCode',
                undefined,
            ) as IApiInnerError[];

            expect(result.length).toBe(1);
            expect(result[0].code).toBe(PromocodeStatuses.ERROR);
            expect(result[0].message).toBe('PromoCodeErrorSubtext');
        });

        it('Should return undefined for applied status', () => {
            const result = getTransferPromocodeSubtextByStatus(
                PromocodeStatuses.APPLIED_ORIGINALLY,
                mockPromoCodeFields,
                jest.fn(value => `${CurrencyCode.GBP} ${value}`),
                CurrencyCode.GBP,
                'PromoCode',
                undefined,
            ) as IApiInnerError[];

            expect(result).toBe(undefined);
        });

        it('Should return passed errors for removed status', () => {
            const result = getTransferPromocodeSubtextByStatus(
                PromocodeStatuses.PROMOCODE_REMOVED,
                mockPromoCodeFields,
                jest.fn(value => `${CurrencyCode.GBP} ${value}`),
                CurrencyCode.GBP,
                'PromoCode',
                [{ code: 'errorCode', message: 'Error message' }],
            ) as IApiInnerError[];

            expect(result.length).toBe(1);
            expect(result[0].code).toBe('errorCode');
            expect(result[0].message).toBe('Error message');
        });

        it('Should return passed errors for tier status and when promo code has not been provided', () => {
            const result = getTransferPromocodeSubtextByStatus(
                PromocodeStatuses.TIER_DOWNGRADE,
                mockPromoCodeFields,
                jest.fn(value => `${CurrencyCode.GBP} ${value}`),
                CurrencyCode.GBP,
                undefined,
                [{ code: 'errorCode', message: 'Error message' }],
            ) as IApiInnerError[];

            expect(result.length).toBe(1);
            expect(result[0].code).toBe('errorCode');
            expect(result[0].message).toBe('Error message');
        });

        it('Should return an empty array for tier status when promo code and errors have not been provided', () => {
            const result = getTransferPromocodeSubtextByStatus(
                PromocodeStatuses.TIER_UPGRADE,
                mockPromoCodeFields,
                jest.fn(value => `${CurrencyCode.GBP} ${value}`),
                CurrencyCode.GBP,
                undefined,
                undefined,
            ) as IApiInnerError[];

            expect(result.length).toBe(0);
        });
    });

    describe('getPromocodeTitleFieldByStatus', () => {
        it('Should return title for removed status', () => {
            const result = getPromocodeTitleFieldByStatus(PromocodeStatuses.PROMOCODE_REMOVED, mockPromoCodeFields);

            expect(result.value).toBe('PromoCodeRemovedTitle');
        });

        it('Should return title for error status', () => {
            const result = getPromocodeTitleFieldByStatus(PromocodeStatuses.ERROR, mockPromoCodeFields);

            expect(result.value).toBe('PromoCodeErrorTitle');
        });

        it('Should return title by default when promo code has not been provided', () => {
            const result = getPromocodeTitleFieldByStatus(undefined, mockPromoCodeFields);

            expect(result.value).toBe('PromoCodeChangedTitle');
        });
    });

    describe('getPromocodeHeading', () => {
        it('Should return title for removed status', () => {
            const result = getPromocodeHeading(PromocodeStatuses.PROMOCODE_REMOVED, mockPromoCodeFields);

            expect(result.value).toBe('PromoCodeRemovedHeading');
        });

        it('Should return title for update status', () => {
            const result = getPromocodeHeading(PromocodeStatuses.TIER_UPGRADE, mockPromoCodeFields);

            expect(result.value).toBe('PromoCodeUpdatedHeading');
        });

        it('Should return upgrade status by default when status has not been provided', () => {
            const result = getPromocodeHeading(undefined, mockPromoCodeFields);

            expect(result.value).toBe('PromoCodeUpdatedHeading');
        });

        it('Should return title for downgrade status', () => {
            const result = getPromocodeHeading(PromocodeStatuses.TIER_DOWNGRADE, mockPromoCodeFields);

            expect(result.value).toBe('PromoCodeDowngradeHeading');
        });
    });

    describe('getShouldShowPromocode', () => {
        it('Should return true when promo code in allowed list', () => {
            const result = getShouldShowPromocode(PromocodeStatuses.PROMOCODE_REMOVED);

            expect(result).toBe(true);
        });

        it('Should return false when promo code is not in allowed list', () => {
            const result = getShouldShowPromocode(PromocodeStatuses.APPLIED_ORIGINALLY);

            expect(result).toBe(false);
        });

        it('Should return false when promo code is not provided', () => {
            const result = getShouldShowPromocode(undefined);

            expect(result).toBe(false);
        });
    });
});
