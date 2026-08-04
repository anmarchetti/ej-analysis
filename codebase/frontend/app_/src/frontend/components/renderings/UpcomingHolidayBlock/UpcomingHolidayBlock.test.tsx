import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockApolloBooking } from 'frontend/__mocks__';
import { getDaysDifferenceRoundedFloor } from 'frontend/utils/date.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { SitePath } from 'models/enum/SitePath';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import { IUpcomingHolidayBlockFields } from './interfaces';
import UpcomingHolidayBlock from './UpcomingHolidayBlock';
import { getUpcomingBookingRoute } from './utils';

jest.mock('frontend/utils/date.utils', () => ({
    getDaysDifferenceRoundedFloor: jest.fn(() => 5),
    formatDateL10n: jest.fn(() => 'Tue 14th Apr 2026'),
}));

jest.mock('frontend/utils/accommodation.utils', () => ({
    getDurationLabel: jest.fn((getPhrase: any, nights: number) => `${nights} nights`),
}));

jest.mock('frontend/utils/string.utils', () => ({
    joinNonEmptyWordsWithComma: jest.fn((arr: string[]) => arr.join(', ')),
}));

jest.mock('frontend/components/icons-new/LocationPinFilled', () => ({
    __esModule: true,
    default: ({ className }: any) => <svg className={className} data-tid='location-icon' />,
}));

jest.mock('frontend/components/icons-new/Calendar', () => ({
    __esModule: true,
    default: ({ className }: any) => <svg className={className} data-tid='calendar-icon' />,
}));

jest.mock('react-intersection-observer', () => ({
    InView: ({ children, onChange }: any) => (
        <div>
            <button type='button' data-tid='in-view-wrapper' onClick={() => onChange(true)}>
                Trigger InView
            </button>
            {children}
        </div>
    ),
}));

const mockGetDaysDifferenceRoundedFloor = jest.mocked(getDaysDifferenceRoundedFloor);

const createProps = (): ISitecoreComponent<IUpcomingHolidayBlockFields> => ({
    fields: {
        HeaderText: mockSitecoreField('Get ready for your upcoming holiday'),
        CTAText: mockSitecoreField('Manage your holiday'),
        CountdownTextSingular: mockSitecoreField('{count} day until your holiday!'),
        CountdownTextPlural: mockSitecoreField('{count} days until your holiday!'),
    },
    params: {},
    rendering: { componentName: 'UpcomingHolidayBlock', uid: 'test-unique-id-123' },
});

const createStores = () => ({
    userStore: {
        isLoggedIn: true,
    },
    layoutStore: {
        getPhrase: jest.fn((key: string) => key),
        sitePath: '/en',
    },
    queryParamStore: {
        query: {},
    },
    viewBookingsStore: {
        apolloUpcomingBooking: mockApolloBooking(),
        upcomingHotelImagePath: null as string | null,
        fetchBookingsFromApollo: jest.fn(),
        fetchUpcomingHotelImage: jest.fn(),
        clearApolloBookings: jest.fn(),
        apolloBookings: [],
    },
    routerStore: {
        redirectToViewBookingsPage: jest.fn(),
    },
    trackingStore: {
        trackManageHolidayImpression: jest.fn(),
        trackManageHolidayClick: jest.fn(),
    },
});

let mockProps: ISitecoreComponent<IUpcomingHolidayBlockFields>;
let mockStores = createStores();

jest.mock('frontend/hooks/useStore', () => jest.fn((fn: (stores: any) => any) => fn(mockStores)));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, className, dataTid, onClick, isFullWidth, isOutlined, isSmall, ...props }: any) => (
        <button className={className} data-tid={dataTid} onClick={onClick} {...props}>
            {children}
        </button>
    ),
}));

