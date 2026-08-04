import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { NumberFormatPartTypes } from 'frontend/store/base';
import { IBookingInfo } from 'models/data/IBookingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';

import { CreditConfirm, TCreditConfirmProps } from './CreditConfirm';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
    useEffect: f => f(),
}));

jest.mock('frontend/utils/ui.utils', () => ({
    ...jest.requireActual('frontend/utils/ui.utils'),
    scrollToErrorBlock: jest.fn(),
}));

const mockBreadcrumbsProps = jest.fn();
jest.mock('frontend/components/renderings/DestinationBreadcrumbs', () => (props: any) => {
    mockBreadcrumbsProps(props);

    return <div data-tid='breadcrumbs' />;
});

const mockRefundOptionsProps = jest.fn();
jest.mock('./components/RefundOptions', () => (props: any) => {
    mockRefundOptionsProps(props);

    return <div data-tid='refund-options' />;
});

const mockRefundSummaryProps = jest.fn();
jest.mock('./components/RefundSummary', () => (props: any) => {
    mockRefundSummaryProps(props);

    return <div data-tid='refund-summary' />;
});

const mockConfirmationCheckboxProps = jest.fn();
jest.mock('frontend/components/common/ConfirmationInfo/ConfirmationCheckbox', () => (props: any) => {
    mockConfirmationCheckboxProps(props);

    return <div data-tid='confirmation-checkbox' />;
});

const mockHolidayBriefCardProps = jest.fn();
jest.mock('./components/HolidayBriefCard', () => props => {
    mockHolidayBriefCardProps(props);

    return <div data-tid='holiday-brief-card' />;
});

jest.mock('frontend/components/common/RichTextWithLinks', () => (props: any) => (
    <div data-tid='rtl' className={props.className}>
        RichTextWithLinks
    </div>
));

const booking = {
    bookingReference: '111',
    package: { accom: { startDate: '2021-01-01' } },
    guests: [
        { lastName: 'Lead', isLead: true },
        { lastName: 'Guest', isLead: false },
    ],
    refund: {
        credit: {
            isEligible: true,
            credit: 2100,
        },
        refund: {
            isEligible: true,
            credit: 100,
            cash: 2000,
        },
    },
} as IBookingInfo;

const createProps: () => TCreditConfirmProps = () => ({
    fields: {
        CreditIntro: { value: 'CreditIntro' },
        RefundIntro: { value: 'RefundIntro' },
        CreditTermsConditionsTitle: { value: 'TermsConditionsTitle' },
        CreditTermsConditionsText: { value: 'TermsConditionsText' },
        CreditConfirmDescription: { value: 'ConfirmDescription' },
        IsCreditSelected: { value: true },
        CreditCardDescription: { value: 'CreditCardDescription' },
        RefundCardDescription: { value: 'RefundCardDescription' },
        RefundPopupInfo: { value: 'RefundPopupInfo' },
        RefundCreditConfirmDescription: { value: 'RefundCreditConfirmDescription' },
        RefundCreditTermsConditionsText: { value: 'RefundCreditTermsConditionsText' },
        RefundCreditTermsConditionsTitle: { value: 'RefundCreditTermsConditionsTitle' },
    },
    params: {} as any,
    rendering: {},
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            getBreadcrumb: jest.fn(path => ({ value: path })),
        },
        holidayCreditStore: {
            initializeCreditConfirmPage: jest.fn(),
            booking: booking,
            isCreditBookingFailed: false,
            isCreditBookingLoading: false,
            togglePolicy: jest.fn(),
            confirmPolicy: false,
            shouldConfirmPolicy: false,
            onForcePolicyError: jest.fn(),
            creditBooking: jest.fn(),
        },
        trackingStore: {
            fireViewBookingEvent: jest.fn(),
        },
        marketStore: {
            formatMoneyToIntegerAndDecimal: jest.fn(() => []),
            formatMoneyToIntegerAndDecimalWithTypes: jest.fn(() => [
                { type: NumberFormatPartTypes.Currency, value: '£' },
                { type: NumberFormatPartTypes.Integer, value: '0' },
                { type: NumberFormatPartTypes.Decimal, value: '.00' },
            ]),
        },
    });

let props;
let mockStores = createStores();

