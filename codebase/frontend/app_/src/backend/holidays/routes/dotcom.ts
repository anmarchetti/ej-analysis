import { isDotcomQuery } from 'backend/utils/isDotcomQuery';
import express, { NextFunction, Request, Response } from 'express';
import { Guid } from 'guid-typescript';
import qs from 'qs';

import { buildBasePathByLang } from 'code/basePath';
import { getLangByCMSLang } from 'code/cmsLang';
import { getEnv } from 'code/env.server';
import { logger } from 'frontend/services/logging';
import { createHolidaysAppStores } from 'frontend/store/holidays/create-stores';
import { isHotelDetails } from 'frontend/utils/buildSitecorePath';
import {
    getMarketFromDotComDeeplink,
    saveDotComDeeplinkDatesToSearchStore,
    saveDotComDeeplinkOriginsToSearchStore,
    saveDotComDeeplinkRoomsToSearchStore,
    saveDotComDepplinkDestinationToSearchStore,
} from 'frontend/utils/dotComDeeplinkHelpers';
import { getUtmParams, HomepageUtm, HotelDetailsUtm, isLacksUtmParam } from 'frontend/utils/utm.utils';
import { OrderBy } from 'models/enum/OrderBy';
import { OrderDirection } from 'models/enum/OrderDirection';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitePath from 'models/enum/SitePath';

const dotcomRouter = express.Router();

/**
 * If we on hotel details page and came from iframe than add utm params (http://jra.europe.easyjet.local/browse/EJH-6747)
 * utm_source=easyjet&utm_medium=en_pickflights&utm_campaign=recommended
 */
dotcomRouter.get('*', (req, res, next) => {
    const query = req.query;
    const isHotelDetailsFromIframe =
        isHotelDetails(query) &&
        query[QueryParamName.IsPromotingIframe] !== undefined &&
        !!query[QueryParamName.IsPromotingIframe];

    if (!isHotelDetailsFromIframe) {
        next();

        return;
    }

    let utmParams = getUtmParams(req.query as any);

    // add and replace params only if they are not already set
    if (isLacksUtmParam(utmParams, HotelDetailsUtm)) {
        utmParams = {
            ...utmParams,
            ...HotelDetailsUtm,
        };

        res.redirect(req.baseUrl + req.url + `&${qs.stringify(utmParams)}`);

        return;
    }

    next();
});

/**
 * Handle request from click on show more holidays on easyJet.com website
 *
london all, spain a few codes, 2 adults
http://localhost:3000/en/holidays/mixedresultlist/?departure_airports=LGW,LTN,SEN,STN&destinations=2432,2347,2359,2662&dd=2019-11-20&rd=2019-11-27&dur=7&rooms[]=2&currency=GBP&rooms_count=1&shouldOpenRoomsWidget=0&min_recommendation=-1&utm_source=easyjet_search_button&utm_medium=EN_HolidaysPod&utm_term=Holidays&utm_content=Holiday&utm_campaign=searchpod&request_is_search_widget=true&board_codes=GT06-AO,GT06-SC,GT06-BB,GT06-HB%20GT06-HBP,GT06-FB%20GT06-FBP,GT06-AI%20GT06-AIP%20GT06-AIU%20GT06-AIR

london all, spain a few codes, 8 adults, 6 children
http://localhost:3000/en/holidays/mixedresultlist/?departure_airports=LGW,LTN,SEN,STN&destinations=2432,2347,2359,2662&dd=2019-11-20&rd=2019-11-27&dur=7&rooms[]=8.0.0.0.0.0.0&currency=GBP&rooms_count=1&shouldOpenRoomsWidget=0&min_recommendation=-1&utm_source=easyjet_search_button&utm_medium=EN_HolidaysPod&utm_term=Holidays&utm_content=Holiday&utm_campaign=searchpod&request_is_search_widget=true&board_codes=GT06-AO,GT06-SC,GT06-BB,GT06-HB%20GT06-HBP,GT06-FB%20GT06-FBP,GT06-AI%20GT06-AIP%20GT06-AIU%20GT06-AIR

london all, spain all, 2 adults, 2 children, 2 infants
http://localhost:3000/en/holidays/mixedresultlist/?departure_airports=LGW,LTN,SEN,STN&destinations=2432,2347,2359,2662&dd=2019-11-21&rd=2019-11-28&dur=7&rooms[]=2.0.0.0.0&currency=GBP&rooms_count=1&shouldOpenRoomsWidget=1&min_recommendation=-1&utm_source=easyjet_search_button&utm_medium=EN_HolidaysPod&utm_term=Holidays&utm_content=Holiday&utm_campaign=searchpod&request_is_search_widget=true&board_codes=GT06-AO,GT06-SC,GT06-BB,GT06-HB%20GT06-HBP,GT06-FB%20GT06-FBP,GT06-AI%20GT06-AIP%20GT06-AIU%20GT06-AIR
*/

