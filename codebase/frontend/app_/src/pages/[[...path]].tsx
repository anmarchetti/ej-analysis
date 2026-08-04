import { useEffect } from 'react';
import { ComponentPropsContext, SitecoreContext } from '@sitecore-jss/sitecore-jss-nextjs';
import { handleEditorFastRefresh } from '@sitecore-jss/sitecore-jss-nextjs/utils';
import Layout from 'Layout';
import { GetServerSidePropsResult } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { componentFactory } from 'temp/componentFactory';

import { ENGLISH, TSitecoreLangs } from 'code/cmsLang';
import { envAll } from 'code/env';
import { logger } from 'frontend/services/logging';
import offersService from 'frontend/services/offers.service';
import { FLIGHTS_PLUS_HOTEL_PROVIDER } from 'frontend/store/base/queryParams/constants';
import { createHolidaysAppStores, isHolidayStore } from 'frontend/store/holidays/create-stores';
import { createTradePortalAppStores } from 'frontend/store/tradePortal';
import { isAuthenticated } from 'frontend/utils/auth/auth.utils';
import { verifyFphSignature } from 'frontend/utils/fph.utils';
import { deviceDetect } from 'frontend/utils/mobileDetect.utils';
import { getPromoPageDestinationByUrl } from 'frontend/utils/promoPage.utils';
import { getServerSidePageRedirect } from 'frontend/utils/redirect.utils';
import { parseQuery } from 'frontend/utils/url.utils';
import { preloadDynamicRenderings } from 'lib/components-preload';
import { TServerSidePageContext, TSitecorePageProps } from 'lib/page-props';
import { sitecorePagePropsFactory } from 'lib/page-props-factory';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import { SiteName } from 'models/enum/SiteName';
import SitePath, { TradePortalSitePath } from 'models/enum/SitePath';
import { SubmitPayload } from 'models/enum/SubmitPayload';
import TradePortalSitecoreTemplateId from 'models/enum/tradePortal/TradePortalSitecoreTemplateId';
import RouterHandler from 'frontend/components/global/RouterHandler';

const SitecorePage = ({ componentProps, layout, isInit }: TSitecorePageProps): JSX.Element => {
    useEffect(() => {
        // Since Sitecore editors do not support Fast Refresh, need to refresh EE chromes after Fast Refresh finished
        handleEditorFastRefresh();
    }, []);

    useEffect(() => {
        if (isInit || !layout) {
            return;
        }

        // preload all dynamic renderings from layout, so all dynamic components needed for a page are loaded at once (is useful when we have inner components)
        preloadDynamicRenderings(layout);
    }, [layout, isInit]);

    // Uncomment when you need to check accessibility issues
    // useAxeReact();

    return (
        <RouterHandler>
            <ComponentPropsContext value={componentProps}>
                <SitecoreContext componentFactory={componentFactory} layoutData={layout}>
                    <Layout />
                </SitecoreContext>
            </ComponentPropsContext>
        </RouterHandler>
    );
};

/**
 * This function is called on each request
 * (i.e. called on first render and when navigating between the pages)
 */
