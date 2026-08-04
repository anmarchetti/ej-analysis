import { INestedObject } from '@sitecore/engage/types/lib/utils/flatten-object';

import { OrderCheckoutPayment } from 'frontend/store/base/tracking/sitecore/constants';
import { PaymentType } from 'models/enum/PaymentType';

export const MAX_PROFILE_VALUE = 10;

export const getPaymentType = (
    selectedPaymentType: string,
    amountToPay: number,
    credits?: number,
): OrderCheckoutPayment => {
    const isPartialPayment = !!credits;

    if (isPartialPayment && amountToPay > 0) {
        if (selectedPaymentType === PaymentType.Card) {
            return OrderCheckoutPayment.PartialCredit;
        } else if (selectedPaymentType === PaymentType.ApplePay) {
            return OrderCheckoutPayment.PartialApplePayCredit;
        }
    }

    if (isPartialPayment && amountToPay <= 0) {
        return OrderCheckoutPayment.Credit;
    }

    if (selectedPaymentType === PaymentType.ApplePay) {
        return OrderCheckoutPayment.ApplePay;
    }

    return OrderCheckoutPayment.Card;
};

export const getProfileData = (
    layoutPageProfile: INestedObject | undefined,
    urlPageProfile: string,
): INestedObject | undefined => {
    if (!layoutPageProfile && !urlPageProfile) {
        return undefined;
    }

    return layoutPageProfile || getCustomProfileData(urlPageProfile);
};

const getCustomProfileData = (profile: string): INestedObject => ({
    hotelTheme: {
        beach: 0,
        city: 0,
        lakes: 0,
        [profile]: MAX_PROFILE_VALUE,
    },
});
