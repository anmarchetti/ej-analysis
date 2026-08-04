import qs from 'qs';

export const HomepageUtm = {
    utm_source: 'easyjet',
    utm_medium: 'en_homepage',
    utm_term: 'Holidays',
    utm_content: 'searchpodform',
    utm_campaign: 'holidays_home',
};

export const HotelDetailsUtm = {
    utm_source: 'easyjet',
    utm_medium: 'en_pickflights',
    utm_campaign: 'recommended',
};

export const MixedResultsUtm = {
    utm_term: 'Holidays',
    utm_content: 'popunder',
    utm_campaign: 'holidays',
};

export const UtmOptions = {
    utm_term: 'utm_term',
    utm_content: 'utm_content',
    utm_campaign: 'utm_campaign',
};

export const getUtmParams = (query: qs.ParsedQs): qs.ParsedQs =>
    Object.assign(
        {},
        ...Object.keys(query)
            .filter(name => name.startsWith('utm'))
            .map(key => ({ [key]: query[key] })),
    );

/**
 * Checks if query object doesn't have at least one utm param
 * @param query Query object
 * @param params Utm params object
 */
export const isLacksUtmParam = (query: qs.ParsedQs, params: qs.ParsedQs): boolean =>
    !Object.keys(params).some(param => !!query[param]);

export const removeUTMParamsFromUrl = (url: string): string => {
    const [path, queries] = url.split('?');

    if (!queries) {
        return `${url}?`;
    }

    const rawQueries = queries.replace('?', '');
    const utmRegex = new RegExp('^utm');

    const queryParametersArray = rawQueries.split('&');

    const filteredQueries = queryParametersArray.filter(query => !utmRegex.test(query));

    return `${path}?${filteredQueries.join('&')}&`;
};
