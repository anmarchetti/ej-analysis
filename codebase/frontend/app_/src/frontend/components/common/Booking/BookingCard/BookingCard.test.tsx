import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockBooking } from 'frontend/__mocks__/booking';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import BookingCard, { IBookingCardProps } from './BookingCard';

import styles from './BookingCard.module.scss';

const createProps = (): IBookingCardProps => ({
    booking: mockBooking,
    isUpcoming: true,
    isPrevious: false,
    rendering: {
        componentName: 'BookingCard',
    },
});

let props: IBookingCardProps;
let mockStores;

const mockBookingCardDetailsComponent = jest.fn();

jest.mock('frontend/utils/offer.utils', () => ({
    __esModule: true,
    containsLuxuryPromoCode: jest.fn(),
}));

const mockJSSImageNext = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageNext(props);

        return <div data-tid='jss-image-next' />;
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <span data-tid='jss-text'>{props.field?.value}</span>;
    },
}));

jest.mock('frontend/components/common/LuxuryWrapper/LuxuryWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='luxury-wrapper'>{children}</div>,
}));

jest.mock('frontend/components/common/PackageIcons/PackageIcons', () => ({
    __esModule: true,
    default: () => <div data-tid='package-icons' />,
}));

jest.mock('frontend/components/common/OfferCardSlider/OfferCardSlider', () => ({
    __esModule: true,
    default: () => <div data-tid='offer-card-slider' />,
}));

jest.mock('./components/BookingCardHead/BookingCardHead', () => ({
    __esModule: true,
    default: () => <div data-tid='booking-card-head' />,
}));

jest.mock('./components/BookingCardOptions/BookingCardOptions', () => ({
    __esModule: true,
    default: () => <div data-tid='booking-card-options' />,
}));

jest.mock('./components/BookingCardDetails/BookingCardDetails', () => ({
    __esModule: true,
    default: props => {
        mockBookingCardDetailsComponent(props);

        return <div data-tid='booking-card-details' />;
    },
}));

jest.mock('./components/BookingCardInfo/BookingCardInfo', () => ({
    __esModule: true,
    default: () => <div data-tid='booking-card-info' />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<BookingCard />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores();
    });

    it('should standard render with upcoming holidays', () => {
        const { container } = render(<BookingCard {...props} />);

        expect(screen.getByTestId('offer-card-slider')).toBeInTheDocument();
        expect(screen.getByTestId('booking-card-head')).toBeInTheDocument();
        expect(screen.getByTestId('booking-card-options')).toBeInTheDocument();
        expect(screen.getByTestId('booking-card-details')).toBeInTheDocument();
        expect(screen.getByTestId('booking-card-info')).toBeInTheDocument();

        expect(container.getElementsByClassName(styles.fullWidth)).toHaveLength(1);
    });

    it('should render fullWidth when isPaymentReminderVisible returns true', () => {
        mockStores.bookingStore.isPaymentReminderVisible = jest.fn(() => true);

        const { container } = render(<BookingCard {...props} />);

        expect(container.getElementsByClassName(styles.fullWidth)).toHaveLength(0);
    });

    it('should NOT render luxury-specific components when not luxury package', () => {
        render(<BookingCard {...props} />);

        expect(screen.queryByTestId('luxury-wrapper')).not.toBeInTheDocument();
        expect(screen.queryByTestId('package-icons')).not.toBeInTheDocument();
    });

    describe('Luxury Package', () => {
        beforeEach(() => {
            (containsLuxuryPromoCode as jest.Mock).mockReturnValue(true);
        });

        it('should render LuxuryWrapper and PackageIcons for an UPCOMING holiday', () => {
            props.isUpcoming = true;
            props.isPrevious = false;

            render(<BookingCard {...props} />);

            expect(screen.getByTestId('luxury-wrapper')).toBeInTheDocument();
            expect(screen.getByTestId('package-icons')).toBeInTheDocument();
        });

        it('should render LuxuryWrapper and PackageIcons for a PREVIOUS holiday', () => {
            props.isUpcoming = false;
            props.isPrevious = true;

            render(<BookingCard {...props} />);

            expect(screen.getByTestId('luxury-wrapper')).toBeInTheDocument();
            expect(screen.getByTestId('package-icons')).toBeInTheDocument();
        });

        it('should render LuxuryWrapper but NOT render PackageIcons for a CANCELLED holiday', () => {
            props.isUpcoming = false;
            props.isPrevious = false;

            render(<BookingCard {...props} />);

            expect(screen.getByTestId('luxury-wrapper')).toBeInTheDocument();
            expect(screen.queryByTestId('package-icons')).not.toBeInTheDocument();
        });

        it('should still render all the standard card components inside the wrapper', () => {
            render(<BookingCard {...props} />);

            expect(screen.getByTestId('offer-card-slider')).toBeInTheDocument();
            expect(screen.getByTestId('booking-card-head')).toBeInTheDocument();
            expect(screen.getByTestId('booking-card-details')).toBeInTheDocument();
        });
    });

    describe('Pill', () => {
        const pillIcon = { value: mockSitecoreImageField('/pill-icon.png') };
        const pillText = mockSitecoreField('Flight + Hotel');

        it('should render pill when PillIcon and PillText are provided and package is not luxury', () => {
            (containsLuxuryPromoCode as jest.Mock).mockReturnValue(false);

            render(<BookingCard {...props} PillIcon={pillIcon} PillText={pillText} />);

            expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
            expect(screen.getByTestId('jss-text')).toBeInTheDocument();
            expect(mockJSSImageNext).toHaveBeenCalledWith({ field: pillIcon });
            expect(mockTextProps).toHaveBeenCalledWith({ field: pillText, className: styles.pillText, tag: 'span' });
        });

        it('should NOT render pill when PillIcon is missing', () => {
            (containsLuxuryPromoCode as jest.Mock).mockReturnValue(false);

            render(<BookingCard {...props} PillText={pillText} />);

            expect(screen.queryByTestId('jss-image-next')).not.toBeInTheDocument();
        });

        it('should render pill when PillText is missing but PillIcon is provided', () => {
            (containsLuxuryPromoCode as jest.Mock).mockReturnValue(false);

            render(<BookingCard {...props} PillIcon={pillIcon} />);

            expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        });

        it('should NOT render pill when package is luxury even if PillIcon and PillText are provided', () => {
            (containsLuxuryPromoCode as jest.Mock).mockReturnValue(true);

            render(<BookingCard {...props} PillIcon={pillIcon} PillText={pillText} />);

            expect(screen.queryByTestId('jss-image-next')).not.toBeInTheDocument();
        });
    });
});
