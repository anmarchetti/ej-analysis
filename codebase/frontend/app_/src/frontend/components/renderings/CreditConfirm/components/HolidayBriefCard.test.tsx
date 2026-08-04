import React from 'react';
import { render, screen } from '@testing-library/react';

import { TrailingZeroDisplay } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { IBookingInfo } from 'models/data/IBookingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { HolidayBriefCard } from './HolidayBriefCard';

jest.mock('frontend/utils/getHotelLocation', () => ({ getHotelLocation: jest.fn().mockReturnValue('Hotel Location') }));

jest.mock('frontend/utils/payment.utls', () => ({ getTotalPaidAmount: jest.fn(p => p.totalPrice) }));

jest.mock('frontend/components/renderings/BoardTypes/components/BoardTypeIcon/BoardTypeIcon', () => ({
    __esModule: true,
    default: () => <div data-tid='board-image'>Board Image</div>,
}));

jest.mock('frontend/components/renderings/HotelDetails/components/TripadvisorInfo', () => ({
    __esModule: true,
    default: () => <div data-tid='trip-advisor-info' />,
}));

jest.mock('frontend/components/icons-new/CalendarLined', () => ({
    __esModule: true,
    default: () => <div data-tid='svg-calendar-lined' />,
}));

jest.mock('frontend/components/common/StarRating', () => ({
    __esModule: true,
    default: () => <div data-tid='star-rating' />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = () => ({
    booking: {
        bookingReference: '111',
        guests: [
            { lastName: 'Lead', isLead: true },
            { lastName: 'Guest', isLead: false },
        ],
        package: {
            accom: {
                startDate: '2022-01-01',
                endDate: '2022-01-07',
                hotel: {
                    name: 'Hotel Name',
                    images: [{ large: 'large' }],
                    rating: 4.5,
                    starRating: '4',
                    numberOfReviews: 100,
                },
                rooms: [
                    { boardType: { title: 'All Inclusive', iconUrl: 'AIIcon' } },
                    { boardType: { title: 'Self catering', iconUrl: 'SCIcon' } },
                ],
            },
        },
        paymentInfo: { totalPrice: 2000, pricePP: 1000 },
        currency: { code: 'GBP' },
    } as IBookingInfo,
});

let props;
let mockStores = createMockStores();

const mockHotelImageProps = jest.fn();
jest.mock('frontend/components/common/HotelImage/HotelImage', () => ({
    __esModule: true,
    default: props => {
        mockHotelImageProps(props);

        return <div data-tid='hotel-image' />;
    },
}));

const mockFormattedMoneyProps = jest.fn();
jest.mock('frontend/components/common/FormattedMoney/FormattedMoney', () => ({
    __esModule: true,
    default: props => {
        mockFormattedMoneyProps(props);

        return <div data-tid='formatted-money' />;
    },
}));

describe('<HolidayBriefCard />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores();
    });

    it('Should render full card info', () => {
        const { container } = render(<HolidayBriefCard {...props} />);
        const details = container.querySelectorAll('.holiday-brief-card__details-item span');

        expect(container.querySelector('.holiday-brief-card')).toBeInTheDocument();
        expect(container.querySelector('.holiday-brief-card__title')?.textContent).toBe('Hotel Name');
        expect(container.querySelector('.holiday-brief-card__location')).toBeInTheDocument();
        expect(screen.getByTestId('star-rating')).toBeInTheDocument();
        expect(screen.getByTestId('trip-advisor-info')).toBeInTheDocument();
        expect(details.length).toBe(3);
        expect(details[0].textContent).toBe(SitecoreDictionary.CreditConfirmHolidaySummaryGuests);
        expect(details[1].textContent).toBe(`Sat 01 Jan 2022, 6 ${SitecoreDictionary.GlobalsLabelsNightsPlural}`);
        expect(details[2].textContent).toBe('All Inclusive, Self catering');
        expect(mockFormattedMoneyProps).toHaveBeenCalledWith({
            amount: props.booking?.paymentInfo?.totalPrice,
            options: {
                currency: props.booking?.currency?.code,
                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
            },
            className: 'holiday-brief-card__price-small',
        });

        expect(screen.getByTestId('hotel-image')).toBeInTheDocument();
        expect(mockHotelImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                image: { large: 'large' },
                defaultSize: 'medium',
                fallbackImage: undefined,
                className: 'holiday-brief-card__image',
            }),
        );
    });

    it('Should render short info if accom is null', () => {
        props.booking.package.accom = null;
        const { container } = render(<HolidayBriefCard {...props} />);

        expect(container.querySelector('.holiday-brief-card__title')?.textContent).toBe('');
        expect(container.querySelectorAll('.holiday-brief-card__details-item').length).toBe(1);
        expect(container.querySelector('.holiday-brief-card__location')).not.toBeInTheDocument();
        expect(screen.queryByTestId('trip-advisor-info')).not.toBeInTheDocument();
        expect(screen.queryByTestId('board-image')).not.toBeInTheDocument();
        expect(screen.queryByTestId('svg-calendar-lined')).not.toBeInTheDocument();
    });

    it('Should not render tripadvisor rating', () => {
        props.booking.package.accom.hotel.rating = null;
        render(<HolidayBriefCard {...props} />);

        expect(screen.queryByTestId('trip-advisor-info')).not.toBeInTheDocument();
    });

    it('Should not render board info', () => {
        props.booking.package.accom.rooms = [{ boardType: {} }];
        render(<HolidayBriefCard {...props} />);

        expect(screen.queryByTestId('board-image')).not.toBeInTheDocument();
    });

    it('Should render label for one guest', () => {
        props.booking.guests = [{ lastName: 'Lead', isLead: true }];
        const { container } = render(<HolidayBriefCard {...props} />);

        expect(container.querySelectorAll('.holiday-brief-card__details-item span')[0].textContent).toBe(
            SitecoreDictionary.CreditConfirmHolidaySummaryGuest,
        );
    });

    it('Should render label for one night', () => {
        props.booking.package.accom.startDate = '2022-01-01';
        props.booking.package.accom.endDate = '2022-01-02';
        const { container } = render(<HolidayBriefCard {...props} />);

        expect(container.querySelectorAll('.holiday-brief-card__details-item span')[1].textContent).toContain(
            `1 ${SitecoreDictionary.GlobalsLabelsNightSingular}`,
        );
    });
});
