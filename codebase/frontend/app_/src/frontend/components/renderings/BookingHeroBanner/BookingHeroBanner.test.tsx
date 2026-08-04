import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { Tokens } from 'code/tokens';
import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import { getDateWithoutDSTOffset } from 'frontend/utils/date.utils';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getBookingRoute } from 'frontend/utils/viewBooking.utils';
import { BookingStatus } from 'models/enum/BookingStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { RouteDirection } from 'models/enum/RouteDirection';

import useBookingDestImage from './hooks/useBookingDestImage';
import { getHeroBannerTitle } from './utils/utils';
import { BookingHeroBanner, TBookingHeroBannerProps } from './BookingHeroBanner';

expect.extend(toHaveNoViolations);

const createProps = (): TBookingHeroBannerProps => ({
    fields: {
        TextAbove: mockSitecoreField('TextAbove'),
        AltTextAbove: mockSitecoreField('AltTextAbove'),
        Title: mockSitecoreField('Title'),
    },
    rendering: {},
    params: {
        ShowCountdown: '1',
    },
});

let props: TBookingHeroBannerProps;
let mockContext;

const mockHook = useBookingDestImage as jest.MockedFn<typeof useBookingDestImage>;

jest.mock('./hooks/useBookingDestImage');

jest.mock('frontend/utils/offer.utils', () => ({
    __esModule: true,
    ...jest.requireActual('frontend/utils/offer.utils'),
    containsLuxuryPromoCode: jest.fn(),
}));

jest.mock('frontend/utils/date.utils', () => ({
    ...jest.requireActual('frontend/utils/date.utils'),
    getDateWithoutDSTOffset: jest.fn(),
}));

jest.mock('frontend/utils/viewBooking.utils', () => ({
    getBookingDestination: jest.fn(() => 'Tenerife,Spain'),
    getBookingRoute: jest.fn(),
}));

jest.mock('frontend/components/renderings/BookingHeroBanner/utils/utils', () => ({
    getHeroBannerTitle: jest.fn(),
}));

const mockPlaceholderComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Placeholder: props => {
        mockPlaceholderComponent(props);

        return <div data-tid='placeholder' />;
    },
}));

const mockTimerComponent = jest.fn();
jest.mock('frontend/components/common/Booking/Header/Timer', () => ({
    __esModule: true,
    default: props => {
        mockTimerComponent(props);

        return <div data-tid='timer-component' />;
    },
}));

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return <div data-tid={props.dataId}>{props.field.value}</div>;
    },
}));

const mockLuxuryBar = jest.fn();
jest.mock('frontend/components/common/LuxuryBar/LuxuryBar', () => ({
    __esModule: true,
    default: props => {
        mockLuxuryBar(props);

        return <div data-tid='luxury-bar' />;
    },
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockContext,
}));

