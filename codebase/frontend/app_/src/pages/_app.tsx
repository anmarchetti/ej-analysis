import { useEffect, useLayoutEffect } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Router from 'next/router';
import { SessionProvider } from 'next-auth/react';
// NProgress provides a loading indicator on page/route changes
import NProgress from 'nprogress';

import { getInitStoreStateFromPageProps, useApplicationStoreBaseOnSiteName } from 'frontend/store/create-store';
import StoreProvider from 'frontend/store/StoreProvider';
import { SiteName } from 'models/enum/SiteName';

import 'react-tooltip/dist/react-tooltip.css';
import 'nprogress/nprogress.css';
// Import CSS libs
import 'normalize.css/normalize.css';
import 'react-multi-carousel/lib/styles.css';
import 'styles/index.scss';
import '../../../Prototypes/src/sass/index.scss';

// polyfill for setImmediate (used for winston logging)
import 'setimmediate';

NProgress.configure({ showSpinner: false, trickleSpeed: 100 });

Router.events.on('routeChangeStart', (url, options) => {
    if (!options.shallow) {
        NProgress.start();
    }
});
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

function App({ Component, pageProps: { session, ...pageProps } }: AppProps<any>): JSX.Element | null {
    const { initMobxState, ssoAuthenticated, ...rest } = pageProps;

    const initStoreState = getInitStoreStateFromPageProps(pageProps);

    const { layout, isInit } = pageProps;

    const siteName = layout?.sitecore?.context?.site?.name || SiteName.Holidays;
    const stores = useApplicationStoreBaseOnSiteName(initStoreState, siteName);

    // Load day.js locales for provided language
    // check user login on init
    useEffect(() => {
        stores.userStore.setUserLoggedIn(ssoAuthenticated);
    }, [ssoAuthenticated]);

    useLayoutEffect(() => {
        if (layout) {
            // Update layout on page changes (but not init)
            !initMobxState && stores.layoutStore.updateLayout(layout);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initMobxState, layout]);

    useEffect(() => {
        if (layout) {
            // Track page load event on Google Analytic
            stores.trackingStore.callTagManager();

            // Splunk RUM page view custom event
            stores.trackingStore.trackRumPageView();

            const experiments = layout.sitecore?.context?.experiments;

            if (experiments?.length) {
                !isInit && stores.engageStore.setExperiments(experiments);

                stores.engageStore.syncExperiments();
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initMobxState, layout]);

    return (
        // Use the next-localization (w/ rosetta) library to provide our translation dictionary to the app.
        // Note Next.js does not (currently) provide anything for translation, only i18n routing.
        // If your app is not multilingual, next-localization and references to it can be removed.
        <>
            <Head>
                <meta
                    name='viewport'
                    content='width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, user-scalable=yes'
                />
            </Head>
            <StoreProvider {...stores}>
                {/* <I18nProvider lngDict={dictionary} locale={pageProps.locale}> */}
                {siteName === SiteName.TradePortal ? (
                    <SessionProvider
                        basePath='/holidays/api/auth'
                        session={session}
                        refetchOnWindowFocus={false}
                        refetchWhenOffline={false}
                    >
                        <Component {...rest} />
                    </SessionProvider>
                ) : (
                    <Component {...rest} />
                )}
                {/* </I18nProvider> */}
            </StoreProvider>
        </>
    );
}

export default App;
