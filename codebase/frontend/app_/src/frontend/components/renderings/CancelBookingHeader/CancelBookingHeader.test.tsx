import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { Tokens } from 'code/tokens';
import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockReplaceTokens, mockTokenizer } from 'frontend/__mocks__/utils/tokenizer';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import * as urlUtils from 'frontend/utils/url.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';

import CancelBookingHeader, { TCancelBookingHeaderProps } from './CancelBookingHeader';

jest.mock('frontend/components/common/Link', () => ({ children, href }) => (
    <a data-tid='link' href={href}>
        {children}
    </a>
));

const createProps = (): TCancelBookingHeaderProps => ({
    fields: {
        Title: mockSitecoreField('Title'),
        Subtitle: mockSitecoreField('Subtitle'),
    },
    rendering: {},
    params: {},
});

let mockProps: TCancelBookingHeaderProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPageHeader = jest.fn();
const mockText = jest.fn();

jest.mock('frontend/components/common/PageHeader/PageHeader', () => ({
    __esModule: true,
    default: props => {
        mockPageHeader(props);

        return <div data-tid='page-header'>{props.children}</div>;
    },
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockText(props);

        return <div data-tid='text' />;
    },
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceTokens: mockReplaceTokens,
    },
}));

describe('CancelBookingHeader', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: {
                getBreadcrumb: jest.fn(value => ({ key: value, value })),
                isCameFromMicroAppManage: false,
                getMicroAppManageBreadcrumb: jest.fn(value => ({ key: value, value })),
            },
            holidayCreditStore: {
                booking: mockBooking,
            },
        });
    });

    it('should render manage holiday breadcrumb if isCameFromMicroAppManage is true', () => {
        mockStores.layoutStore.isCameFromMicroAppManage = true;

        render(<CancelBookingHeader {...mockProps} />);

        expect(mockStores.layoutStore.getMicroAppManageBreadcrumb).toHaveBeenCalledWith(SitePath.ManageHub);
        expect(mockPageHeader).toHaveBeenCalledWith({
            breadcrumbs: [
                { key: '/manage/{bookingRef}', value: '/manage/{bookingRef}' },
                { key: '/booking/cancel-booking', value: '/booking/cancel-booking' },
            ],
            Title: mockProps.fields!.Title,
            children: expect.anything(),
        });
    });

    it('should NOT render component if no fields', () => {
        mockProps.fields = undefined;
        const { container } = render(<CancelBookingHeader {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should call PageHeader with correct page', () => {
        mockStores.holidayCreditStore = {
            prevPagePath: SitePath.PreTravel,
        };
        render(<CancelBookingHeader {...mockProps} />);

        expect(mockPageHeader).toHaveBeenCalledWith({
            breadcrumbs: [
                { key: SitePath.PreTravel, value: SitePath.PreTravel },
                { key: SitePath.CancelBooking, value: SitePath.CancelBooking },
            ],
            Title: mockProps.fields!.Title,
            children: expect.anything(),
        });
    });

    it('should call PageHeader with trade portal view booking page when prevPagePath is not defined and isTradePortal is true', () => {
        mockStores.layoutStore.isTradePortal = true;

        render(<CancelBookingHeader {...mockProps} />);

        expect(mockPageHeader).toHaveBeenCalledWith({
            breadcrumbs: [
                { key: SitePath.TradePortalViewBooking, value: SitePath.TradePortalViewBooking },
                { key: SitePath.CancelBooking, value: SitePath.CancelBooking },
            ],
            Title: mockProps.fields!.Title,
            children: expect.anything(),
        });
    });

    it('should render breadcrumbs with flight plus hotel url when isFlightPlusHotelFunnel is true', () => {
        jest.spyOn(urlUtils, 'buildFlightPlusHotelUrl').mockImplementation(value => `${value}/fph`);
        mockStores.queryParamStore.isFlightPlusHotelFunnel = true;

        render(<CancelBookingHeader {...mockProps} />);
        expect(mockPageHeader).toHaveBeenCalledWith({
            breadcrumbs: [
                {
                    key: SitePath.ViewBooking,
                    value: `${SitePath.ViewBooking}/fph`,
                },
                {
                    key: SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbsCancelBooking,
                    value: SitePath.CancelBooking,
                },
            ],
            Title: mockProps.fields!.Title,
            children: expect.anything(),
        });
    });

    it('should render text only with correct props and DestinationBreadcrumbs with default view booking page when prevPagePath is not defined', () => {
        render(<CancelBookingHeader {...mockProps} />);

        expect(mockText).toHaveBeenCalledWith({
            tag: 'p',
            field: { value: 'Subtitle Ann,Brown' },
            className: 'subtitle',
        });

        const { firstName, lastName } = mockStores.holidayCreditStore.booking.guests[1];
        expect(mockTokenizer.replaceTokens).toHaveBeenCalledWith(mockProps.fields!.Subtitle.value, {
            [Tokens.PassengerName]: firstName,
            [Tokens.Surname]: lastName,
        });
        expect(screen.queryByTestId('booking-refs')).not.toBeInTheDocument();
        expect(mockPageHeader).toHaveBeenCalledWith({
            breadcrumbs: [
                { key: SitePath.ViewBooking, value: SitePath.ViewBooking },
                { key: SitePath.CancelBooking, value: SitePath.CancelBooking },
            ],
            Title: mockProps.fields!.Title,
            children: expect.anything(),
        });
    });

    it('should render booking references when isTradePortal is true', () => {
        mockStores.layoutStore.isTradePortal = true;

        render(<CancelBookingHeader {...mockProps} />);
        expect(screen.getByTestId('booking-refs')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.BookingHeaderLabelsHolidayReference)).toBeInTheDocument();
        expect(screen.getByText(mockStores.holidayCreditStore.booking.bookingReference)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.BookingPassengersLabelsLeadPassenger)).toBeInTheDocument();
        const leadPassenger = mockStores.holidayCreditStore.booking.guests.find(guest => guest.isLead);
        expect(screen.getByText(`${leadPassenger.firstName} ${leadPassenger.lastName}`)).toBeInTheDocument();
    });

    it('should render loading shimmers when isTradePortal and isLoading are true', () => {
        mockStores.layoutStore.isTradePortal = true;
        mockStores.viewBookingStore.isLoading = true;

        render(<CancelBookingHeader {...mockProps} />);

        expect(screen.getByTestId('subtitle-loading')).toBeInTheDocument();
        expect(screen.getByTestId('booking-refs-loading')).toBeInTheDocument();
    });
});
