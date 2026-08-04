import { mockBooking } from 'frontend/__mocks__';
import { RefundType } from 'frontend/components/renderings/ViewBooking/CancelBookingBanner/CancelBookingBanner';
import { mockRefundInfoFields } from 'frontend/components/renderings/ViewBooking/RefundInfo/mocks/refundInfoFields.mock';

import { getBannerContent } from './RefundInfo.utils';

describe('getBannerContent', () => {
    it('should return undefined when items is undefined', () => {
        const result = getBannerContent(mockBooking, undefined, false, false, false);
        expect(result).toBeUndefined();
    });

    it('should return undefined when items is empty array', () => {
        const result = getBannerContent(mockBooking, [], false, false, false);
        expect(result).toBeUndefined();
    });

    it('should return CreditAndCashRefund when eligible for both refund types', () => {
        const result = getBannerContent(mockBooking, mockRefundInfoFields.Children, false, true, true);

        expect(result).toEqual(mockRefundInfoFields.Children[0]);
    });

    it('should return OnlyCredit when eligible for credit but not original payment', () => {
        const result = getBannerContent(mockBooking, mockRefundInfoFields.Children, false, true, false);
        expect(result).toEqual(mockRefundInfoFields.Children[1]);
    });

    it('should return OriginalPayment when eligible for original payment but not credit', () => {
        const result = getBannerContent(mockBooking, mockRefundInfoFields.Children, false, false, true);
        expect(result).toEqual(mockRefundInfoFields.Children[7]);
    });

    it('should return NoRefund when not eligible for credit or original payment', () => {
        const result = getBannerContent(mockBooking, mockRefundInfoFields.Children, false, false, false);
        expect(result).toEqual(mockRefundInfoFields.Children[2]);
    });

    it('should return RefundByDestinationRule when booking has destination rules applied', () => {
        const booking = { ...mockBooking, isDestinationRulesApplied: true };
        const result = getBannerContent(booking, mockRefundInfoFields.Children, false, false, false);
        expect(result).toEqual(mockRefundInfoFields.Children[3]);
    });

    it('should return RefundByAgency when booking is external agency', () => {
        const booking = { ...mockBooking, isExternalAgency: true };
        const result = getBannerContent(booking, mockRefundInfoFields.Children, false, false, false);
        expect(result).toEqual(mockRefundInfoFields.Children[4]);
    });

    it('should return RefundUnavailable when cancellation is blocked', () => {
        const booking = { ...mockBooking, cancellationIsBlocked: true };
        const result = getBannerContent(booking, mockRefundInfoFields.Children, false, false, false);
        expect(result).toEqual(mockRefundInfoFields.Children[6]);
    });

    it('should return LessThanXHours when isLessThanXHoursAfterBooking is true', () => {
        const result = getBannerContent(mockBooking, mockRefundInfoFields.Children, true, false, false);
        expect(result).toEqual(mockRefundInfoFields.Children[5]);
    });

    it('should return undefined when no matching refund type is found', () => {
        const mockItems = [
            {
                fields: {
                    ...mockRefundInfoFields.Children[0].fields,
                    RefundType: { fields: { Value: { value: 'SomeValue' as RefundType } } },
                },
                id: '4',
            },
        ];
        const result = getBannerContent(mockBooking, mockItems, false, false, false);
        expect(result).toBeUndefined();
    });
});
