import * as React from 'react';
import { act, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { GuestBookingInfoFields } from 'models/data/GuestBookingInfo';

import { mockLoginFormFields } from './__mocks__/loginFormFields.mocks';
import { LoginForm, TLoginFormProps } from './LoginForm';

const mockMyBookingSection = jest.fn();
jest.mock('frontend/components/renderings/LoginForm/components/MyBookingSection', () => props => {
    mockMyBookingSection(props);

    return <div data-tid='my-booking-section' />;
});
jest.mock('frontend/components/renderings/LoginForm/components/SingInSection', () => () => (
    <div data-tid='sing-in-section' />
));

const mockRichTextWithLink = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => props => {
    mockRichTextWithLink(props);

    return <div data-tid='rich-text-with-links' />;
});

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='text' />;
    },
}));

const createProps = (): TLoginFormProps => ({
    fields: mockLoginFormFields,
    params: {},
    rendering: { componentName: 'LoginForm' },
});

const createStores = () =>
    createMockStores({
        queryParamStore: { viewMyBooking: () => '1' },
        userStore: {
            isLoginTabActive: true,
            isLoggedIn: false,
            setLoginTabActive: jest.fn(),
            userData: { lastName: 'test' },
        },
        viewBookingStore: {
            guestBookingInfo: { onChangeField: jest.fn() },
            clearGuestBookingInfo: jest.fn(),
        },
    });

let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<LoginForm />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
    });

    it('should show MyBookingSection when logged in', () => {
        mockStores.userStore.isLoggedIn = true;
        render(<LoginForm {...mockProps} />);

        expect(screen.getByTestId('my-booking-section')).toBeInTheDocument();
        expect(screen.queryByTestId('sing-in-section')).not.toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.fields?.ViewBookingFormTitle,
            className: 'page-title',
            tag: 'h2',
        });
        expect(mockRichTextWithLink).toHaveBeenCalledWith({
            field: mockProps.fields?.ViewBookingFormDescription,
            className: 'login__description',
        });
    });

    it('should show login form and additional info when login tab is active and user is not logged in', () => {
        render(<LoginForm {...mockProps} />);

        expect(screen.queryByTestId('my-booking-section')).not.toBeInTheDocument();
        expect(screen.getByTestId('sing-in-section')).toBeInTheDocument();
        expect(screen.getByTestId('login-tab')).toHaveClass('btn--active');
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.fields?.LoginFormTitle,
            className: 'title',
            tag: 'h2',
        });
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.fields?.AdditionalInfoTitle,
            className: 'title infoTitle',
            tag: 'h2',
            ['data-tid']: 'additional-info-title',
        });
        expect(mockRichTextWithLink).toHaveBeenCalledWith({
            field: mockProps.fields?.AdditionalInfoDescription,
            className: 'infoDescription',
            dataId: 'additional-info-content',
        });
    });

    it('should show view booking form form and additional info when view booking tab is active and user is not logged in', () => {
        mockStores.userStore.isLoginTabActive = false;
        render(<LoginForm {...mockProps} />);

        expect(screen.queryByTestId('sing-in-section')).not.toBeInTheDocument();
        expect(screen.getByTestId('my-booking-section')).toBeInTheDocument();
        expect(screen.getByTestId('view-booking-tab')).toHaveClass('btn--active');
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.fields?.LoginFormTitle,
            className: 'title',
            tag: 'h2',
        });
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.fields?.AdditionalInfoTitle,
            className: 'title infoTitle',
            tag: 'h2',
            ['data-tid']: 'additional-info-title',
        });
        expect(mockRichTextWithLink).toHaveBeenCalledWith({
            field: mockProps.fields?.AdditionalInfoDescription,
            className: 'infoDescription',
            dataId: 'additional-info-content',
        });
    });

    it('should NOT render component when fields are undefined', () => {
        mockProps.fields = undefined;

        const { container } = render(<LoginForm {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should populate lastName to view my booking when mounted', () => {
        mockStores.userStore.isLoginTabActive = false;

        render(<LoginForm {...mockProps} />);

        expect(mockStores.userStore.setLoginTabActive).toHaveBeenCalledWith(false);
        expect(mockStores.viewBookingStore.guestBookingInfo.onChangeField).toHaveBeenCalledWith(
            GuestBookingInfoFields.LastName,
            mockStores.userStore.userData.lastName,
        );
    });

    it('should open view booking tab by click', async () => {
        mockStores.userStore.isLoginTabActive = true;
        render(<LoginForm {...mockProps} />);
        const button = screen.getByTestId('view-booking-tab');
        act(() => {
            button.click();
        });

        expect(mockStores.userStore.setLoginTabActive).toHaveBeenCalledWith(false);
    });

    it('should open login tab by click', () => {
        mockStores.userStore.isLoginTabActive = false;
        render(<LoginForm {...mockProps} />);
        const button = screen.getByTestId('login-tab');
        act(() => {
            button.click();
        });

        expect(mockStores.userStore.setLoginTabActive).toHaveBeenCalledWith(true);
    });

    it('should pass rendering to MyBookingSection when view booking tab is active', () => {
        mockStores.userStore.isLoginTabActive = false;
        render(<LoginForm {...mockProps} />);

        expect(mockMyBookingSection).toHaveBeenCalledWith(
            expect.objectContaining({
                rendering: mockProps.rendering,
            }),
        );
    });

    it('should pass rendering to MyBookingSection when user is logged in', () => {
        mockStores.userStore.isLoggedIn = true;
        render(<LoginForm {...mockProps} />);

        expect(mockMyBookingSection).toHaveBeenCalledWith(
            expect.objectContaining({
                rendering: mockProps.rendering,
            }),
        );
    });
});