export const getServerSideProps = async (
    context: TServerSidePageContext,
): Promise<GetServerSidePropsResult<TSitecorePageProps>> => {
    // check that it's first page request (no moving between pages)
    const isInit = !context.res.locals?.sameSession;
    const isEditMode = context.preview;
    const props = await sitecorePagePropsFactory.create(context, isInit);

    // Return custom 404 page
    if (!props) {
        return { notFound: true };
    }

    // Return redirect, if current page should be redirected.
    // Don't redirect on edit mode (i.e. Experience Editor)
    const redirect = !isEditMode && getServerSidePageRedirect(props, context);

    if (redirect) {
        return { redirect };
    }

    // Verify FPH URL signature on extras and guest details pages to prevent URL tampering.
    // Don't verify in edit mode (Experience Editor).
    const query = context.query as Record<string, string>;
    const templateId = props.layout.sitecore.route?.templateId;
    const isFphPage =
        (templateId === SitecoreTemplateId.ExtrasPage || templateId === SitecoreTemplateId.GuestDetailsPage) &&
        query[QueryParamName.ExperienceContextProvider]?.toLowerCase() === FLIGHTS_PLUS_HOTEL_PROVIDER;

    if (!isEditMode && isFphPage) {
        const isValid = verifyFphSignature(query, envAll.FPH_URL_SIGNING_KEY);

        if (!isValid) {
            return {
                redirect: {
                    destination: `${context.res.locals?.basePath || ''}${SitePath.Home}`,
                    permanent: false,
                },
            };
        }
    }

    props.isInit = isInit;

    const isTradePortal = props.layout.sitecore.context.site?.name === SiteName.TradePortal;
    let session;

    // Redirect to Login Page on Trade Portal if agent is not logged
    // Don't do it in Experience Editor.
    if (
        !isEditMode &&
        isTradePortal &&
        !(props.layout.sitecore.route.templateId === TradePortalSitecoreTemplateId.LoginPage)
    ) {
        session = await getServerSession(context.req, context.res, authOptions);

        const loginRedirect = {
            redirect: {
                permanent: false,
                destination: `${context.res.locals?.basePath || ''}${TradePortalSitePath.Login}`,
            },
        };

        try {
            const isLoggedIn = await isAuthenticated(session, context.req);

            if (!isLoggedIn) {
                return loginRedirect;
            }
        } catch {
            return loginRedirect;
        }
    }

    // create app store only on initial page request (no moving between pages)
    if (isInit) {
        const stores = isTradePortal ? createTradePortalAppStores() : createHolidaysAppStores();
        const locals = context.res.locals || {};
        const req = context.req;
        const reqBody = req.body || {};
        const lang = locals.lang ?? (context.locale as TSitecoreLangs) ?? ENGLISH;

        stores.layoutStore.updateLang(lang);

        stores.layoutStore.isMobileDeviceDetectedDuringSSR = deviceDetect(
            context.req.headers['user-agent'] ?? '',
        ).isMobile;
        stores.layoutStore.basePath = locals.basePath ?? '';
        stores.layoutStore.currentPath = locals.path ?? '';
        stores.layoutStore.domain = req.headers.host;
        stores.layoutStore.protocol = (req.headers['x-forwarded-proto'] as string) || context.req.protocol;
        stores.layoutStore.setFullUrl(stores.layoutStore.currentPath);
        stores.layoutStore.referrer = req.headers.referer;
        stores.layoutStore.rawCookies = req.headers.cookie || '';

        stores.payStore.isPaymentAllowed =
            envAll.ENV_DEV || !envAll.PAYMENT_ALLOWED_HOST || envAll.PAYMENT_ALLOWED_HOST === stores.layoutStore.domain;

        if (props.layout) {
            stores.layoutStore.layout = props.layout;
        }

        if (props.dictionary) {
            stores.layoutStore.dictionary = { phrases: props.dictionary };
        }

        if (props.settings) {
            stores.layoutStore.saveSettings(props.settings);
        }

        if (props.tooltipSettings) {
            stores.layoutStore.saveTooltipSettings(props.tooltipSettings);
        }

        if (props.allMarketsSettings) {
            stores.marketStore.allMarketsSettings = props.allMarketsSettings;
        }

        if (isHolidayStore(stores)) {
            if (reqBody[SubmitPayload.PayBalanceInfo]) {
                stores.payBalanceStore.payBalancePayload = JSON.parse(reqBody[SubmitPayload.PayBalanceInfo]);
            }
        }

        stores.searchStore.searchWho.allocateManyRooms();

        const experiments = props.layout.sitecore?.context?.experiments;

        if (experiments?.length) {
            stores.engageStore.setExperiments(experiments);
        }

        if (reqBody[SubmitPayload.GuestsInfo]) {
            stores.bookingStore.guestsInfoPayload = JSON.parse(reqBody[SubmitPayload.GuestsInfo]);

            if (envAll.ENV_DEV) {
                logger.info(['PAYMENT PAGE: parse payload' + JSON.stringify(stores.bookingStore.guestsInfoPayload)]);
                console.error('PAYMENT PAGE: parse payload', JSON.stringify(stores.bookingStore.guestsInfoPayload));
            }
        }

        if (reqBody[SubmitPayload.BookingInfo]) {
            stores.bookingStore.bookingInfoPayload = JSON.parse(reqBody[SubmitPayload.BookingInfo]);
        }

        if (reqBody[SubmitPayload.ViewBookingInfo]) {
            stores.viewBookingStore.viewBookingPayload = JSON.parse(reqBody[SubmitPayload.ViewBookingInfo]);
        }

        if (reqBody[SubmitPayload.AmendPaymentInfo] && 'amendPaymentStore' in stores) {
            stores.amendPaymentStore.amendPaymentPayload = JSON.parse(reqBody[SubmitPayload.AmendPaymentInfo]);
        }

        if (stores.layoutStore.isDynamicPromoPage && context.req.path) {
            /** Find destination for Dynamic Promo Page. Destination Name is important for SEO, because it's used in <title>.   */
            const desRes = await offersService.getAllDestinations();
            stores.promoPageStore.pageDestination = getPromoPageDestinationByUrl(
                context.req.path,
                desRes?.destinations,
            );
        }

        stores.queryParamStore.query = parseQuery(context.req.originalUrl.split('?')[1]);
        stores.layoutStore.setPageSearchSortOrder();
        stores.rootStore.syncUrlParamsWithStores();

        props.initMobxState = JSON.parse(stores.rootStore.serialize());
    }

    // No send dictionary and other setting as page props, they already set in layoutStore.
    // It reduces the page size, because next.js add all props to __NEXT_DATA__ and write it to html.
    delete props.dictionary;
    delete props.settings;
    delete props.tooltipSettings;
    delete props.allMarketsSettings;

    if (session) {
        return { props: { ...props, ssoAuthenticated: true } };
    }

    return { props };
};

export default SitecorePage;
