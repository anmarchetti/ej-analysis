import qs from 'qs';

import { QueryParamName } from 'models/enum/QueryParamName';
import SitePath from 'models/enum/SitePath';

import isStaticPath from './isStaticPath';

const BookingFlowPages = [
    SitePath.Search,
    SitePath.Extras,
    SitePath.GuestsDetails,
    SitePath.Payment,
    SitePath.BookingConfirmation,
];

export interface ISitecoreLayoutParams {
    accId?: string;
    campaignId?: string;
    goal?: string;
    isHotelDetails?: boolean;
    theme?: string;
}

export const isHotelDetails = (query: qs.ParsedQs, path?: SitePath, strict?: boolean): boolean => {
    const isBookingFlow = query[QueryParamName.IsBookingFlow] !== undefined && !!query[QueryParamName.IsBookingFlow];

    // explicitly check that we are not other pages of booking flow
    if (path && strict) {
        return BookingFlowPages.indexOf(path) === -1 && isBookingFlow;
    }

    return isBookingFlow;
};

export const isBookingFlow = (search: string): boolean =>
    !!decodeURIComponent(search).replace('?', '').match(`${QueryParamName.IsBookingFlow}=true`);

export const addParamsToPath = (path: string, params: string[][]): string => {
    const paramsString = params.reduce((result, current) => {
        result += `&${current[0]}=${current[1]}`;

        return result;
    }, '');

    return path + paramsString;
};

// get url in react app from layout url
export const getPathFromLayoutPath = (layoutPath: string): string => {
    if (!layoutPath) {
        return SitePath.Home;
    }

    const prefixes = ['/destinations', '/root', '/dynamicpromopages'];
    const prefixToRemove = prefixes.find(prefix => layoutPath.startsWith(prefix + '/'));
    const path: string = prefixToRemove ? layoutPath.substr(prefixToRemove.length) : layoutPath;

    return path;
};

export const buildSitecorePath = (path: string, params: ISitecoreLayoutParams): string[] => {
    let _path = path;
    const possiblePaths: string[] = [];
    const searchParams: string[][] = [];

    if (_path.length > 1 && _path.endsWith('/')) {
        _path = _path.substring(0, _path.length - 1);
    }

    if (params.campaignId) {
        searchParams.push([QueryParamName.Campaign, params.campaignId]);
    }

    if (params.goal) {
        searchParams.push([QueryParamName.Goal, params.goal]);
    }

    if (isStaticPath(_path)) {
        return [addParamsToPath(_path, searchParams)];
    }

    // can be either Book or Browse mode
    if (params.isHotelDetails) {
        const path = '/hotel-details';

        const hotelDetailsParams = [...searchParams];

        if (params.theme) {
            hotelDetailsParams.push([QueryParamName.Theme, params.theme]);
        }

        if (params.accId) {
            hotelDetailsParams.push([QueryParamName.AccommodationId, params.accId]);
        }

        possiblePaths.push(addParamsToPath(path, hotelDetailsParams));
    }

    const pathWithParams = addParamsToPath(path, searchParams);

    possiblePaths.push(pathWithParams);

    return possiblePaths;
};
