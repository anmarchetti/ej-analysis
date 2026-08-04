import { useEffect, useRef, useState } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

import { envAll } from 'code/env';
import { fontsConfig } from 'code/fonts.config';
import settings from 'code/settings';
import { useOptimizelyTracking } from 'frontend/hooks/useOptimizelyTracking';
import useStore from 'frontend/hooks/useStore';
import { isTradeStore } from 'frontend/store/tradePortal';
import { getCookie, listenCookieChange } from 'frontend/utils/cookies.utils';
import { isIFrame } from 'frontend/utils/iframe';
import isBackend from 'frontend/utils/isBackend';
import { CookiesKeys } from 'models/enum/CookiesKeys';
import { KeyboardKey } from 'models/enum/KeyboardKey';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import AskToPush from 'frontend/components/common/AskToPush/AskToPush';
import FontsLoader from 'frontend/components/common/FontsLoader/FontsLoader';
import GreyOverlay from 'frontend/components/common/GreyOverlay';
import HolidayNotAvailable from 'frontend/components/common/HolidayNotAvailable/HolidayNotAvailable';
import InvalidLuggageInUrlPopup from 'frontend/components/common/InvalidLuggageInUrlPopup/InvalidLuggageInUrlPopup';
import LandmarkLink from 'frontend/components/common/LandmarkLink/LandmarkLink';
import LayoutNotAvailable from 'frontend/components/common/LayoutNotAvailable';
import MaintenancePopup from 'frontend/components/common/MaintenancePopup/MaintenancePopup';
import Notifications from 'frontend/components/common/Notifications';
import PackageValidatingOverlay from 'frontend/components/common/PackageValidatingOverlay';
import PageCookiePolicy from 'frontend/components/common/PageCookiePolicy';
import SitecorePersonalizeLoader from 'frontend/components/common/SitecorePersonalizeLoader/SitecorePersonalizeLoader';
import SitecorePopup from 'frontend/components/common/SitecorePopup';
import { VisitorIdentification } from 'frontend/components/global/VisitorIdentification';

import HeadHrefLang from './frontend/components/common/HeadHreflang/HeadHrefLang';

const DynamicCreateAccountSuccessPopup = dynamic(
    () => import('frontend/components/renderings/CreateAccount/components/CreateAccountSuccessPopup'),
    { ssr: false },
);

export const MAIN_CONTENT_ID = 'main-content';

