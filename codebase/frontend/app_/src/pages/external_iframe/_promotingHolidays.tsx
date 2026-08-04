import { useEffect, useState } from 'react';
import { ComponentPropsContext, Placeholder, SitecoreContext } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';
import { GetServerSidePropsResult } from 'next';

import { ENGLISH, TSitecoreLangs } from 'code/cmsLang';
import { fontsConfig } from 'code/fonts.config';
import useStore from 'frontend/hooks/useStore';
import { createHolidaysAppStores, IHolidaysStores } from 'frontend/store/holidays/create-stores';
import {
    saveDotComDeeplinkDatesToSearchStore,
    saveDotComDeeplinkGuestsToSearchStore,
    saveDotComDeeplinkOriginsToSearchStore,
    saveDotComDepplinkDestinationToSearchStore,
} from 'frontend/utils/dotComDeeplinkHelpers';
import { parseQuery } from 'frontend/utils/url.utils';
import { TServerSidePageContext, TSitecorePageProps } from 'lib/page-props';
import { sitecorePagePropsFactory } from 'lib/page-props-factory';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitePath from 'models/enum/SitePath';
import FontsLoader from 'frontend/components/common/FontsLoader/FontsLoader';
import IframeHolidaysCarousel from 'frontend/components/renderings/iframe/IframeHolidaysCarousel/IframeHolidaysCarousel';
import IframeHolidaysHeader from 'frontend/components/renderings/iframe/IframeHolidaysPromotingHeader/IframeHolidaysPromotingHeader';

const map = new Map();

map.set('Hotels Carousel', IframeHolidaysCarousel);
map.set('Iframe Holidays Promoting Header', IframeHolidaysHeader);

function componentFactory(name) {
    return map.get(name);
}

const hideIframe = () => {
    const el = window.top?.document.getElementById('HolidayBlockFrame');

    if (el) {
        el.style.height = '0px';
    }

    window.top?.postMessage(`{"content":"NoContent","height":0}`, window.top.location.origin);
};

const IframePage = ({ componentProps, layout, query }: TSitecorePageProps): JSX.Element => {
    const [isShown, setIsShown] = useState(false);

    const { isMaintenance, route, searchStore, hotelsStore, grabSearchValuesFromSearchStore } = useStore(
        (stores: IHolidaysStores) => ({
            isMaintenance: stores.layoutStore.isMaintenance,
            route: stores.layoutStore.route,
            searchStore: stores.searchStore,
            hotelsStore: stores.hotelsStore,
            grabSearchValuesFromSearchStore: stores.bookingStore.grabSearchValuesFromSearchStore,
        }),
    );

    const getIframeOffers = async () => {
        try {
            const destinationsWereFound = await saveDotComDepplinkDestinationToSearchStore(
                query['destinations'],
                searchStore,
            );

            if (!destinationsWereFound) {
                throw new Error(`There are no any holidays for these destination codes: ${query['destinations']}`);
            }

            const adults = Number(query['adults']);
            const children = Number(query['children']);
            const infants = Number(query['infants']);
            const departureAirportsQuery = query['departure_airports'];
            const departureAirportsString = Array.isArray(departureAirportsQuery)
                ? departureAirportsQuery.join(',')
                : departureAirportsQuery.replaceAll('+', ',');

            saveDotComDeeplinkOriginsToSearchStore(departureAirportsString, searchStore);
            saveDotComDeeplinkGuestsToSearchStore({ adults, children, infants }, searchStore);
            saveDotComDeeplinkDatesToSearchStore(query['dd'], query['rd'], searchStore);
            searchStore.searchWhen.flexDays = 0;
            grabSearchValuesFromSearchStore();

            await hotelsStore.fetchOffers(true);

            if (!hotelsStore.hasOffers) {
                throw new Error('No offers');
            }

            setIsShown(!isMaintenance && true);
        } catch (e) {
            setIsShown(false);
            hideIframe();
        }
    };

    useEffect(() => {
        getIframeOffers();
    }, []);

    useEffect(() => {
        if (isShown) {
            // Add timeout to wait for the page to load, because sometimes the height is calculated incorrectly (EUX-854)
            setTimeout(() => {
                if (isMaintenance) {
                    hideIframe();
                } else {
                    const height = document.documentElement.scrollHeight;

                    window.top?.postMessage(`{"content":"Successful","height":${height}}`, window.top.location.origin);
                }
            }, 1000);
        }
    }, [isShown, isMaintenance]);

    if (!isShown) {
        return <></>;
    }

    return (
        <>
            <style global jsx>{`
                html {
                    height: 100%;
                }
                body {
                    max-width: 1200px;
                    margin: 0 auto;
                }

                ::-webkit-scrollbar {
                    width: 16px;
                }

                ::-webkit-scrollbar-track {
                    background-color: #fff;
                }

                ::-webkit-scrollbar-thumb {
                    background-color: #f60;
                    border: 6px solid #fff;
                    border-radius: 8px;
                }
            `}</style>
            <ComponentPropsContext value={componentProps}>
                <SitecoreContext componentFactory={componentFactory} layoutData={layout}>
                    {!isMaintenance && (
                        <div>
                            <FontsLoader fontsConfig={fontsConfig} />
                            <Placeholder name={PlaceholderNames.Body} rendering={route as any} />
                        </div>
                    )}
                </SitecoreContext>
            </ComponentPropsContext>
        </>
    );
};

export const getServerSideProps = async (
    context: TServerSidePageContext,
): Promise<GetServerSidePropsResult<TSitecorePageProps>> => {
    context.res.removeHeader('X-Frame-Options');
    context.res.locals = context.res.locals || {};
    context.res.locals.isIframe = true;
    context.res.locals.noAnalytics = true;
    context.res.locals.isPromoCarouselIframe = true;

    const path = SitePath.IFramePromotingHolidaysPage;
    const props = await sitecorePagePropsFactory.create(context, true, path);

    // Return custom 404 page
    if (!props) {
        return { notFound: true };
    }

    const stores = createHolidaysAppStores();
    const locals = context.res.locals || {};
    const req = context.req;
    const lang = locals.lang ?? (context.locale as TSitecoreLangs) ?? ENGLISH;

    await stores.layoutStore.updateLang(lang);
    stores.layoutStore.basePath = locals.basePath ?? '';
    stores.layoutStore.currentPath = locals.path ?? '';
    stores.layoutStore.domain = req.headers.host;
    stores.layoutStore.protocol = (req.headers['x-forwarded-proto'] as string) || context.req.protocol;
    stores.layoutStore.setFullUrl(stores.layoutStore.currentPath);

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

    stores.queryParamStore.query = parseQuery(context.req.originalUrl.split('?')[1]);
    stores.rootStore.syncUrlParamsWithStores();

    props.initMobxState = JSON.parse(stores.rootStore.serialize());
    props.query = stores.queryParamStore.query;

    // No send dictionary and other setting as page props, they already set in layoutStore.
    // It reduces the page size, because next.js add all props to __NEXT_DATA__ and write it to html.
    delete props.dictionary;
    delete props.settings;
    delete props.tooltipSettings;
    delete props.allMarketsSettings;

    return { props };
};

export default observer(IframePage);
