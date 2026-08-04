import { IBookingInfo } from 'models/data/IBookingInfo';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';
import { RefundType } from 'frontend/components/renderings/ViewBooking/CancelBookingBanner/CancelBookingBanner';
import { IRefundInfoItemFields } from 'frontend/components/renderings/ViewBooking/RefundInfo/RefundInfo';

export const getBannerContent = (
    booking: IBookingInfo,
    items: ISitecoreCompositeField<IRefundInfoItemFields>[] | undefined,
    isLessThanXHoursAfterBooking: boolean,
    isEligibleForCreditRefund: boolean,
    isEligibleForOriginalPaymentRefund: boolean,
): ISitecoreCompositeField<IRefundInfoItemFields> | undefined => {
    if (!items || items.length === 0) {
        return undefined;
    }

    return items.find(field => {
        const type = field.fields.RefundType?.fields?.Value?.value;

        if (booking.isExternalAgency) {
            return type === RefundType.RefundByAgency;
        }

        if (booking.cancellationIsBlocked) {
            return type === RefundType.RefundUnavailable;
        }

        if (isLessThanXHoursAfterBooking) {
            return type === RefundType.LessThanXHours;
        }

        if (booking.isDestinationRulesApplied) {
            return type === RefundType.RefundByDestinationRule;
        }

        if (!isEligibleForCreditRefund && isEligibleForOriginalPaymentRefund) {
            return type === RefundType.OriginalPayment;
        }

        if (isEligibleForCreditRefund && !isEligibleForOriginalPaymentRefund) {
            return type === RefundType.OnlyCredit;
        }

        if (!isEligibleForCreditRefund && !isEligibleForOriginalPaymentRefund) {
            return type === RefundType.NoRefund;
        }

        if (isEligibleForCreditRefund && isEligibleForOriginalPaymentRefund) {
            return type === RefundType.CreditAndCashRefund;
        }

        return undefined;
    });
};