export const Layout = (): JSX.Element | null => {
    const {
        route,
        isEditMode,
        isAmendPassengerDetailsPage,
        isTradePortal,
        sitecoreItemId,
        fullUrl,
        isPaymentPage,
        metaPageTitle,
        metaPageDescription,
        metaCanonical,
        metaGoogleVerification,
        metaImage,
        metaRobots,
        metaCategory,
        metaType,
        sendIdentityEvent,
        engage,
        initializeEngage,
        shouldRedirectToTradeLoginPage,
        setCookiesPopupWasShown,
        isExperienceEditor,
        redirectToLoginPage,
        notificationStoreInitialize,
        isCIAMForgetPasswordFormEnabled,
        isCIAMFunctionalityEnabled,
        getPhrase,
        isDestinationPage,
        isHotelDetailsBrowsePage,
    } = useStore(stores => ({
        route: stores.layoutStore.route,
        isEditMode: stores.layoutStore.isEditMode,
        isAmendPassengerDetailsPage: stores.layoutStore.isAmendPassengerDetailsPage,
        isTradePortal: stores.layoutStore.isTradePortal,
        sitecoreItemId: stores.editorStore.activeItemId,
        fullUrl: stores.layoutStore.fullUrl,
        isPaymentPage: !isTradeStore(stores) && stores.layoutStore.isPaymentPage,
        metaPageTitle: stores.metadataStore.metaPageTitle,
        metaPageDescription: stores.metadataStore.metaPageDescription,
        metaCanonical: stores.metadataStore.metaCanonical,
        metaGoogleVerification: stores.metadataStore.metaGoogleVerification,
        metaImage: stores.metadataStore.metaImage,
        metaRobots: stores.metadataStore.metaRobots,
        metaCategory: stores.metadataStore.metaCategory,
        metaType: stores.metadataStore.metaType,
        initializeEngage: stores.engageStore.initializeEngage,
        engage: stores.engageStore.engage,
        sendIdentityEvent: stores.engageStore.sendIdentityEvent,
        shouldRedirectToTradeLoginPage: isTradeStore(stores) && stores.layoutStore.shouldRedirectToTradeLoginPage,
        setCookiesPopupWasShown: stores.appStore.setCookiesPopupWasShown,
        isExperienceEditor: stores.layoutStore.isExperienceEditor,
        redirectToLoginPage: stores.routerStore.redirectToLoginPage,
        notificationStoreInitialize: stores.notificationsStore.initialize,
        isCIAMFunctionalityEnabled: !isTradeStore(stores) && stores.layoutStore.isCIAMFunctionalityEnabled,
        isCIAMForgetPasswordFormEnabled: !isTradeStore(stores) && stores.layoutStore.isCIAMForgetPasswordFormEnabled,
        getPhrase: stores.layoutStore.getPhrase,
        isDestinationPage: stores.layoutStore.isDestinationPage,
        isHotelDetailsBrowsePage: stores.layoutStore.isHotelDetailsBrowsePage,
    }));

    const timer = useRef<any>();
    // State for old Optimizely Web Experimentation snippet
    const [optimizely, setOptimizely] = useState(false);

    // Optimizely Feature Experimentation SDK - initialization and tracking
    useOptimizelyTracking();

    useEffect(() => {
        /** Fix for EJH-12253 */
        document.addEventListener(
            'keydown',
            (e: KeyboardEvent) => {
                if (e.key === KeyboardKey.ESCAPE || e.key === KeyboardKey.ESC) {
                    const banner = document.getElementById('ensBannerBG');

                    if (banner) {
                        const styles = window.getComputedStyle(banner);

                        if (styles.getPropertyValue('display') === 'block') {
                            window.clearInterval(timer.current);
                            setCookiesPopupWasShown(true);
                        }
                    }
                }
            },
            false,
        );

        // Check cookie banner has been accepted or declined, so we can show other popups without overlap
        // Previously checked for EASYJET_ENSIGHTEN_PRIVACY_MODAL_VIEWED, updated due to change in Ensighten script behavior - PC-503
        timer.current = setInterval(() => {
            if (getCookie(CookiesKeys.EjMarketingCookie) || getCookie(CookiesKeys.EjPersonalisationCookie)) {
                window.clearInterval(timer.current);
                setCookiesPopupWasShown(true);
            }
        }, 10);
    }, []);

    useEffect(() => {
        // Wait to see if Personalization cookie is enabled, then add script
        if (optimizely) return;

        if (getCookie(settings.Cookies.Personalization) === '1') {
            setOptimizely(true);

            return;
        }

        const clearIntervalCallback = listenCookieChange(
            settings.Cookies.Personalization,
            () => {
                setOptimizely(true);
                initializeEngage(); // Initialising sitecore personalize when cookies are accepted
            },
            1000,
        );

        return clearIntervalCallback;
    }, [optimizely]);

    // ensures that notification set-up will be completed before calling other methods
    useEffect(() => {
        const init = async (): Promise<void> => {
            await notificationStoreInitialize();
        };

        init();
    }, [notificationStoreInitialize]);

    useEffect(() => {
        if (!isBackend()) {
            const sendPersonalizeIdentityEvent = async (): Promise<void> => {
                if (!engage) {
                    await initializeEngage();
                }

                sendIdentityEvent();
            };

            sendPersonalizeIdentityEvent();
        }
    }, [engage, initializeEngage, sendIdentityEvent]);

    if (shouldRedirectToTradeLoginPage) {
        redirectToLoginPage();

        return null;
    }

    if (!route?.fields) {
        return null;
    }

    const isNotDestinationPageExceptHotelDetailsBrowsePage = !isDestinationPage || isHotelDetailsBrowsePage;

    return (
        <>
            <Head>
                {/*for Destination pages title and description set up in PageHeroBanner*/}
                {isNotDestinationPageExceptHotelDetailsBrowsePage && (
                    <>
                        <title>{metaPageTitle}</title>
                        <meta property='og:title' content={metaPageTitle} />
                        <meta name='description' content={metaPageDescription} />
                        <meta property='og:description' content={metaPageDescription} />
                    </>
                )}
                <link rel='shortcut icon' type='image/x-icon' href='/favicon.ico' />
                {metaCanonical && <link rel='canonical' href={metaCanonical} />}
                <meta name='google-site-verification' content={metaGoogleVerification} />

                <meta property='og:image' content={metaImage} />

                <meta property='og:url' content={fullUrl} />

                <meta property='og:type' content={metaType} />

                <meta name='robots' content={metaRobots} />

                <meta name='trackingcategory' content={metaCategory} />
                {!isTradePortal && !isExperienceEditor && !isPaymentPage && (
                    <>
                        <link href='//logx.optimizely.com' data-tid='optimizely-preconnect' />

                        {optimizely && (
                            <script defer src='https://cdn.optimizely.com/public/24938460681/s/easyjet.js' />
                        )}
                    </>
                )}
                {isCIAMFunctionalityEnabled && isCIAMForgetPasswordFormEnabled && (
                    <script defer src={envAll.CIAM_JS} data-tid='ciam-js' type='module' />
                )}
            </Head>

            <HeadHrefLang />

            {!isIFrame() && <FontsLoader fontsConfig={fontsConfig} />}

            {/* 
                VisitorIdentification is necessary for Sitecore Analytics to determine if the visitor is a robot.
              
                Don't use VI from '@sitecore-jss/sitecore-jss-react', as it doesn't work for us. 
                Read more comments in src\frontend\components\global\VisitorIdentification.tsx.  
            */}
            <VisitorIdentification />

            <div id='layout' suppressHydrationWarning={isEditMode}>
                <LandmarkLink
                    linkTitle={getPhrase(SitecoreDictionary.AccessibilityLabelsSkipMainContent)}
                    sectionName={MAIN_CONTENT_ID}
                />
                <Placeholder name={PlaceholderNames.Header} rendering={route} />
                <main id={MAIN_CONTENT_ID}>
                    <Placeholder name={PlaceholderNames.Body} rendering={route} />
                </main>
            </div>

            <footer
                className={classNames({
                    footer_trade: isTradePortal,
                    footer_passengers: isAmendPassengerDetailsPage,
                })}
            >
                <Placeholder name={PlaceholderNames.Footer} rendering={route} />
            </footer>

            <GreyOverlay />
            {isTradePortal && <PackageValidatingOverlay />}
            <HolidayNotAvailable />
            {/* FIXME: Will this ever trigger on next.js ?? */}
            <LayoutNotAvailable />
            <PageCookiePolicy />
            <MaintenancePopup />
            <AskToPush />
            <InvalidLuggageInUrlPopup />
            <SitecorePersonalizeLoader />

            {isEditMode && sitecoreItemId && <SitecorePopup itemId={sitecoreItemId} />}

            <Notifications />
            {!isTradePortal && <DynamicCreateAccountSuccessPopup />}
        </>
    );
};

export default observer(Layout);