describe('UpcomingHolidayBlock', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockGetDaysDifferenceRoundedFloor.mockReturnValue(5);
    });

    it('should render the component with mock data when user is logged in', () => {
        render(<UpcomingHolidayBlock {...mockProps} />);

        expect(screen.getByTestId('upcoming-holiday-block')).toBeInTheDocument();
        expect(screen.getByTestId('hotel-name')).toHaveTextContent('Test Hotel Majorca');
        expect(screen.getByTestId('location')).toHaveTextContent('Majorca, Spain');
    });

    it('should NOT render when user is not logged in', () => {
        mockStores.userStore.isLoggedIn = false;

        const { container } = render(<UpcomingHolidayBlock {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
        expect(mockStores.viewBookingsStore.clearApolloBookings).toHaveBeenCalled();
    });

    it('should redirect to My Bookings page when button is clicked', async () => {
        const user = userEvent.setup();
        render(<UpcomingHolidayBlock {...mockProps} />);

        const button = screen.getByTestId('upcoming-holiday-desktop-button');
        await user.click(button);

        expect(mockStores.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();
    });

    it('should track impression when component enters viewport', async () => {
        const user = userEvent.setup();
        render(<UpcomingHolidayBlock {...mockProps} />);

        const inViewWrapper = screen.getByTestId('in-view-wrapper');
        await user.click(inViewWrapper);

        expect(mockStores.trackingStore.trackManageHolidayImpression).toHaveBeenCalledWith(
            'test-unique-id-123',
            'Get ready for your upcoming holiday',
            'Manage your holiday',
            mockStores.layoutStore.sitePath + SitePath.ViewBookings,
        );
    });

    it('should track click when CTA button is clicked', async () => {
        const user = userEvent.setup();
        render(<UpcomingHolidayBlock {...mockProps} />);

        const button = screen.getByTestId('upcoming-holiday-desktop-button');
        await user.click(button);

        expect(mockStores.trackingStore.trackManageHolidayClick).toHaveBeenCalledWith(
            'test-unique-id-123',
            'Get ready for your upcoming holiday',
            'Manage your holiday',
            mockStores.layoutStore.sitePath + SitePath.ViewBookings,
        );
    });

    it('should track click when mobile CTA button is clicked', async () => {
        const user = userEvent.setup();
        render(<UpcomingHolidayBlock {...mockProps} />);

        const button = screen.getByTestId('upcoming-holiday-mobile-button');
        await user.click(button);

        expect(mockStores.trackingStore.trackManageHolidayClick).toHaveBeenCalledWith(
            'test-unique-id-123',
            'Get ready for your upcoming holiday',
            'Manage your holiday',
            mockStores.layoutStore.sitePath + SitePath.ViewBookings,
        );
    });

    it('should use empty strings for tracking when rendering uid is missing', async () => {
        const user = userEvent.setup();
        mockProps.rendering = { componentName: 'UpcomingHolidayBlock' };
        render(<UpcomingHolidayBlock {...mockProps} />);

        const inViewWrapper = screen.getByTestId('in-view-wrapper');
        await user.click(inViewWrapper);

        expect(mockStores.trackingStore.trackManageHolidayImpression).toHaveBeenCalledWith(
            undefined,
            'Get ready for your upcoming holiday',
            'Manage your holiday',
            mockStores.layoutStore.sitePath + SitePath.ViewBookings,
        );
    });

    it('should use empty strings for tracking when field values are missing', async () => {
        const user = userEvent.setup();
        mockProps.rendering = { componentName: 'UpcomingHolidayBlock', uid: 'test-unique-id-123' };
        mockProps.fields = {
            HeaderText: { value: '' },
            CTAText: { value: '' },
            CountdownTextSingular: { value: '' },
            CountdownTextPlural: { value: '' },
        };
        render(<UpcomingHolidayBlock {...mockProps} />);

        const inViewWrapper = screen.getByTestId('in-view-wrapper');
        await user.click(inViewWrapper);

        expect(mockStores.trackingStore.trackManageHolidayImpression).toHaveBeenCalledWith(
            'test-unique-id-123',
            '',
            '',
            mockStores.layoutStore.sitePath + SitePath.ViewBookings,
        );
    });

    it('should always render fallback placeholder', () => {
        mockStores.viewBookingsStore.upcomingHotelImagePath = null;

        render(<UpcomingHolidayBlock {...mockProps} />);

        expect(screen.getByTestId('destination-image-fallback')).toBeInTheDocument();
    });

    it('should not render image element when image path is null', () => {
        mockStores.viewBookingsStore.upcomingHotelImagePath = null;

        render(<UpcomingHolidayBlock {...mockProps} />);

        expect(screen.queryByTestId('destination-image')).not.toBeInTheDocument();
    });

    it('should render image element when image path is provided', () => {
        mockStores.viewBookingsStore.upcomingHotelImagePath = '/mock-hotel-image.jpg';

        render(<UpcomingHolidayBlock {...mockProps} />);

        const image = screen.getByTestId('destination-image') as HTMLImageElement;
        expect(image).toBeInTheDocument();
        expect(image.src).toContain('/mock-hotel-image.jpg');
        expect(image.alt).toBe('Test Hotel Majorca');
    });

    it('should render both fallback and image when image path exists', () => {
        mockStores.viewBookingsStore.upcomingHotelImagePath = '/mock-hotel-image.jpg';

        render(<UpcomingHolidayBlock {...mockProps} />);

        expect(screen.getByTestId('destination-image-fallback')).toBeInTheDocument();
        expect(screen.getByTestId('destination-image')).toBeInTheDocument();
    });

    it('should wrap image path with cmsUrls.media()', () => {
        mockStores.viewBookingsStore.upcomingHotelImagePath = '/mock-image-path.jpg';

        render(<UpcomingHolidayBlock {...mockProps} />);

        const image = screen.getByTestId('destination-image') as HTMLImageElement;
        expect(image.src).toBeDefined();
    });

    it('should fetch hotel image with hotelCode and resortCode when component mounts', () => {
        render(<UpcomingHolidayBlock {...mockProps} />);

        expect(mockStores.viewBookingsStore.fetchUpcomingHotelImage).toHaveBeenCalledWith('ESMJ0047', 'ESBABA');
        expect(mockStores.viewBookingsStore.fetchUpcomingHotelImage).toHaveBeenCalledTimes(1);
    });

    it('should not fetch hotel image when hotelCode or resortCode is missing', () => {
        mockStores.viewBookingsStore.apolloUpcomingBooking = {
            ...mockStores.viewBookingsStore.apolloUpcomingBooking,
            hotelCode: '',
        };

        render(<UpcomingHolidayBlock {...mockProps} />);

        expect(mockStores.viewBookingsStore.fetchUpcomingHotelImage).not.toHaveBeenCalled();
    });

    it('should render countdown badge when departure is within 30 days', () => {
        mockGetDaysDifferenceRoundedFloor.mockReturnValue(21);
        mockStores.viewBookingsStore.apolloUpcomingBooking = mockApolloBooking({
            departureDatetimeLocal: '2026-04-14T08:00:00Z',
        });

        render(<UpcomingHolidayBlock {...mockProps} />);

        expect(screen.getByTestId('upcoming-holiday-desktop-countdown-badge')).toHaveTextContent(
            '21 days until your holiday!',
        );
        expect(screen.getByTestId('upcoming-holiday-mobile-countdown-badge')).toHaveTextContent(
            '21 days until your holiday!',
        );
    });

    it('should not render countdown badge when departure is 30 or more days away', () => {
        mockGetDaysDifferenceRoundedFloor.mockReturnValue(40);
        mockStores.viewBookingsStore.apolloUpcomingBooking = mockApolloBooking({
            departureDatetimeLocal: '2026-04-14T08:00:00Z',
        });

        render(<UpcomingHolidayBlock {...mockProps} />);

        expect(screen.queryByTestId('upcoming-holiday-desktop-countdown-badge')).not.toBeInTheDocument();
        expect(screen.queryByTestId('upcoming-holiday-mobile-countdown-badge')).not.toBeInTheDocument();
    });
});

describe('Utils', () => {
    describe('getUpcomingBookingRoute', () => {
        it('should return InDestination path for day of travel', () => {
            expect(getUpcomingBookingRoute(0, 'MOCK123')).toBe(SitePath.InDestination);
        });

        it('should return PreTravel path for 1-2 days before departure', () => {
            expect(getUpcomingBookingRoute(1, 'MOCK123')).toBe(SitePath.PreTravel);
            expect(getUpcomingBookingRoute(2, 'MOCK123')).toBe(SitePath.PreTravel);
        });

        it('should return ViewBooking path for more than 3 days before departure', () => {
            expect(getUpcomingBookingRoute(3, 'MOCK123')).toBe(SitePath.ViewBooking);
            expect(getUpcomingBookingRoute(10, 'MOCK123')).toBe(SitePath.ViewBooking);
        });
    });
});