export const searchResultCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!isDotcomQuery(req.query)) {
        next();

        return;
    }

    let correlationId = '';

    try {
        const query = req.query as {
            dd: string;
            departure_airports: string;
            destinations: string;
            rd: string;
            rooms: string[];
        };

        const { destinations, departure_airports: departureAirportsQuery, dd, rd, rooms } = query;

        correlationId = Guid.create().toString();

        logger.info(
            JSON.stringify({
                title: 'Handle deeplink from easyJet.com',
                correlationId,
                url: req.url,
            }),
        );

        const stores = createHolidaysAppStores();
        const searchStore = stores.searchStore;

        const destinationsWereFound = await saveDotComDepplinkDestinationToSearchStore(destinations, searchStore);

        if (!destinationsWereFound) {
            throw new Error(`There are no any holidays for these destination codes: ${destinations}`);
        }

        /**
         * On .com website, the language and airports are not related, i.e. the user can always select any airport.
         * On holidays website, the departure airports depend on the language/market.
         * So we need to redirect to holidays website in the correct language / market.
         * (For example, if the user select Swiss airports on /en, then redirect to /ch-fr)
         */
        const siteLang = res.locals.lang;
        const { DEEPLINK_AIRPORTS_MAPPING: departureAirportsMapping = {} } = getEnv();

        const departureAirports: string[] = Object.keys(departureAirportsMapping).length
            ? departureAirportsQuery.split(',').flatMap(code => {
                  const codes = departureAirportsMapping[code.toUpperCase()];

                  return codes ? codes.split(',') : code;
              })
            : departureAirportsQuery.split(',');

        const market = await getMarketFromDotComDeeplink(departureAirports, siteLang);

        if (!market) {
            throw new Error(`There is no Market for departure airports: ${departureAirportsQuery}`);
        }

        const marketLang = market.Language ? getLangByCMSLang(market.Language) : null;
        const marketBaseUrl = (marketLang && marketLang !== siteLang && buildBasePathByLang(marketLang)) || req.baseUrl;

        saveDotComDeeplinkOriginsToSearchStore(departureAirports.join(','), searchStore);
        saveDotComDeeplinkRoomsToSearchStore(rooms, searchStore);
        saveDotComDeeplinkDatesToSearchStore(dd, rd, searchStore);
        stores.bookingStore.grabSearchValuesFromSearchStore();

        const utmParams = getUtmParams(query);
        const utmParamsString = qs.stringify(utmParams);
        const shouldShowPopunder = stores.queryParamStore.shouldShowPopunder(utmParams);

        /**
         * If there are children in mix or default value of 1 adult from easyjet.com then redirect to home page
         */
        if (
            stores.searchStore.searchWho.childrenQuantity > 0 ||
            stores.searchStore.searchWho.totalGuestsQuantity === 1
        ) {
            res.redirect(
                `${marketBaseUrl}${stores.queryParamStore.buildSearchQuery()}&${
                    QueryParamName.OpenSearchPodWhoField
                }=1&${QueryParamName.IsReferer}=1&${utmParamsString}`,
            );
        } else {
            res.redirect(
                `${marketBaseUrl}${SitePath.Search}${stores.queryParamStore.buildSearchQueryWithParams(true, {
                    [QueryParamName.IsReferer]: true,
                    ...(shouldShowPopunder
                        ? {
                              [QueryParamName.OrderBy]: OrderBy.Price,
                              [QueryParamName.OrderDirection]: OrderDirection.Asc,
                          }
                        : {
                              [QueryParamName.OrderBy]: OrderBy.Recommended,
                              [QueryParamName.OrderDirection]: OrderDirection.Default,
                          }),
                })}&${utmParamsString}`,
            );
        }
    } catch (e) {
        logger.error({ e }, correlationId);

        // add utm params per http://jra.europe.easyjet.local/browse/EJH-6747 Scenario 1
        // https://www.easyjet.com/en/holidays/?utm_source=easyjet&utm_medium=en_homepage&utm_term=Holidays&utm_content=searchpodform&utm_campaign=holidays_home

        let utmParams = getUtmParams(req.query as any);

        // add params from story + any other that come from .com site
        utmParams = {
            ...utmParams,
            ...HomepageUtm,
        };

        res.redirect(req.baseUrl + `?${qs.stringify(utmParams)}`);
    }
};

dotcomRouter.get('/mixedresultlist', searchResultCallback);

export default dotcomRouter;
