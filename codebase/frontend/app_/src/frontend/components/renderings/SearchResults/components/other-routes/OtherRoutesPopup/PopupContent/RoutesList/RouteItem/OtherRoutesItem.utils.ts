import { DATE_FORMATS } from 'code/dates';
import { QueryParamsStore } from 'frontend/store/holidays/queryParams/QueryParamsStore';
import RouterStore from 'frontend/store/holidays/router/RouterStore';
import { addDays, formatDateL10n, parseDateL10n } from 'frontend/utils/date.utils';
import { IOffer } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { QueryParamName } from 'models/enum/QueryParamName';

export const buildUrl = ({
    offer,
    routeOutbound,
    isPromoPage,
    currentPath,
    routeInbound,
    buildHotelDetailsQuery,
    hotelDetailsUrl,
}: {
    buildHotelDetailsQuery: QueryParamsStore['buildHotelDetailsQuery'];
    currentPath: string;
    hotelDetailsUrl: RouterStore['hotelDetailsUrl'];
    isPromoPage: boolean;
    offer: IOffer;
    routeOutbound: IRoute;
    routeInbound?: IRoute;
}): string => {
    const transfer = offer.transfers?.length > 0 ? offer.transfers[0].code : '';
    const origin = routeOutbound.depPt;
    const startDate = parseDateL10n(offer.date, DATE_FORMATS.query) as Date;
    const endDate = addDays(offer.stay, startDate);

    const additionalParams = {
        [QueryParamName.Transfer]: transfer,
        [QueryParamName.DefaultTransfer]: transfer,
        [QueryParamName.OtherRoutes]: origin,
    };

    const fallbackParams = {
        [QueryParamName.From]: formatDateL10n(startDate),
        [QueryParamName.To]: formatDateL10n(endDate),
    };

    if (isPromoPage) {
        additionalParams[QueryParamName.Promo] = currentPath || '';
        additionalParams[QueryParamName.Origin] = [origin];
    }

    //Rewrite transport routes to match the new route structure
    //Origins can NOT be changed for search results page - it would break back to search and all other requests
    //=======================================
    additionalParams[QueryParamName.OutboundId] = routeOutbound.id;
    additionalParams[QueryParamName.InboundId] = routeInbound?.id;
    //=======================================

    const query = buildHotelDetailsQuery(offer, additionalParams, fallbackParams);

    return hotelDetailsUrl(offer.hotel, query);
};
