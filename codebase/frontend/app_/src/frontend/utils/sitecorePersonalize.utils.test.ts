import { OrderCheckoutPayment } from 'frontend/store/base/tracking/sitecore/constants';

import { getPaymentType, getProfileData, MAX_PROFILE_VALUE } from './sitecorePersonalize.utils';

jest.mock('frontend/utils/tracking/tracking.utils', () => ({
    getPageLang: (lang: string) => lang,
}));

describe('sitecorePersonalize.utils', () => {
    describe('getPaymentType', () => {
        it(
            'should return PartialCredit when the selected payment type is Card, credit has been used, ' +
                'and amount to pay is greater than 0',
            () => {
                const payment = getPaymentType(OrderCheckoutPayment.Card, 1, 1);

                expect(payment).toEqual(OrderCheckoutPayment.PartialCredit);
            },
        );

        it(
            'should return PartialApplePayCredit when the selected payment type is ApplePay, credit has been used, ' +
                'and amount to pay is greater than 0',
            () => {
                const payment = getPaymentType(OrderCheckoutPayment.ApplePay, 1, 1);

                expect(payment).toEqual(OrderCheckoutPayment.PartialApplePayCredit);
            },
        );

        it('should return ApplePay when the selected payment type is ApplePay and credit has not been used', () => {
            const payment = getPaymentType(OrderCheckoutPayment.Card, 5, 0);

            expect(payment).toEqual(OrderCheckoutPayment.Card);
        });

        it('should return Card when the selected payment type is ApplePay and credit has not been used', () => {
            const payment = getPaymentType(OrderCheckoutPayment.ApplePay, 5, 0);

            expect(payment).toEqual(OrderCheckoutPayment.ApplePay);
        });

        it('should return Credit when only credit has been used', () => {
            const payment = getPaymentType('any type', 0, 5);

            expect(payment).toEqual(OrderCheckoutPayment.Credit);
        });
    });

    describe('getProfileData', () => {
        it('should return undefined when profile is NOT provided', () => {
            const profile = getProfileData(undefined, '');

            expect(profile).toBeUndefined();
        });

        it('should return profile from layout', () => {
            const profile = getProfileData(
                {
                    hotelTheme: {
                        beach: 1,
                        city: 1,
                        lakes: 1,
                    },
                },
                'beach',
            );

            expect(profile).toStrictEqual({
                hotelTheme: {
                    beach: 1,
                    city: 1,
                    lakes: 1,
                },
            });
        });

        it('should return profile with beach value equal MAX_PROFILE_VALUE when profile is beach', () => {
            const profile = getProfileData(undefined, 'beach');

            expect(profile).toStrictEqual({
                hotelTheme: {
                    beach: MAX_PROFILE_VALUE,
                    city: 0,
                    lakes: 0,
                },
            });
        });

        it('should return profile with city value equal MAX_PROFILE_VALUE when profile is city', () => {
            const profile = getProfileData(undefined, 'city');

            expect(profile).toStrictEqual({
                hotelTheme: {
                    beach: 0,
                    city: MAX_PROFILE_VALUE,
                    lakes: 0,
                },
            });
        });

        it('should return profile with lakes value equal MAX_PROFILE_VALUE when profile is lakes', () => {
            const profile = getProfileData(undefined, 'lakes');

            expect(profile).toStrictEqual({
                hotelTheme: {
                    beach: 0,
                    city: 0,
                    lakes: MAX_PROFILE_VALUE,
                },
            });
        });

        it('should return profile with new value equal MAX_PROFILE_VALUE when profile is NOT lakes, beach or city', () => {
            const profile = getProfileData(undefined, 'test');

            expect(profile).toStrictEqual({
                hotelTheme: {
                    beach: 0,
                    city: 0,
                    lakes: 0,
                    test: MAX_PROFILE_VALUE,
                },
            });
        });
    });
});
