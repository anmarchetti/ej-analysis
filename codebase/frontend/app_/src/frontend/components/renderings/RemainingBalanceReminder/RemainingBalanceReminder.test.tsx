import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { TrailingZeroDisplay } from 'code/currency';
import { createMockStores, mockBooking, userLoginMockInfo } from 'frontend/__mocks__';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import { goPayRemainingBalance } from 'frontend/utils/payment.utls';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { getRemainingBalanceTitle } from 'frontend/components/common/Booking/RemainingBalanceReminder/RemainingBalanceReminder.utils';

import { RemainingBalanceReminder, TRemainingBalanceReminderProps } from './RemainingBalanceReminder';

jest.mock('frontend/utils/payment.utls');

jest.mock('frontend/components/common/Booking/RemainingBalanceReminder/RemainingBalanceReminder.utils', () => ({
    __esModule: true,
    getRemainingBalanceTitle: jest.fn().mockReturnValue('Title'),
    getRemainingBalanceDescription: jest.fn().mockReturnValue('Description'),
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

const mockExpandableItem = jest.fn();
jest.mock('frontend/components/common/ExpandableItem/ExpandableItem', () => ({
    __esModule: true,
    default: props => {
        mockExpandableItem(props);

        return <div data-tid={props.dataTid}>{props.children}</div>;
    },
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const mockJSSImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockFormattedMoneyProps = jest.fn();
jest.mock('frontend/components/common/FormattedMoney/FormattedMoney', () => ({
    __esModule: true,
    default: props => {
        mockFormattedMoneyProps(props);

        return <div data-tid='formatted-money' />;
    },
    MIN_FRACTION_DIGITS: 2,
}));

const createProps = (): TRemainingBalanceReminderProps => ({
    fields: {
        ButtonLabel: mockSitecoreField('ButtonLabel'),
        Icon: mockSitecoreField(mockSitecoreImageField('Icon')),
        Subtitle: mockSitecoreField('Subtitle'),
    },
    params: {},
    rendering: {},
});

let props;
let mockContext;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockContext,
}));

describe('<RemainingBalanceReminder />', () => {
    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(new Date('2023-01-01'));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    beforeEach(() => {
        mockContext = {
            booking: mockBooking,
            ...createMockStores({
                userStore: {
                    userData: userLoginMockInfo,
                },
                layoutStore: {
                    basePath: 'holidays',
                    daysBeforeDepartureToShowReminder: 10,
                },
                bookingStore: {
                    isPaymentReminderVisible: jest.fn(() => true),
                },
            }),
        };
        props = createProps();
    });

    it('should NOT render component when no fields', () => {
        delete props.fields;

        const { container } = render(<RemainingBalanceReminder {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when no booking in context', () => {
        delete mockContext.booking;

        const { container } = render(<RemainingBalanceReminder {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when isPaymentReminderVisible returns false ', () => {
        jest.spyOn(mockContext.bookingStore, 'isPaymentReminderVisible').mockReturnValueOnce(false);

        const { container } = render(<RemainingBalanceReminder {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render component for desktop', () => {
        jest.spyOn(mockContext.bookingStore, 'isPaymentReminderVisible').mockReturnValue('true');

        render(<RemainingBalanceReminder {...props} />);

        expect(screen.getByTestId('remaining-balance-reminder')).toHaveClass('balanceReminder');
        expect(mockJSSImage).toHaveBeenCalledWith({
            field: props.fields.Icon,
            className: 'icon',
            'data-tid': 'reminder-icon',
        });
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(getRemainingBalanceTitle).toHaveBeenCalled();
        expect(screen.getByRole('heading')).toHaveTextContent('Title');

        expect(screen.getByTestId('reminder-text')).toHaveTextContent('Description');
        expect(mockFormattedMoneyProps).toHaveBeenCalledWith({
            amount: mockBooking.paymentInfo.balanceDueAmount,
            className: 'decimalPart',
            options: {
                currency: mockBooking.paymentInfo.currency,
                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
            },
        });
        expect(screen.getByRole('button')).toHaveTextContent(props.fields.ButtonLabel.value);
    });

    it('should render component for mobile', () => {
        mockUseMobileViewport = true;

        render(<RemainingBalanceReminder {...props} />);

        expect(screen.getByTestId('remaining-balance-reminder')).toHaveClass('balanceReminder');

        expect(mockExpandableItem).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'expandable-reminder',
                className: 'expandable',
                titleWrapperClassName: 'titleWrapper',
                title: 'Title',
                titleClassName: 'title',
                icon: expect.anything(),
            }),
        );

        expect(screen.getByTestId('reminder-text')).toHaveTextContent('Description');
        expect(mockFormattedMoneyProps).toHaveBeenCalledWith({
            amount: mockBooking.paymentInfo.balanceDueAmount,
            className: 'decimalPart',
            options: {
                currency: mockBooking.paymentInfo.currency,
                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
            },
        });
        expect(screen.getByRole('button')).toHaveTextContent(props.fields.ButtonLabel.value);

        mockUseMobileViewport = false;
    });

    it('should call goPayRemainingBalance when click on button', async () => {
        render(<RemainingBalanceReminder {...props} />);

        const button = screen.getByRole('button');
        await fireEvent.click(button);

        expect(goPayRemainingBalance).toHaveBeenCalledWith(
            mockBooking,
            mockContext.userStore.userData,
            mockContext.layoutStore.basePath,
        );
    });
});
