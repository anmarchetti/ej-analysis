import React from 'react';
import { render, screen, within } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { Tokens } from 'code/tokens';
import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockReplaceTokens, mockTokenizer } from 'frontend/__mocks__/utils/tokenizer';

import { mockCancellationBreakdownFields } from './__mocks__/mockCancellationBreakdownFields.mocks';
import CancellationBreakdown, { TCancellationBreakdownProps } from './CancellationBreakdown';

const createProps = (): TCancellationBreakdownProps => ({
    fields: mockCancellationBreakdownFields,
    params: {},
    rendering: {},
});

const createStore = () =>
    createMockStores({
        viewBookingStore: {
            booking: {
                ...mockBooking,
                cancellationDate: '05-12-2025',
                cancelledBookingSummary: {
                    cashRefundAmount: 100,
                    creditRefundAmount: 0,
                    currency: CurrencyCode.GBP,
                    totalRefundAmount: 100,
                },
            },
        },
    });

let mockProps = createProps();
let mockStores = createStore();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid={props.dataId} />;
    },
}));

const mockTextComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextComponent(props);

        return <div data-tid={props['data-tid']} />;
    },
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceTokens: mockReplaceTokens,
    },
}));

jest.mock('frontend/utils/date.utils', () => ({
    formatDateL10n: jest.fn(n => n),
}));

