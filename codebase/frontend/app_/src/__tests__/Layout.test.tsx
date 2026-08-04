import React from 'react';
import { Engage } from '@sitecore/engage';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import Layout, { MAIN_CONTENT_ID } from 'Layout';

import { createMockStores } from 'frontend/__mocks__';
import * as cookiesUtils from 'frontend/utils/cookies.utils';
import { CookiesKeys } from 'models/enum/CookiesKeys';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

const createStores = () =>
    createMockStores({
        layoutStore: {
            route: { fields: {} },
            isEditMode: false,
            layout: {},
            isAmendPassengerDetailsPage: false,
            isTradePortal: false,
            fullUrl: '',
            isPaymentPage: false,
            shouldRedirectToTradeLoginPage: false,
            isExperienceEditor: false,
            isCIAMComponentsEnabled: false,
            isDestinationPage: false,
            isHotelDetailsBrowsePage: false,
        },
        editorStore: {
            activeItemId: null,
        },
        metadataStore: {
            metaPageTitle: 'Test Title',
            metaPageDescription: 'Test Description',
            metaCanonical: '',
            metaGoogleVerification: '',
            metaImage: '',
            metaRobots: '',
            metaCategory: '',
            metaType: '',
        },
        notificationsStore: {
            initialize: jest.fn(),
        },
        engageStore: {
            initializeEngage: jest.fn(),
            sendIdentityEvent: jest.fn(),
        },
        routerStore: {
            redirectToLoginPage: jest.fn(),
            isBookingConfirmationPage: jest.fn(() => true),
        },
        appStore: {
            setCookiesPopupWasShown: jest.fn(),
        },
    });

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('next/head', () => ({
    __esModule: true,
    default: ({ children }) => <>{children}</>,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Placeholder: ({ name }) => <div data-tid={`placeholder-${name}`} />,
}));

jest.mock('frontend/components/global/VisitorIdentification', () => ({
    VisitorIdentification: jest.fn(() => <div data-tid='visitor-identification' />),
}));

jest.mock('frontend/components/common/HolidayNotAvailable/HolidayNotAvailable', () => ({
    __esModule: true,
    default: () => <div data-tid='holiday-not-available' />,
}));

jest.mock('frontend/components/common/SitecorePersonalizeLoader/SitecorePersonalizeLoader', () => ({
    __esModule: true,
    default: () => <div data-tid='sitecore-personalize-loader' />,
}));

jest.mock('frontend/components/renderings/CreateAccount/components/CreateAccountSuccessPopup', () => ({
    __esModule: true,
    default: () => <div data-tid='holiday-not-available' />,
}));

jest.mock('frontend/components/common/AskToPush/AskToPush', () => ({
    __esModule: true,
    default: () => <div data-tid='ask-to-push' />,
}));

jest.mock('frontend/components/common/InvalidLuggageInUrlPopup/InvalidLuggageInUrlPopup', () => ({
    __esModule: true,
    default: () => <div data-tid='invalid-luggage-in-url-popup' />,
}));

jest.mock('frontend/components/common/FontsLoader/FontsLoader', () => () => <div data-tid='fonts-loader' />);
jest.mock('frontend/components/common/GreyOverlay', () => () => <div data-tid='grey-overlay' />);
jest.mock('frontend/components/common/LayoutNotAvailable', () => () => <div data-tid='layout-not-available' />);
jest.mock('frontend/components/common/MaintenancePopup/MaintenancePopup', () => () => (
    <div data-tid='maintenance-popup' />
));
jest.mock('frontend/components/common/Notifications', () => () => <div data-tid='notifications' />);
jest.mock('frontend/components/common/PageCookiePolicy', () => () => <div data-tid='page-cookie-policy' />);
jest.mock('frontend/components/common/HeadHreflang/HeadHrefLang', () => () => <div data-tid='head-hreflang' />);