describe('<CreditConfirm />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should not render if no fields', () => {
        (props as any).fields = null;

        const { container } = render(<CreditConfirm {...(props as any)} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render if no booking', () => {
        mockStores.holidayCreditStore.booking = null as any;

        const { container } = render(<CreditConfirm {...(props as any)} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render Credit Only Page', () => {
        mockStores.holidayCreditStore.booking = {
            ...booking,
            refund: { ...booking.refund, refund: { ...booking.refund.refund, isEligible: false } },
        } as any;

        render(<CreditConfirm {...(props as any)} />);

        expect(mockStores.holidayCreditStore.initializeCreditConfirmPage).toHaveBeenCalled();

        expect(mockBreadcrumbsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                breadcrumbs: [
                    { value: SitePath.ViewBookings },
                    { value: SitePath.ViewBooking },
                    {
                        value: SitePath.ConfirmHolidayCredit,
                        key: SitecoreDictionary.PathBreadcrumbsLabelsCreditMyHoliday,
                    },
                ],
                isOpaqueStyle: true,
                hideHomeBreadcrumb: true,
            }),
        );

        expect(screen.getByText('RichTextWithLinks')).toHaveClass('credit-confirm__intro');
        expect(screen.getByTestId('confirmation-checkbox')).toBeInTheDocument();
        expect(screen.queryByTestId('refund-options')).not.toBeInTheDocument();
        expect(screen.getByTestId('refund-summary')).toBeInTheDocument();

        const summaryProps = (mockRefundSummaryProps as jest.Mock).mock.calls.at(-1)?.[0];

        expect(summaryProps.isCreditOnlyRefund).toBe(true);
        expect(summaryProps.isDisabled).toBe(true);
    });

    it('should render Refund Page with Credit selected', () => {
        mockStores.holidayCreditStore.booking = {
            ...booking,
            refund: { ...booking.refund, refund: { ...booking.refund.refund, isEligible: true } },
        } as any;

        render(<CreditConfirm {...(props as any)} />);

        expect(mockBreadcrumbsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                breadcrumbs: expect.arrayContaining([
                    expect.objectContaining({
                        value: SitePath.ConfirmHolidayCredit,
                        key: SitecoreDictionary.PathBreadcrumbsLabelsRefundMyHoliday,
                    }),
                ]),
            }),
        );

        expect(screen.getByTestId('confirmation-checkbox')).toBeInTheDocument();
        expect(screen.getByTestId('refund-options')).toBeInTheDocument();
        expect(screen.getByTestId('refund-summary')).toBeInTheDocument();

        const ro = (mockRefundOptionsProps as jest.Mock).mock.calls.at(-1)?.[0];
        expect(ro.isCreditOnlyRefund).toBe(true);

        const rs = (mockRefundSummaryProps as jest.Mock).mock.calls.at(-1)?.[0];
        expect(rs.isCreditOnlyRefund).toBe(true);
    });

    it('should render Refund Page with Refund selected', () => {
        mockStores.holidayCreditStore.booking = {
            ...booking,
            refund: { ...booking.refund, refund: { ...booking.refund.refund, isEligible: true } },
        } as any;
        (props as any).fields.IsCreditSelected.value = false;

        render(<CreditConfirm {...(props as any)} />);

        const ro = (mockRefundOptionsProps as jest.Mock).mock.calls.at(-1)?.[0];
        expect(ro.isCreditOnlyRefund).toBe(false);

        const rs = (mockRefundSummaryProps as jest.Mock).mock.calls.at(-1)?.[0];
        expect(rs.isCreditOnlyRefund).toBe(false);
    });

    describe('onConfirm()', () => {
        it('should call creditBooking on confirm if no policy error', () => {
            mockStores.holidayCreditStore.confirmPolicy = true;
            mockStores.holidayCreditStore.booking = {
                ...booking,
                refund: { ...booking.refund, refund: { ...booking.refund.refund, isEligible: true } },
            } as any;

            render(<CreditConfirm {...(props as any)} />);

            const form = document.querySelector('form.credit-confirm') as HTMLFormElement;

            fireEvent.submit(form);

            expect(mockStores.holidayCreditStore.onForcePolicyError).toHaveBeenCalledWith(true);
            expect(mockStores.holidayCreditStore.creditBooking).toHaveBeenCalled();
            expect(mockStores.viewBookingStore.clearBooking).toHaveBeenCalled();

            const { scrollToErrorBlock } = jest.requireMock('frontend/utils/ui.utils');
            expect(scrollToErrorBlock).not.toHaveBeenCalled();
        });

        it('should NOT call creditBooking on confirm if there are policy errors', () => {
            mockStores.holidayCreditStore.confirmPolicy = false;

            render(<CreditConfirm {...(props as any)} />);

            const form = document.querySelector('form.credit-confirm') as HTMLFormElement;

            fireEvent.submit(form);

            expect(mockStores.holidayCreditStore.creditBooking).not.toHaveBeenCalled();
            expect(mockStores.viewBookingStore.clearBooking).not.toHaveBeenCalled();

            const { scrollToErrorBlock } = jest.requireMock('frontend/utils/ui.utils');
            expect(scrollToErrorBlock).toHaveBeenCalled();
        });
    });

    describe('ErrorMessage', () => {
        it('should render error if credit is failed', () => {
            mockStores.holidayCreditStore.isCreditBookingFailed = true;

            render(<CreditConfirm {...(props as any)} />);

            expect(document.querySelector('.error-message')).toBeInTheDocument();
        });

        it('should NOT render error if credit is NOT failed', () => {
            mockStores.holidayCreditStore.isCreditBookingFailed = false;

            render(<CreditConfirm {...(props as any)} />);

            expect(document.querySelector('.error-message')).not.toBeInTheDocument();
        });
    });
});
