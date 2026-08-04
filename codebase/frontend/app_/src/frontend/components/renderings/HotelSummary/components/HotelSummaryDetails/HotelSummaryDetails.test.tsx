import { render, screen } from '@testing-library/react';

import { TrailingZeroDisplay } from 'code/currency';
import { mockBooking } from 'frontend/__mocks__';
import cabinBagsInfoFieldsMocks from 'frontend/components/common/Booking/CabinBagsInfo/__mocks__/CabinBagsFields';
import luggageInfoFieldsMocks from 'frontend/components/common/Booking/LuggageInfo/__mocks__/LuggageInfoFields';

import HotelSummaryDetails, { THotelSummaryDetailsProps } from './HotelSummaryDetails';

const createProps = (): THotelSummaryDetailsProps => ({
    booking: mockBooking,
    priceTitle: 'sum',
    title: 'title',
    isTitleIconShown: false,
    cabinBagsInfoFields: cabinBagsInfoFieldsMocks(),
    luggageInfoFields: luggageInfoFieldsMocks(),
});

const mockHolidaySummaryComponent = jest.fn();

let props;

jest.mock('frontend/components/common/HolidaySummary/HolidaySummary', () => ({
    __esModule: true,
    default: props => {
        mockHolidaySummaryComponent(props);

        return <div data-tid='holiday-summary' />;
    },
}));

jest.mock('frontend/components/icons-new/HotelLargeLined', () => ({
    __esModule: true,
    default: () => <div data-tid='hotel-icon' />,
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

describe('<HotelSummaryDetails />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render holiday summary component', () => {
        render(<HotelSummaryDetails {...props} />);

        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(props.title);
        expect(screen.queryByTestId('hotel-icon')).not.toBeInTheDocument();

        expect(screen.getByTestId('hotel-summary-drawer-price-title')).toHaveTextContent(props.priceTitle);

        expect(mockHolidaySummaryComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                booking: props.booking,
                flights: props.booking.package.transport,
                transfer: props.booking.transfers[0],
                luggageInfoFields: props.luggageInfoFields,
                cabinBagsInfoFields: props.cabinBagsInfoFields,
            }),
        );
    });

    it('should display icon near the title when the isTitleIconShown prop is true', () => {
        props.isTitleIconShown = true;

        render(<HotelSummaryDetails {...props} />);

        expect(screen.getByTestId('hotel-icon')).toBeInTheDocument();
    });

    it('should render price block', () => {
        render(<HotelSummaryDetails {...props} />);

        expect(mockFormattedMoneyProps).toHaveBeenNthCalledWith(1, {
            amount: props.booking.paymentInfo.totalPrice,
            options: {
                currency: props.booking.paymentInfo.currency,
                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
            },
            className: 'price-big__subtext',
        });
    });

    it('should not display price title when it is empty', () => {
        props.priceTitle = '';

        render(<HotelSummaryDetails {...props} />);

        expect(screen.queryByTestId('hotel-summary-drawer-price-title')).not.toBeInTheDocument();
    });
});