const mockLandMarkComponent = jest.fn();
jest.mock('frontend/components/common/LandmarkLink/LandmarkLink', () => ({
    __esModule: true,
    default: props => {
        mockLandMarkComponent(props);

        return <div data-tid='landmark-link' />;
    },
}));

describe('Layout Component', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should render default', () => {
        render(<Layout />);

        expect(screen.getByTestId('ask-to-push')).toBeInTheDocument();
        expect(screen.getByTestId('fonts-loader')).toBeInTheDocument();
        expect(screen.getByTestId('grey-overlay')).toBeInTheDocument();
        expect(screen.getByTestId('holiday-not-available')).toBeInTheDocument();
        expect(screen.getByTestId('invalid-luggage-in-url-popup')).toBeInTheDocument();
        expect(screen.getByTestId('layout-not-available')).toBeInTheDocument();
        expect(screen.getByTestId('maintenance-popup')).toBeInTheDocument();
        expect(screen.getByTestId('notifications')).toBeInTheDocument();
        expect(screen.queryByTestId('package-validating-overlay')).not.toBeInTheDocument();
        expect(screen.getByTestId('page-cookie-policy')).toBeInTheDocument();
        expect(screen.getByTestId('sitecore-personalize-loader')).toBeInTheDocument();
        expect(screen.queryByTestId('sitecore-popup')).not.toBeInTheDocument();
        expect(screen.getByTestId('visitor-identification')).toBeInTheDocument();
        expect(screen.getByTestId('head-hreflang')).toBeInTheDocument();
        expect(screen.queryByTestId('create-account-success-popup')).not.toBeInTheDocument();
        expect(screen.queryByTestId('ciam-js')).not.toBeInTheDocument();
    });

    it('should not render title and description on destination pages (not hotel browse page)', () => {
        mockStores.layoutStore.isDestinationPage = true;

        const { container } = render(<Layout />);

        expect(document.querySelector('title')).not.toBeInTheDocument();
        const metaTitle = container.querySelector("meta[property='og:title']");
        expect(metaTitle).not.toBeInTheDocument();
        const metaDescription = container.querySelector("meta[name='description']");
        expect(metaDescription).not.toBeInTheDocument();
        const metaDescription2 = container.querySelector("meta[property='og:description']");
        expect(metaDescription2).not.toBeInTheDocument();
    });

    it('should render title and description on hotel browse page (it is destination page as well)', () => {
        mockStores.layoutStore.isDestinationPage = true;
        mockStores.layoutStore.isHotelDetailsBrowsePage = true;

        const { container } = render(<Layout />);

        expect(document.querySelector('title')).toBeInTheDocument();
        const metaTitle = container.querySelector("meta[property='og:title']");
        expect(metaTitle).toBeInTheDocument();
        const metaDescription = container.querySelector("meta[name='description']");
        expect(metaDescription).toBeInTheDocument();
        const metaDescription2 = container.querySelector("meta[property='og:description']");
        expect(metaDescription2).toBeInTheDocument();
    });

    it('should call notificationStoreInitialize on mount', async () => {
        render(<Layout />);

        await waitFor(() => {
            expect(mockStores.notificationsStore.initialize).toHaveBeenCalledTimes(1);
        });
    });

    it('should NOT render when route is NOT provided', () => {
        mockStores.layoutStore.route = undefined;

        const { container } = render(<Layout />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when route.fields are NOT provided', () => {
        mockStores.layoutStore.route.fields = undefined;

        const { container } = render(<Layout />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should call redirectToLoginPage and NOT render when shouldRedirectToTradeLoginPage and isTradePortal are true', () => {
        mockStores.layoutStore.shouldRedirectToTradeLoginPage = true;
        mockStores.layoutStore.isTradePortal = true;

        const { container } = render(<Layout />);

        expect(mockStores.routerStore.redirectToLoginPage).toHaveBeenCalled();
        expect(container).toBeEmptyDOMElement();
    });

    it('should render meta title', () => {
        render(<Layout />);

        expect(document.title).toBe('Test Title');
    });

    it('should render meta description', () => {
        const { container } = render(<Layout />);

        const metaDescription = container.querySelector('meta[name="description"]');
        expect(metaDescription).toHaveAttribute('content', 'Test Description');
    });

    it('should render optimizely preload, sitecore personalize loader and preconnect links when not isTradePortal, isExperienceEditor, or isPaymentPage', () => {
        render(<Layout />);

        expect(screen.getByTestId('optimizely-preconnect')).toBeInTheDocument();
        expect(screen.getByTestId('sitecore-personalize-loader')).toBeInTheDocument();
    });

    it('should NOT render optimizely preload and preconnect links when isTradePortal is true', () => {
        mockStores.layoutStore.isTradePortal = true;

        render(<Layout />);

        expect(screen.queryByTestId('optimizely-preconnect')).not.toBeInTheDocument();
    });

    it('should NOT render optimizely preload and preconnect links when isExperienceEditor is true', () => {
        mockStores.layoutStore.isExperienceEditor = true;

        render(<Layout />);

        expect(screen.queryByTestId('optimizely-preconnect')).not.toBeInTheDocument();
    });

    it('should NOT render optimizely preload and preconnect links when isPaymentPage is true', () => {
        mockStores.layoutStore.isPaymentPage = true;

        render(<Layout />);

        expect(screen.queryByTestId('optimizely-preconnect')).not.toBeInTheDocument();
    });

    describe('CIAM functionality', () => {
        it('should add CIAM forget password scripts when CIAM functionality and component are enabled ', () => {
            mockStores.layoutStore.isCIAMFunctionalityEnabled = true;
            mockStores.layoutStore.isCIAMForgetPasswordFormEnabled = true;
            render(<Layout />);

            const script = screen.getByTestId('ciam-js');
            expect(script).toHaveAttribute('type', 'module');
        });

        it('should NOT add CIAM forget password scripts when CIAM functionality is enabled and component is disabled ', () => {
            mockStores.layoutStore.isCIAMFunctionalityEnabled = true;
            mockStores.layoutStore.isCIAMForgetPasswordFormEnabled = false;
            render(<Layout />);

            expect(screen.queryByTestId('ciam-js')).not.toBeInTheDocument();
        });

        it('should NOT add CIAM forget password scripts when CIAM functionality is disabled and component is enabled ', () => {
            mockStores.layoutStore.isCIAMFunctionalityEnabled = false;
            mockStores.layoutStore.isCIAMForgetPasswordFormEnabled = true;
            render(<Layout />);

            expect(screen.queryByTestId('ciam-js')).not.toBeInTheDocument();
        });
    });

    describe('personalize', () => {
        it('should call sendIdentityEvent when engage is defined', async () => {
            mockStores.engageStore.engage = {} as Engage;
            render(<Layout />);

            await waitFor(() => {
                expect(mockStores.engageStore.initializeEngage).not.toHaveBeenCalled();
                expect(mockStores.engageStore.sendIdentityEvent).toHaveBeenCalledTimes(1);
            });
        });

        it('should call initializeEngage and sendIdentityEvent when engage is NOT defined', async () => {
            render(<Layout />);

            await waitFor(() => {
                expect(mockStores.engageStore.initializeEngage).toHaveBeenCalledTimes(1);
                expect(mockStores.engageStore.sendIdentityEvent).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('landmark', () => {
        it('should render landmark as a first element with expected props', () => {
            render(<Layout />);

            const layoutDiv = document.getElementById('layout');
            const mainTag = screen.getByRole('main');

            expect(layoutDiv).toBeInTheDocument();
            expect(within(layoutDiv!).getByTestId('landmark-link')).toBeInTheDocument();
            expect(within(layoutDiv!).getByTestId(`placeholder-${PlaceholderNames.Header}`)).toBeInTheDocument();
            expect(mainTag.parentElement).toBe(layoutDiv);
            expect(mainTag).toHaveAttribute('id', MAIN_CONTENT_ID);
            expect(within(mainTag).getByTestId(`placeholder-${PlaceholderNames.Body}`)).toBeInTheDocument();
            expect(mockLandMarkComponent).toHaveBeenCalledWith({
                linkTitle: SitecoreDictionary.AccessibilityLabelsSkipMainContent,
                sectionName: MAIN_CONTENT_ID,
            });
        });
    });

    describe('cookie banner detection', () => {
        let getCookieSpy: jest.SpyInstance;

        beforeEach(() => {
            jest.useFakeTimers();
            getCookieSpy = jest.spyOn(cookiesUtils, 'getCookie');
        });

        afterEach(() => {
            jest.runOnlyPendingTimers();
            jest.useRealTimers();
        });

        it('should check for the correct cookie keys', () => {
            getCookieSpy.mockReturnValue('');

            render(<Layout />);

            act(() => {
                jest.advanceTimersByTime(10);
            });

            expect(getCookieSpy).toHaveBeenCalledWith(CookiesKeys.EjMarketingCookie);
            expect(getCookieSpy).toHaveBeenCalledWith(CookiesKeys.EjPersonalisationCookie);
        });

        it('should call setCookiesPopupWasShown when Marketing cookie is present', () => {
            getCookieSpy.mockReturnValueOnce('').mockReturnValueOnce('true').mockReturnValue('');

            render(<Layout />);

            expect(mockStores.appStore.setCookiesPopupWasShown).not.toHaveBeenCalled();

            act(() => {
                jest.advanceTimersByTime(10);
            });

            expect(mockStores.appStore.setCookiesPopupWasShown).toHaveBeenCalledWith(true);
            expect(mockStores.appStore.setCookiesPopupWasShown).toHaveBeenCalledTimes(1);
        });

        it('should call setCookiesPopupWasShown when Performance_and_Personalisation cookie is present', () => {
            getCookieSpy.mockReturnValueOnce('').mockReturnValueOnce('').mockReturnValueOnce('1').mockReturnValue('');

            render(<Layout />);

            expect(mockStores.appStore.setCookiesPopupWasShown).not.toHaveBeenCalled();

            act(() => {
                jest.advanceTimersByTime(10);
            });

            expect(mockStores.appStore.setCookiesPopupWasShown).toHaveBeenCalledWith(true);
            expect(mockStores.appStore.setCookiesPopupWasShown).toHaveBeenCalledTimes(1);
        });

        it('should call setCookiesPopupWasShown when both cookies are present', () => {
            getCookieSpy.mockReturnValueOnce('').mockReturnValueOnce('1').mockReturnValueOnce('1').mockReturnValue('');

            render(<Layout />);

            act(() => {
                jest.advanceTimersByTime(10);
            });

            expect(mockStores.appStore.setCookiesPopupWasShown).toHaveBeenCalledWith(true);
            expect(mockStores.appStore.setCookiesPopupWasShown).toHaveBeenCalledTimes(1);
        });

        it('should NOT call setCookiesPopupWasShown when neither cookie is present', () => {
            getCookieSpy.mockReturnValue('');

            render(<Layout />);

            act(() => {
                jest.advanceTimersByTime(10);
                jest.advanceTimersByTime(10);
                jest.advanceTimersByTime(10);
            });

            expect(mockStores.appStore.setCookiesPopupWasShown).not.toHaveBeenCalled();
        });

        it('should stop polling after cookie is detected', () => {
            getCookieSpy.mockReturnValueOnce('').mockReturnValueOnce('1').mockReturnValue('');

            render(<Layout />);

            act(() => {
                jest.advanceTimersByTime(10);
            });
            expect(mockStores.appStore.setCookiesPopupWasShown).toHaveBeenCalledTimes(1);

            act(() => {
                jest.advanceTimersByTime(100);
            });
            expect(mockStores.appStore.setCookiesPopupWasShown).toHaveBeenCalledTimes(1);
        });
    });
});