describe('<CancellationBreakdown />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStore();
    });

    it('should NOT render when fields undefined', () => {
        mockProps.fields = undefined;

        const { container } = render(<CancellationBreakdown {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when cancellation summary undefined', () => {
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            cancelledBookingSummary: undefined,
        };

        const { container } = render(<CancellationBreakdown {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when booking undefined', () => {
        mockStores.viewBookingStore.booking = undefined;

        const { container } = render(<CancellationBreakdown {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render title, description with replaced booking date and bottom text', () => {
        render(<CancellationBreakdown {...mockProps} />);

        expect(screen.getByTestId('cancellation-breakdown-title')).toBeInTheDocument();
        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockProps.fields!.Title,
            className: 'header',
            tag: 'h2',
            'data-tid': 'cancellation-breakdown-title',
        });

        expect(mockTokenizer.replaceTokens).toHaveBeenCalledWith(mockProps.fields!.Subtext.value, {
            [Tokens.Date]: mockBooking.package.accom.startDate,
        });
        expect(screen.getByTestId('cancellation-breakdown-description')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: { value: mockProps.fields!.Subtext.value + ' ' + mockBooking.package.accom.startDate },
            className: 'subtext',
            dataId: 'cancellation-breakdown-description',
        });

        expect(screen.getByTestId('cancellation-breakdown-description')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.fields!.BottomText,
            className: 'bottomText',
            dataId: 'cancellation-breakdown-bottom-text',
        });
    });

    it('should render info about date and email and NOT render refund info when NO refund was made', async () => {
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            cancellationDate: '05-12-2025',
            cancelledBookingSummary: {
                cashRefundAmount: 0,
                creditRefundAmount: 0,
                currency: CurrencyCode.GBP,
                totalRefundAmount: 0,
            },
        };

        render(<CancellationBreakdown {...mockProps} />);

        expect(screen.getByTestId('cancellation-breakdown-item-date')).toHaveClass('item');
        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockCancellationBreakdownFields.Children[0].fields.Title,
            className: 'itemTitle',
            tag: 'h4',
            'data-tid': 'cancellation-breakdown-item-title',
        });
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: {
                value:
                    mockCancellationBreakdownFields.Children[0].fields.Description.value +
                    ' test@test.fr,05-12-2025,£0',
            },
            className: 'itemContent',
            dataId: 'cancellation-breakdown-item-description',
        });

        const emailItem = screen.getByTestId('cancellation-breakdown-item-email');
        expect(emailItem).toHaveClass('item');
        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockCancellationBreakdownFields.Children[1].fields.Title,
            className: 'itemTitle',
            tag: 'h4',
            'data-tid': 'cancellation-breakdown-item-title',
        });
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: {
                value:
                    mockCancellationBreakdownFields.Children[1].fields.Description.value +
                    ' test@test.fr,05-12-2025,£0',
            },
            className: 'itemContent',
            dataId: 'cancellation-breakdown-item-description',
        });
        expect(within(emailItem).queryByTestId('cancellation-breakdown-item-separator')).not.toBeInTheDocument();
        expect(screen.queryByTestId('cancellation-breakdown-item-credit-refund')).not.toBeInTheDocument();
        expect(screen.queryByTestId('cancellation-breakdown-item-original-refund')).not.toBeInTheDocument();
        expect(screen.getAllByTestId('cancellation-breakdown-item-separator')).toHaveLength(1);
    });

    it('should render info about date and email and NOT render refund info when NO refund info', async () => {
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            cancellationDate: '05-12-2025',
            cancelledBookingSummary: {},
        };

        render(<CancellationBreakdown {...mockProps} />);

        expect(screen.getByTestId('cancellation-breakdown-item-date')).toHaveClass('item');
        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockCancellationBreakdownFields.Children[0].fields.Title,
            className: 'itemTitle',
            tag: 'h4',
            'data-tid': 'cancellation-breakdown-item-title',
        });
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: {
                value:
                    mockCancellationBreakdownFields.Children[0].fields.Description.value +
                    ' test@test.fr,05-12-2025,£undefined',
            },
            className: 'itemContent',
            dataId: 'cancellation-breakdown-item-description',
        });

        const emailItem = screen.getByTestId('cancellation-breakdown-item-email');
        expect(emailItem).toHaveClass('item');
        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockCancellationBreakdownFields.Children[1].fields.Title,
            className: 'itemTitle',
            tag: 'h4',
            'data-tid': 'cancellation-breakdown-item-title',
        });
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: {
                value:
                    mockCancellationBreakdownFields.Children[1].fields.Description.value +
                    ' test@test.fr,05-12-2025,£undefined',
            },
            className: 'itemContent',
            dataId: 'cancellation-breakdown-item-description',
        });
        expect(within(emailItem).queryByTestId('cancellation-breakdown-item-separator')).not.toBeInTheDocument();
        expect(screen.queryByTestId('cancellation-breakdown-item-credit-refund')).not.toBeInTheDocument();
        expect(screen.queryByTestId('cancellation-breakdown-item-original-refund')).not.toBeInTheDocument();
        expect(screen.getAllByTestId('cancellation-breakdown-item-separator')).toHaveLength(1);
    });

    it('should render info about date, email and credit refund', async () => {
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            cancellationDate: '05-12-2025',
            cancelledBookingSummary: {
                cashRefundAmount: 0,
                creditRefundAmount: 100,
                currency: CurrencyCode.GBP,
                totalRefundAmount: 100,
            },
        };
        render(<CancellationBreakdown {...mockProps} />);

        expect(screen.getByTestId('cancellation-breakdown-item-date')).toBeInTheDocument();
        expect(screen.getByTestId('cancellation-breakdown-item-email')).toBeInTheDocument();

        const creditItem = screen.getByTestId('cancellation-breakdown-item-credit-refund');
        expect(screen.getByTestId('cancellation-breakdown-item-credit-refund')).toBeInTheDocument();
        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockCancellationBreakdownFields.Children[2].fields.Title,
            className: 'itemTitle',
            tag: 'h4',
            'data-tid': 'cancellation-breakdown-item-title',
        });
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: {
                value:
                    mockCancellationBreakdownFields.Children[2].fields.Description.value +
                    ' test@test.fr,05-12-2025,£100',
            },
            className: 'itemContent',
            dataId: 'cancellation-breakdown-item-description',
        });
        expect(within(creditItem).queryByTestId('cancellation-breakdown-item-separator')).not.toBeInTheDocument();

        expect(screen.queryByTestId('cancellation-breakdown-item-original-refund')).not.toBeInTheDocument();
        expect(screen.getAllByTestId('cancellation-breakdown-item-separator')).toHaveLength(2);
    });

    it('should render info about date, email and cash refund', async () => {
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            cancellationDate: '05-12-2025',
            cancelledBookingSummary: {
                cashRefundAmount: 100,
                creditRefundAmount: 0,
                currency: CurrencyCode.GBP,
                totalRefundAmount: 100,
            },
        };
        render(<CancellationBreakdown {...mockProps} />);

        expect(screen.getByTestId('cancellation-breakdown-item-date')).toBeInTheDocument();
        expect(screen.getByTestId('cancellation-breakdown-item-email')).toBeInTheDocument();

        const cashItem = screen.getByTestId('cancellation-breakdown-item-original-refund');
        expect(cashItem).toBeInTheDocument();
        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockCancellationBreakdownFields.Children[3].fields.Title,
            className: 'itemTitle',
            tag: 'h4',
            'data-tid': 'cancellation-breakdown-item-title',
        });
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: {
                value:
                    mockCancellationBreakdownFields.Children[3].fields.Description.value +
                    ' test@test.fr,05-12-2025,£0',
            },
            className: 'itemContent',
            dataId: 'cancellation-breakdown-item-description',
        });
        expect(within(cashItem).queryByTestId('cancellation-breakdown-item-separator')).not.toBeInTheDocument();

        expect(screen.queryByTestId('cancellation-breakdown-item-credit-refund')).not.toBeInTheDocument();
        expect(screen.getAllByTestId('cancellation-breakdown-item-separator')).toHaveLength(2);
    });

    it('should render info about date, email, credit and cash refunds', async () => {
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            cancelledBookingSummary: {
                cashRefundAmount: 100,
                creditRefundAmount: 200,
                currency: CurrencyCode.GBP,
                totalRefundAmount: 300,
            },
        };
        render(<CancellationBreakdown {...mockProps} />);

        expect(screen.getByTestId('cancellation-breakdown-item-date')).toBeInTheDocument();
        expect(screen.getByTestId('cancellation-breakdown-item-email')).toBeInTheDocument();
        expect(screen.getByTestId('cancellation-breakdown-item-original-refund')).toBeInTheDocument();
        expect(screen.getByTestId('cancellation-breakdown-item-credit-refund')).toBeInTheDocument();
        expect(screen.getAllByTestId('cancellation-breakdown-item-separator')).toHaveLength(3);
    });

    it('should render info about date only when user is NOT logged in as a lead passenger', async () => {
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            cancelledBookingSummary: {
                cashRefundAmount: 100,
                creditRefundAmount: 200,
                currency: CurrencyCode.GBP,
                totalRefundAmount: 300,
            },
            isLoggedInAsLeadPassenger: false,
        };
        render(<CancellationBreakdown {...mockProps} />);

        expect(screen.getByTestId('cancellation-breakdown-item-date')).toBeInTheDocument();
        expect(screen.queryByTestId('cancellation-breakdown-item-email')).not.toBeInTheDocument();
        expect(screen.queryByTestId('cancellation-breakdown-item-original-refund')).not.toBeInTheDocument();
        expect(screen.queryByTestId('cancellation-breakdown-item-credit-refund')).not.toBeInTheDocument();
        expect(screen.queryByTestId('cancellation-breakdown-item-separator')).not.toBeInTheDocument();
    });

    it('should render info about email and date when booking was made by external agency', async () => {
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            cancelledBookingSummary: {
                cashRefundAmount: 100,
                creditRefundAmount: 200,
                currency: CurrencyCode.GBP,
                totalRefundAmount: 300,
            },
            isLoggedInAsLeadPassenger: false,
            isExternalAgency: true,
        };
        render(<CancellationBreakdown {...mockProps} />);

        expect(screen.getByTestId('cancellation-breakdown-item-trade-booking-email')).toBeInTheDocument();
        expect(screen.getByTestId('cancellation-breakdown-item-trade-booking-date')).toBeInTheDocument();
        expect(screen.queryByTestId('cancellation-breakdown-item-date')).not.toBeInTheDocument();
        expect(screen.queryByTestId('cancellation-breakdown-item-email')).not.toBeInTheDocument();
        expect(screen.queryByTestId('cancellation-breakdown-item-original-refund')).not.toBeInTheDocument();
        expect(screen.queryByTestId('cancellation-breakdown-item-credit-refund')).not.toBeInTheDocument();
    });

    it('should render title, description with replaced booking date and bottom text for bookings made by external agency', () => {
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            cancelledBookingSummary: {
                cashRefundAmount: 100,
                creditRefundAmount: 200,
                currency: CurrencyCode.GBP,
                totalRefundAmount: 300,
            },
            isLoggedInAsLeadPassenger: false,
            isExternalAgency: true,
        };
        render(<CancellationBreakdown {...mockProps} />);

        expect(screen.getByTestId('cancellation-breakdown-title')).toBeInTheDocument();
        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockProps.fields!.Title,
            className: 'header',
            tag: 'h2',
            'data-tid': 'cancellation-breakdown-title',
        });

        expect(mockTokenizer.replaceTokens).toHaveBeenCalledWith(mockProps.fields!.TradeBookingsSubtext.value, {
            [Tokens.Date]: mockBooking.package.accom.startDate,
        });
        expect(screen.getByTestId('cancellation-breakdown-description')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: { value: mockProps.fields!.TradeBookingsSubtext.value + ' ' + mockBooking.package.accom.startDate },
            className: 'subtext',
            dataId: 'cancellation-breakdown-description',
        });

        expect(screen.getByTestId('cancellation-breakdown-description')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.fields!.TradeBookingsBottomText,
            className: 'bottomText',
            dataId: 'cancellation-breakdown-bottom-text',
        });
    });
});