describe('<BookingHeroBanner />', () => {
    beforeEach(() => {
        props = createProps();
        mockContext = {
            booking: mockBooking,
            ...createMockStores({
                viewBookingStore: {
                    isEditMode: false,
                },
                userStore: {
                    isLoggedIn: true,
                },
                layoutStore: {
                    isCancelledBookingPage: false,
                },
            }),
        };
    });

    it('should render banner component', () => {
        (containsLuxuryPromoCode as jest.Mock).mockReturnValue(true);
        render(<BookingHeroBanner {...props} />);

        expect(screen.getByTestId('booking-hero-banner')).toBeInTheDocument();
        expect(mockPlaceholderComponent).toHaveBeenCalledWith({
            name: PlaceholderNames.BookingHeroTop,
            rendering: props.rendering,
        });
        expect(screen.getByTestId('booking-hero-banner-content')).toHaveClass('contentContainer luxuryContent');
        expect(mockLuxuryBar).toHaveBeenCalledWith({ label: 'Globals.Labels.LuxuryCollection' });
    });

    it('should NOT render luxury bar component', () => {
        (containsLuxuryPromoCode as jest.Mock).mockReturnValue(false);
        render(<BookingHeroBanner {...props} />);

        expect(mockLuxuryBar).not.toHaveBeenCalledWith();
        expect(screen.getByTestId('booking-hero-banner-content')).not.toHaveClass('luxuryContent');
    });

    it('should NOT render booking hero top placeholder when user is NOT logged in', () => {
        mockContext.userStore.isLoggedIn = false;
        render(<BookingHeroBanner {...props} />);

        expect(mockPlaceholderComponent).not.toHaveBeenCalled();
    });

    it('should render placeholder component if booking is cancelled on the trade portal', () => {
        mockContext.layoutStore.isTradePortal = true;
        mockContext.booking.bookingStatus = BookingStatus.Canceled;
        render(<BookingHeroBanner {...props} />);

        expect(mockPlaceholderComponent).toHaveBeenCalledWith({
            name: PlaceholderNames.BookingHeroTop,
            rendering: props.rendering,
        });
    });

    it('should render destination image', () => {
        const mockValue = 'url(dest.jpg)';
        mockHook.mockImplementationOnce(() => mockValue);

        render(<BookingHeroBanner {...props} />);

        expect(screen.getByTestId('booking-hero-banner-image').style.backgroundImage).toBe(mockValue);
    });

    describe('displaying timer', () => {
        it('should display timer when ShowCountdown is true', () => {
            const bookingDepDate = '12.12.12';
            const bookingDepDateWithOffset = '13.13.13';

            (getBookingRoute as jest.Mock).mockReturnValueOnce({ depDate: bookingDepDate });
            (getDateWithoutDSTOffset as jest.Mock).mockReturnValueOnce(bookingDepDateWithOffset);

            render(<BookingHeroBanner {...props} />);

            expect(getBookingRoute).toHaveBeenCalledWith(mockBooking, RouteDirection.Outbound);
            expect(getDateWithoutDSTOffset).toHaveBeenCalledWith(bookingDepDate);

            expect(mockTimerComponent).toHaveBeenCalledWith({
                date: bookingDepDateWithOffset,
                useAbbreviation: true,
            });
            expect(screen.getByTestId('timer-component')).toBeInTheDocument();
        });

        it('should NOT display when it is TradePortal and booking is cancelled', () => {
            mockContext.bookingStatus = BookingStatus.Canceled;
            mockContext.layoutStore.isTradePortal = true;

            render(<BookingHeroBanner {...props} />);

            expect(mockTimerComponent).not.toHaveBeenCalled();
            expect(screen.queryByTestId('timer-component')).not.toBeInTheDocument();
        });

        it('should display when it is TradePortal and booking is NOT cancelled', () => {
            mockContext.layoutStore.isTradePortal = true;
            mockContext.booking.bookingStatus = BookingStatus.Booking;
            const bookingDepDate = '12.12.12';
            const bookingDepDateWithOffset = '13.13.13';

            (getBookingRoute as jest.Mock).mockReturnValueOnce({ depDate: bookingDepDate });
            (getDateWithoutDSTOffset as jest.Mock).mockReturnValueOnce(bookingDepDateWithOffset);

            render(<BookingHeroBanner {...props} />);

            expect(mockTimerComponent).toHaveBeenCalledWith({
                date: bookingDepDateWithOffset,
                useAbbreviation: true,
            });
            expect(screen.getByTestId('timer-component')).toBeInTheDocument();
        });

        it('should NOT display when no departure date', () => {
            (getBookingRoute as jest.Mock).mockReturnValueOnce(null);

            render(<BookingHeroBanner {...props} />);

            expect(getBookingRoute).toHaveBeenCalledWith(mockContext.viewBookingStore.booking, RouteDirection.Outbound);
            expect(mockTimerComponent).not.toHaveBeenCalled();
            expect(screen.queryByTestId('timer-component')).not.toBeInTheDocument();
        });

        it('should NOT display when ShowCountdown is false', () => {
            props.params.ShowCountdown = undefined;

            render(<BookingHeroBanner {...props} />);

            expect(getBookingRoute).toHaveBeenCalledWith(mockContext.viewBookingStore.booking, RouteDirection.Outbound);
            expect(mockTimerComponent).not.toHaveBeenCalled();
            expect(screen.queryByTestId('timer-component')).not.toBeInTheDocument();
        });

        it('should NOT display when ShowCountdown is false', () => {
            props.params.ShowCountdown = undefined;

            render(<BookingHeroBanner {...props} />);

            expect(mockTimerComponent).not.toHaveBeenCalled();
            expect(screen.queryByTestId('timer-component')).not.toBeInTheDocument();
        });

        it('should NOT display when booking is cancelled', () => {
            mockContext.layoutStore.isCancelledBookingPage = true;

            render(<BookingHeroBanner {...props} />);

            expect(mockTimerComponent).not.toHaveBeenCalled();
            expect(screen.queryByTestId('timer-component')).not.toBeInTheDocument();
        });
    });

    describe('TextAbove', () => {
        it('should render original TextAbove if it is edit mode', () => {
            mockContext.layoutStore.isEditMode = true;

            render(<BookingHeroBanner {...props} />);

            expect(screen.getByTestId('banner-text-above')).toHaveTextContent(`${props.fields!.TextAbove.value}`);
        });

        it('should render modified TextAbove when it is NOT edit mode', () => {
            render(<BookingHeroBanner {...props} />);

            expect(Tokenizer.replaceToken).toHaveBeenCalledWith(
                props.fields!.TextAbove.value,
                Tokens.Name,
                mockBooking.guests[1].firstName,
            );

            expect(screen.getByTestId('banner-text-above')).toHaveTextContent('TextAbove Ann');
        });

        it('should render modified TextAboveLux when it is NOT edit mode and lux package', () => {
            (containsLuxuryPromoCode as jest.Mock).mockReturnValue(true);
            render(<BookingHeroBanner {...props} />);

            expect(Tokenizer.replaceToken).toHaveBeenCalledWith(
                props.fields!.AltTextAbove.value,
                Tokens.Name,
                mockBooking.guests[1].firstName,
            );

            expect(screen.getByTestId('banner-text-above')).toHaveTextContent('AltTextAbove Ann');
        });
    });

    describe('Title', () => {
        it('should render original title if it is edit mode', () => {
            mockContext.layoutStore.isEditMode = true;

            render(<BookingHeroBanner {...props} />);

            expect(mockRichTextWithLinks).toHaveBeenCalledWith({
                field: props.fields!.Title,
                className: 'title',
                tag: 'h1',
                dataId: 'booking-hero-banner-title',
            });
            expect(screen.getByTestId('booking-hero-banner-title')).toHaveTextContent(props.fields!.Title.value);
        });

        it('should render modified title when it is NOT edit mode', () => {
            const mockGetHeroBannerTitle = 'title';
            (getHeroBannerTitle as jest.Mock).mockReturnValueOnce(mockGetHeroBannerTitle);

            render(<BookingHeroBanner {...props} />);

            expect(getHeroBannerTitle).toHaveBeenCalledWith(props.fields?.Title.value, 'Spain', 'Tenerife');
            expect(mockRichTextWithLinks).toHaveBeenCalledWith({
                field: { value: mockGetHeroBannerTitle },
                className: 'title',
                tag: 'h1',
                dataId: 'booking-hero-banner-title',
            });
            expect(screen.getByTestId('booking-hero-banner-title')).toHaveTextContent(mockGetHeroBannerTitle);
        });
    });

    it('should not render the component when booking is not defined', () => {
        mockContext.booking = undefined;

        const { container } = render(<BookingHeroBanner {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render the component when sitecore fields are not defined', () => {
        props.fields = undefined;

        const { container } = render(<BookingHeroBanner {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<BookingHeroBanner {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
