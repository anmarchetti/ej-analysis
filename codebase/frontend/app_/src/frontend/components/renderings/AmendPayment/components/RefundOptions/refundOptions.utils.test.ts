import * as utils from 'frontend/utils/viewBooking.utils';

import { getCreditField, getRefundField } from './refundOptions.utils';

const createRefundProps = () => ({
    refundData: { refund: { credit: 10, cash: 20 } },
    descriptionTemplate: 'template {cashAmount} {creditAmount} {amount}',
});

const mockFormatMoney = jest.fn(a => `£${a}`);

const createCreditProps = () => ({
    amount: `£10`,
    description: 'template {amount}',
});

let mockRefundProps;
let mockCreditProps;

describe('refundOptions.utils', () => {
    describe('getRefundField', () => {
        beforeEach(() => {
            mockRefundProps = createRefundProps();
        });

        it('should return empty value when no descriptionTemplate ', () => {
            mockRefundProps.descriptionTemplate = null;
            const refund = getRefundField(
                mockRefundProps.descriptionTemplate,
                mockFormatMoney,
                mockRefundProps.refundData,
            );

            expect(refund).toEqual({ value: '' });
        });

        it('should return values provided in props ', () => {
            jest.spyOn(utils, 'getTotalBookingRefund').mockReturnValueOnce(30);
            const refund = getRefundField(
                mockRefundProps.descriptionTemplate,
                mockFormatMoney,
                mockRefundProps.refundData,
            );

            expect(refund).toEqual({
                value: 'template <strong data-cs-mask="true">£20</strong> <strong data-cs-mask="true">£10</strong> <strong data-cs-mask="true">£30</strong>',
            });
        });

        it('should return values with 0s when no refundData', () => {
            mockRefundProps.refundData = null;
            const refund = getRefundField(
                mockRefundProps.descriptionTemplate,
                mockFormatMoney,
                mockRefundProps.refundData,
            );

            expect(refund).toEqual({
                value: 'template <strong data-cs-mask="true">£0</strong> <strong data-cs-mask="true">£0</strong> <strong data-cs-mask="true">£0</strong>',
            });
        });
    });

    describe('getCreditField', () => {
        beforeEach(() => {
            mockCreditProps = createCreditProps();
        });

        it('should return empty value when no description', () => {
            mockCreditProps.description = '';
            const credit = getCreditField(mockCreditProps.description, mockCreditProps.amount);

            expect(credit).toEqual({ value: '' });
        });

        it('should return value provided in props', () => {
            const credit = getCreditField(mockCreditProps.description, mockCreditProps.amount);

            expect(credit).toEqual({ value: 'template <strong data-cs-mask="true">£10</strong>' });
        });
    });
});
