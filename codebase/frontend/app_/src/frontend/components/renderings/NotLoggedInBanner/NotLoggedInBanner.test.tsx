import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import { NotLoggedInBanner, TNotLoggedInBannerProps } from './NotLoggedInBanner';

const mockExpandableBanner = jest.fn();
jest.mock('frontend/components/common/ExpandableBanner/ExpandableBanner', () => ({
    __esModule: true,
    default: props => {
        mockExpandableBanner(props);

        return <div data-tid='expandable-banner' />;
    },
}));

enum FieldsType {
    NotLoggedIn = 0,
    LogWithDiffEmail = 1,
}

const createContext = () =>
    createMockStores({
        userStore: {
            isLoggedIn: true,
        },
        viewBookingStore: {
            booking: {
                ...mockBooking,
                isExternalAgency: false,
                isLoggedInAsLeadPassenger: false,
                setRedirectUrl: jest.fn(),
            },
        },
    });

const createProps = (): TNotLoggedInBannerProps => ({
    fields: {
        Children: [
            {
                displayName: 'item1',
                name: 'item1',
                id: 'item1',
                fields: {
                    ButtonLabel: mockSitecoreField('Log in'),
                    Description: mockSitecoreField(
                        `Log in using the email address you booked with to see more details. You'll be able to download your travel documents and manage your booking from here.`,
                    ),
                    Icon: { value: mockSitecoreImageField('/holidays/cms/media/') },
                    Key: mockSitecoreField('NotLoggedIn'),
                    Title: mockSitecoreField('Lead customer? Log in to manage your holiday'),
                },
            },
            {
                displayName: 'item2',
                name: 'item2',
                id: 'item2',
                fields: {
                    ButtonLabel: mockSitecoreField('Log in with a different email'),
                    Description: mockSitecoreField(
                        `Please make sure that you’re logged in with the email address you used to make the booking.`,
                    ),
                    Icon: { value: mockSitecoreImageField('/holidays/cms/media/') },
                    Key: mockSitecoreField('LogWithDiffEmail'),
                    Title: mockSitecoreField('Looking to make changes?'),
                },
            },
        ],
    },
    params: {},
    rendering: {},
});

let mockProps = createProps();
let mockContext = createContext();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockContext,
}));

describe('<NotLoggedInBanner />', () => {
    beforeEach(() => {
        mockContext = createContext();
        mockProps = createProps();
        mockExpandableBanner.mockClear();
    });

    it('should NOT render component when no fields', () => {
        delete mockProps.fields;

        const { container } = render(<NotLoggedInBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when no sitecore content items', () => {
        mockProps = {
            fields: { Children: [] },
            params: {},
            rendering: {},
        };

        const { container } = render(<NotLoggedInBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when booking is made by external agency', () => {
        mockContext.viewBookingStore.booking.isExternalAgency = true;

        const { container } = render(<NotLoggedInBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when user is logged in as a lead passenger', () => {
        mockContext.userStore.isLoggedIn = true;
        mockContext.viewBookingStore.booking.isLoggedInAsLeadPassenger = true;

        const { container } = render(<NotLoggedInBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when no matched sitecore content', () => {
        mockProps = {
            ...mockProps,
            fields: {
                Children: [
                    {
                        ...mockProps.fields!.Children[FieldsType.NotLoggedIn],
                        fields: {
                            ...mockProps.fields!.Children[FieldsType.NotLoggedIn].fields,
                            Key: mockSitecoreField('Test'),
                        },
                    },
                ],
            },
        };

        const { container } = render(<NotLoggedInBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render ExpandableBanner with LogWithDiffEmail content when user logged as not lead passenger', () => {
        mockContext.userStore.isLoggedIn = true;
        mockContext.viewBookingStore.booking = {
            ...mockContext.viewBookingStore.booking,
            isLoggedInAsLeadPassenger: false,
        };

        render(<NotLoggedInBanner {...mockProps} />);

        const { Title, Description, ButtonLabel, Icon } =
            mockProps.fields!.Children[FieldsType.LogWithDiffEmail].fields;

        expect(screen.getByTestId('expandable-banner')).toBeInTheDocument();
        expect(mockExpandableBanner).toHaveBeenCalledWith(
            expect.objectContaining({
                Title,
                Description,
                ButtonLabel,
                Icon,
                dataTidPrefix: 'not-logged-in-banner',
                onButtonClick: expect.any(Function),
            }),
        );
    });

    it('should render ExpandableBanner with NotLoggedIn content when user is not logged', () => {
        mockContext.userStore.isLoggedIn = false;

        render(<NotLoggedInBanner {...mockProps} />);

        const { Title, Description, ButtonLabel, Icon } = mockProps.fields!.Children[FieldsType.NotLoggedIn].fields;

        expect(screen.getByTestId('expandable-banner')).toBeInTheDocument();
        expect(mockExpandableBanner).toHaveBeenCalledWith(
            expect.objectContaining({
                Title,
                Description,
                ButtonLabel,
                Icon,
                dataTidPrefix: 'not-logged-in-banner',
                onButtonClick: expect.any(Function),
            }),
        );
    });

    it('should call login actions when onButtonClick is triggered', () => {
        mockContext.userStore.isLoggedIn = false;

        render(<NotLoggedInBanner {...mockProps} />);

        const { onButtonClick } = mockExpandableBanner.mock.calls[0][0];
        onButtonClick();

        expect(mockContext.userStore.setIsRedirectPreventedAfterLogin).toHaveBeenCalledWith(true);
        expect(mockContext.userStore.toggleLoginPopup).toHaveBeenCalled();
        expect(mockContext.userStore.setRedirectUrl).toHaveBeenCalledWith('');
    });
});
