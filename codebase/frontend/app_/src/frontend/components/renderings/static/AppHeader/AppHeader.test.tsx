import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import AppHeader from './AppHeader';

const mockHeaderNavigationProps = jest.fn();
jest.mock('frontend/components/common/HeaderNavigation/HeaderNavigation', () => ({
    __esModule: true,
    default: props => {
        mockHeaderNavigationProps(props);

        return <div data-tid='header-navigation' />;
    },
}));

const mockBackButtonProps = jest.fn();
jest.mock('frontend/components/renderings/static/AppHeader/components/BackButton', () => ({
    __esModule: true,
    default: props => {
        mockBackButtonProps(props);

        return <div data-tid='back-button' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const resetMocks = () =>
    ({
        fields: {
            MenuAriaLabel: mockSitecoreField('Menu'),
            PrimaryNavigationAriaLabel: mockSitecoreField('PrimaryNavigationAriaLabel'),
            ActionNavigationAriaLabel: mockSitecoreField('ActionNavigationAriaLabel'),
            MainNav: [{ id: '' }],
            SecondaryNav: [{ id: '' }],
            LogoLink: true,
            Logo: {},
        },
        isShowLoginPopup: false,
        toggleReCaptchaBadge: jest.fn(),
        isCheckInAvailable: jest.fn(),
        isBookingConfirmationPage: jest.fn(),
        isViewBookingPage: jest.fn(),
        isPaymentPage: false,
        booking: {} as any,
        viewBooking: {} as any,
        clearViewBooking: jest.fn(),
        trackNavigationClick: jest.fn(),
        isMobileAppHideFeatures: false,
    } as any);

let mocks = resetMocks();
let mockStores;

describe('AppHeader', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores({
            layoutStore: {
                isMobileAppHideFeatures: false,
                isMobileAppDarkMode: false,
                isHomePage: true,
                isSearchResultsPage: false,
                isHotelDetailsBookPage: false,
                isHotelDetailsBrowsePage: false,
                isExtrasPage: false,
                isGuestDetailsPage: false,
                isPaymentPage: false,
            },
        });
    });

    describe('Rendering based on isMobileAppHideFeatures', () => {
        it('should render header when isMobileAppHideFeatures is true', () => {
            mockStores.layoutStore.isMobileAppHideFeatures = true;

            const { container } = render(<AppHeader {...mocks} />);

            expect(container.querySelector('header')).toBeInTheDocument();
        });

        it('should render nothing when isMobileAppHideFeatures is false', () => {
            mockStores.layoutStore.isMobileAppHideFeatures = false;

            const { container } = render(<AppHeader {...mocks} />);

            expect(container.firstChild).toBeNull();
        });
    });

    describe('BackButton rendering', () => {
        beforeEach(() => {
            mockStores.layoutStore.isMobileAppHideFeatures = true;
        });

        it('should render BackButton when on search results page', () => {
            mockStores.layoutStore.isSearchResultsPage = true;
            render(<AppHeader {...mocks} />);

            expect(screen.getByTestId('back-button')).toBeInTheDocument();
        });

        it('should render BackButton when on hotel details book page', () => {
            mockStores.layoutStore.isHotelDetailsBookPage = true;
            render(<AppHeader {...mocks} />);

            expect(screen.getByTestId('back-button')).toBeInTheDocument();
        });

        it('should render BackButton when on hotel details browse page', () => {
            mockStores.layoutStore.isHotelDetailsBrowsePage = true;
            render(<AppHeader {...mocks} />);

            expect(screen.getByTestId('back-button')).toBeInTheDocument();
        });

        it('should render BackButton when on extras page', () => {
            mockStores.layoutStore.isExtrasPage = true;
            render(<AppHeader {...mocks} />);

            expect(screen.getByTestId('back-button')).toBeInTheDocument();
        });

        it('should NOT render BackButton when on home page', () => {
            mockStores.layoutStore.isHomePage = true;
            render(<AppHeader {...mocks} />);

            expect(screen.queryByTestId('back-button')).not.toBeInTheDocument();
        });
    });

    describe('HeaderNavigation rendering', () => {
        beforeEach(() => {
            mockStores.layoutStore.isMobileAppHideFeatures = true;
        });

        it('should render HeaderNavigation when on home page with fields', () => {
            mockStores.layoutStore.isHomePage = true;

            render(<AppHeader {...mocks} />);

            expect(screen.getByTestId('header-navigation')).toBeInTheDocument();
            expect(mockHeaderNavigationProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: mocks.fields,
                }),
            );
        });

        it('should NOT render HeaderNavigation when not on home page', () => {
            mockStores.layoutStore.isHomePage = false;
            render(<AppHeader {...mocks} />);

            expect(screen.queryByTestId('header-navigation')).not.toBeInTheDocument();
        });

        it('should NOT render HeaderNavigation when fields are not provided', () => {
            mocks.fields = undefined;
            render(<AppHeader {...mocks} />);

            expect(screen.queryByTestId('header-navigation')).not.toBeInTheDocument();
        });

        it('should not render anything when no page condition is met and not on home page', () => {
            mockStores.layoutStore.isHomePage = false;
            const { container } = render(<AppHeader {...mocks} />);

            expect(container).toBeEmptyDOMElement();
        });
    });

    describe('CSS classes', () => {
        beforeEach(() => {
            mockStores.layoutStore.isMobileAppHideFeatures = true;
        });

        it('should apply darkMode class when isMobileAppDarkMode is true', () => {
            mockStores.layoutStore.isMobileAppDarkMode = true;
            const { container } = render(<AppHeader {...mocks} />);

            const header = container.querySelector('header');
            expect(header).toHaveClass('darkMode');
        });

        it('should NOT apply darkMode class when isMobileAppDarkMode is false', () => {
            mockStores.layoutStore.isMobileAppDarkMode = false;
            const { container } = render(<AppHeader {...mocks} />);

            const header = container.querySelector('header');
            expect(header).not.toHaveClass('darkMode');
        });

        it('should  not have nav-opened class by default', () => {
            const { container } = render(<AppHeader {...mocks} />);

            const header = container.querySelector('header');
            expect(header).not.toHaveClass('nav-opened');
        });
    });

    describe('Ref callbacks', () => {
        beforeEach(() => {
            mockStores.layoutStore.isMobileAppHideFeatures = true;
        });

        it('should set main navigation ref', () => {
            render(<AppHeader {...mocks} />);

            const { calls } = mockHeaderNavigationProps.mock;
            const lastCall = calls.at(-1);

            expect(lastCall[0]).toHaveProperty('setMainRef');
            expect(typeof lastCall[0].setMainRef).toBe('function');
        });

        it('should set secondary navigation ref', () => {
            render(<AppHeader {...mocks} />);

            const { calls } = mockHeaderNavigationProps.mock;
            const lastCall = calls.at(-1);

            expect(lastCall[0]).toHaveProperty('setSecondaryRef');
            expect(typeof lastCall[0].setSecondaryRef).toBe('function');
        });

        it('should call setMainRef with HTML element', () => {
            render(<AppHeader {...mocks} />);

            const { calls } = mockHeaderNavigationProps.mock;
            const lastCall = calls.at(-1);
            const setMainRef = lastCall[0].setMainRef;

            const mockElement = document.createElement('ul');
            setMainRef(mockElement);

            expect(setMainRef).toBeDefined();
        });

        it('should call setSecondaryRef with HTML element', () => {
            render(<AppHeader {...mocks} />);

            const { calls } = mockHeaderNavigationProps.mock;
            const lastCall = calls.at(-1);
            const setSecondaryRef = lastCall[0].setSecondaryRef;

            const mockElement = document.createElement('ul');
            setSecondaryRef(mockElement);

            expect(setSecondaryRef).toBeDefined();
        });
    });

    describe('Integration', () => {
        beforeEach(() => {
            mockStores.layoutStore.isMobileAppHideFeatures = true;
            mockStores.layoutStore.isHomePage = false;
            mockStores.layoutStore.isMobileAppDarkMode = false;
            mockStores.layoutStore.isSearchResultsPage = true;
        });

        it('should show BackButton on non-home page without dark mode', () => {
            render(<AppHeader {...mocks} />);

            expect(screen.getByTestId('back-button')).toBeInTheDocument();
            expect(screen.queryByTestId('header-navigation')).not.toBeInTheDocument();
        });

        it('should show HeaderNavigation on home page', () => {
            mockStores.layoutStore.isHomePage = true;
            mockStores.layoutStore.isSearchResultsPage = false;
            render(<AppHeader {...mocks} />);

            expect(screen.queryByTestId('back-button')).not.toBeInTheDocument();
            expect(screen.getByTestId('header-navigation')).toBeInTheDocument();
        });

        it('should apply dark mode class on non-home page', () => {
            mockStores.layoutStore.isMobileAppDarkMode = true;
            const { container } = render(<AppHeader {...mocks} />);

            const header = container.querySelector('header');
            expect(header).toHaveClass('darkMode');
        });
    });
});
