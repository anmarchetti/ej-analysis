import { toJS } from 'mobx';
import getParsedUrl from 'parse-url';
import qs, { IParseOptions } from 'qs';

import { ONE_THOUSAND } from 'code/commonNumbers';
import { envAll, envPublic } from 'code/env';
import { FLIGHTS_PLUS_HOTEL_PROVIDER } from 'frontend/store/base/queryParams/constants';
import { IFlightPassenger } from 'models/data/AncillariesInfo';
import { IHoldLuggageInfo } from 'models/data/IHoldLuggage';
import { IRoom } from 'models/data/IHotel';
import { IAltAccommodation, IOffer, IOfferWithoutAltBoards, IUnit } from 'models/data/IOffer';
import { ISelectedSeat } from 'models/data/ISeatMapStore';
import { ISpecificOffer } from 'models/data/ISpecificOffer';
import { ITimeSlot } from 'models/data/ITimeSlot';
import { IMediaSizeParams } from 'models/data/MediaSizeParams';
import { IQueryRoom, IQueryRoomAllocation, IQueryRoomParams } from 'models/data/URLQueryRooms';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';

export interface IParsedUrl {
    hash: string;
    pathname: string;
    search: string;
}

export const getImageUrl = (url: string): string => {
    if (url) {
        return envPublic.CMS_MEDIA + '/' + url;
    }

    return '';
};

export const extendSitecoreImage = (src: string): string => {
    if (src?.startsWith('/-/media')) {
        return getImageUrl(src);
    }

    return src;
};

// parse query with all default options
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const parseQuery = (query: string, extraOptions: IParseOptions = {}): Record<string, any> =>
    qs.parse(query, {
        ignoreQueryPrefix: true,
        comma: true,
        arrayLimit: ONE_THOUSAND,
        /** fix for WP-394. 'AI+' becomes 'AI ' if we use default qs decoder */
        decoder: (s: string) => {
            try {
                return decodeURIComponent(s);
            } catch {
                return s;
            }
        },
        ...extraOptions,
    });

/**
 * Some rooms may have code "FAM.ST!NOR.CG-TODOS RO" where "NOR.CG-TODOS RO" is rate plan for this room
 * @param code Room code
 */
export const parseRoomCode = (code: string): string => {
    if (!code) return code;

    return code.split('!')[0];
};

export const buildOfferCodeQuery = (
    offer: Nullable<IOffer | IOfferWithoutAltBoards>,
    newBoardType?: string,
    newOffer?: ISpecificOffer,
): string => {
    if (offer?.accom?.unit && offer.accom.unit.length > 0) {
        const isExt = offer.accom.isExt;

        // get collection of room codes from new offer ONLY for ext accom (otherwise we don't need it)
        const newOfferUnitCodes =
            isExt && newOffer?.offers?.length
                ? newOffer.offers
                      .map(x => x.accom.unit)
                      .reduce((acc, val) => acc.concat(val), [])
                      .map(u => u.code)
                : [];

        let codes = [] as string[];
        codes.push(offer.accom.code);
        codes.push(offer.accom.packageId);
        codes = codes.concat(
            offer.accom.unit.map(el => {
                let roomCode = el.code;

                /*
            Room codes for external hotels depends on board, that's why we compare base part of it
            and need newOffer - that's the only one way to find out room name for new board
            */
                if (isExt && newOfferUnitCodes.length) {
                    const baseRoomCode = parseRoomCode(roomCode);
                    const foundNewCode = newOfferUnitCodes.find(x => parseRoomCode(x) === baseRoomCode);

                    if (foundNewCode) {
                        roomCode = foundNewCode;
                    }
                }

                return `${roomCode}-${newBoardType || el.board}`;
            }),
        );

        return codes.join('_');
    }

    return '';
};

export const buildAltAccommodationsParams = (
    altAccommodations: IAltAccommodation[] | undefined,
): { accId: string; packId: string }[] =>
    (altAccommodations || []).map(({ accomCode, packageId }) => ({
        accId: accomCode,
        packId: packageId,
    }));

/**
 * Build URL params 'lug' or 'equip' by selected luggage.
 * @returns string like LUS-1|LUG-1
 */
export const buildLuggageQuery = (luggage: IHoldLuggageInfo | undefined): string | undefined => {
    if (!luggage || !Object.keys(luggage).length) {
        return undefined;
    }

    const items: string[] = [];

    for (const [code, quantity] of Object.entries(luggage)) {
        items.push(`${code}-${quantity}`);
    }

    return items.join('|');
};

/**
 * Build URL params 'lcbOut' or 'lcbIn' by selected cabin bags from passengers
 * @returns string like 1|2|3
 */
export const buildLCBQuery = (passengers: IFlightPassenger[] | undefined): string | undefined => {
    if (!passengers?.length) {
        return undefined;
    }

    const passengersIndexes = passengers.map(({ passengerId, hasLCB }) => hasLCB && passengerId).filter(Boolean);

    return passengersIndexes.join('|');
};

export const buildChildAgesQuery = (rooms: IQueryRoom[] | undefined): string | undefined => {
    if (!rooms?.length) {
        return undefined;
    }

    return (
        rooms.reduce((result: number[], room) => [...result, ...room.childrenAges.map(age => +age)], []).join(',') ||
        undefined
    );
};

export const buildRoomsParams = (offerRooms: IQueryRoom[] | undefined, doNotEncode = false): IQueryRoomAllocation[] =>
    (offerRooms || []).map(room => {
        const { adults, children, infants, roomCode } = room;

        let processedRoomCode = roomCode;

        if (roomCode && !doNotEncode && !isEncoded(roomCode)) {
            processedRoomCode = encodeURIComponent(roomCode);
        }

        return {
            adults: adults || 0,
            children: children || 0,
            infants: infants || 0,
            roomCode: processedRoomCode || undefined,
        };
    });

/**
 * Build URL param 'geog' by destination code.
 * 'geog' is a string like 'AA,AABB,AABBCC', where AA - country code, AABB - region, AABBCC - resort
 * @param code
 */
export const buildGeogParamByDestinationCodeQuery = (code: string): string => {
    if (!code?.length) return '';

    let geog = '';
    let i = 0;

    while (i < code.length) {
        geog += (geog ? ',' : '') + code.substring(0, (i += 2));
    }

    return geog;
};

/**
 * Build URL param 'geog' by related regions code.
 * @returns string like ES,ESCD|ESSV|ESAL|ESGR
 */
export const buildGeogParamByRelatedRegionsQuery = (relatedRegions: string[]): string => {
    if (!relatedRegions.length) return '';

    return buildGeogParamByDestinationCodeQuery(relatedRegions[0]) + '|' + relatedRegions.slice(1).join('|');
};

export const getUrlOrigin = (url: string): string => {
    const pathArray = url.split('/');
    const protocol = pathArray[0];
    const host = pathArray[2];

    return protocol + '//' + host;
};

export const purifyUrl = (url: string, preserveRootSlash = false): string => {
    if (!url) {
        return '';
    }

    // preserveRootSlash needed for redirects and navigation links when sitecore sent '/' as internal link for homepage
    if (preserveRootSlash && url === '/') {
        return url;
    }

    const partsToRemove = ['/destinations(?!$)', '/root'];
    const [path, query] = url.split('?'); // split query params so we only lowercase url path

    return (
        path
            .toLowerCase()
            .replace(new RegExp(partsToRemove.join('|'), 'gi'), '')
            .replace(/\/+$/, '') + `${!!query ? '?' + query : ''}`
    );
};

export const buildAltIdsFromAltAccommodationsParams = (altAccommodations: IAltAccommodation[]): string[] => {
    const altAccommodationIds: string[] = [];
    const altPackageIds: string[] = [];

    altAccommodations.forEach(({ accomCode, packageId }) => {
        altAccommodationIds.push(accomCode);
        altPackageIds.push(packageId);
    });

    return [altAccommodationIds.join(','), altPackageIds.join(',')];
};

export const buildRoomAllocationFromOfferUnitParams = (unit: IUnit[] | IRoom[]): IQueryRoom[] => {
    const roomAllocation: IQueryRoom[] = [];

    unit.forEach((u, unitIndex) => {
        roomAllocation[unitIndex] = {} as IQueryRoom;

        if (u.occupation) {
            roomAllocation[unitIndex].adults = u.occupation.adults || 0;
            roomAllocation[unitIndex].children = u.occupation.children || 0;
            roomAllocation[unitIndex].infants = u.occupation.infants || 0;
            roomAllocation[unitIndex].childrenAges = toJS(u.occupation.childAges) || [];
        } else {
            roomAllocation[unitIndex] = {
                ...roomAllocation[unitIndex],
                adults: 0,
                children: 0,
                infants: 0,
                childrenAges: [],
            };
        }

        roomAllocation[unitIndex].roomCode = isEncoded(u.code) ? u.code : encodeURIComponent(u.code);
    });

    return roomAllocation;
};

export const buildRoomFromOfferUnitParams = (unit: Array<IUnit | IRoom>): IQueryRoom[] =>
    unit.map(
        x =>
            ({
                adults: x.occupation.adults,
                children: x.occupation.children,
                infants: x.occupation.infants,
                childrenAges: x.occupation.childAges,
                roomCode: x.code,
            } as IQueryRoom),
    );

export const getLastUrlSegment = (url: string): string => {
    const segments = url.replace(/\/$/, '').split('/');

    return segments[segments.length - 1];
};

/**
 * Delete the given parameter and all its associated values from the url
 */
export const deleteUrlParam = (url: string, paramName: string): string => {
    const [path, query] = url.split('?');

    if (query) {
        const prefix = `${encodeURIComponent(paramName)}=`;
        const queryParts = query.split(/[&;]/g);
        queryParts.forEach((part, i) => part.indexOf(prefix) === 0 && queryParts.splice(i, 1));

        return `${path}${queryParts.length > 0 ? `?${queryParts.join('&')}` : ''}`;
    }

    return url;
};

/**
 * Build url with media size params (i.e 'mw' and 'mh').
 *
 * @remarks
 * Sitecore often returns media url with params 'w' and 'h', but these params override 'mw' and 'mh'.
 * So need remove 'w' and 'h' params before adding new ones.
 */

export const buildCmsUrlWithMediaSizeQuery = (url: string, mediaSizeParams: IMediaSizeParams): string => {
    const [path] = url.split('?');

    return `${path}?mw=${mediaSizeParams.mw}&mh=${mediaSizeParams.mh}`;
};

/**
 * Build background-image value with fallback.
 * @param mainImage main image to view
 * @param fallbackImage falbck image, will be shown if main image not shown
 * @param isImgTag flag showing we will display the image through the background or through src in img
 */
export const buildFrontendImageWithFallBack = (
    mainImage?: string,
    fallbackImage?: string,
    isImgTag?: boolean,
    basePath?: string,
    isPrintable?: boolean,
): string => {
    const urls: string[] = [];

    if (isImgTag) {
        if (mainImage) {
            urls.push(`${encodeQuotation(mainImage)}`);
        }
    } else {
        if (mainImage) {
            urls.push(`url("${encodeQuotation(mainImage)}")`);

            if (basePath && isPrintable) {
                urls.push(`url("${basePath}/print-image?url=${encodeURIComponent(mainImage)}")`);
            }
        }

        if (fallbackImage) {
            urls.push(`url("${encodeQuotation(fallbackImage)}")`);
        }
    }

    return urls.join(', ');
};

/** Encode quotation '" */
export const encodeQuotation = (url: string): string => url.replace(/['"]/g, c => `%${c.charCodeAt(0).toString(16)}`);

export const isEncoded = (str: string): boolean => /\%/i.test(str);

/**
 * Return changed query params
 * @param search - new querystring
 * @param prevSearch - previous querystring
 */
export const getChangedQueryParamNames = (search: string | undefined, prevSearch: string | undefined): string[] => {
    const query = search ? parseQuery(search) : ({} as qs.ParsedQs);
    const prevQuery = prevSearch ? parseQuery(prevSearch) : ({} as qs.ParsedQs);

    const keys =
        Object.keys(query).length > Object.keys(prevQuery).length ? Object.keys(query) : Object.keys(prevQuery);

    return keys.reduce((accum, el) => {
        if (JSON.stringify(query[el]) !== JSON.stringify(prevQuery[el])) {
            accum.push(el);
        }

        return accum;
    }, [] as string[]);
};

export const hasUrlQueryParam = (url: string, queryParamName: QueryParamName): boolean => {
    const [_, search] = url.split('?');
    const query = qs.parse(search);

    return !!query[queryParamName];
};

export const hasUrlQuery = (url: string): boolean => {
    const [_, search] = url.split('?');
    const query = qs.parse(search);

    return !!Object.keys(query).length;
};

export const buildTimeSlotsQuery = (timeSlots: ITimeSlot[], paramName: string): string =>
    timeSlots.reduce(
        (query, time, i) =>
            query + `${paramName}[${i}].start=${time.start || ''}&` + `${paramName}[${i}].end=${time.end || ''}&`,
        '',
    );

export const buildSitecoreLinkFullUrl = (link: ISitecoreField<ISitecoreLink> | undefined, sitePath: string): string => {
    const url = link?.value?.href || link?.value?.url;

    if (!url) return '';

    return link?.value.linktype === SitecoreLinkType.External ? url : `${sitePath}${purifyUrl(url)}`;
};

/**
 * Checks whether string is valid URL.
 * Please note that:
 *  - it uses native API
 *  - strings like 'javascript:void(0)' are valid urls
 *  - valid urls are not limited by http schema
 * @param url Url string
 */
export const isValidURL = (url: string): boolean => {
    try {
        new URL(url);

        return true;
    } catch (_) {
        return false;
    }
};

/**
 * Get site url for when PUBLIC_URL is blank
 */

export const getSiteUrl = (url: string): string => {
    const { protocol, hostname, port } = window.location;

    return port ? `${protocol}//${hostname}:${port}${url}` : `${protocol}//${hostname}${url}`;
};

export const parseUrl = (url: string, basePath: string = ''): IParsedUrl => {
    const parsedUrl = envAll.PUBLIC_URL ? (url.startsWith('http') ? url : envAll.PUBLIC_URL + url) : getSiteUrl(url);
    (getParsedUrl as any).MAX_INPUT_LENGTH = 204800; // EJH-16980: Adding large input length to prevent failed search
    const parsed = getParsedUrl(parsedUrl);

    return {
        pathname: parsed.pathname.startsWith(basePath) ? parsed.pathname.replace(basePath, '') : parsed.pathname,
        search: parsed.search,
        hash: parsed.hash,
    };
};

export const getSelectedSeatsQueryParams = (
    selectedSeats: ISelectedSeat[] | undefined = [],
): { [key: string]: string } | string => {
    if (!selectedSeats?.length || selectedSeats.every(el => !el.seats?.length)) {
        return '';
    }

    const queryObject = {};

    selectedSeats.forEach(selection => {
        const selected: string[] = [];

        (selection.seats || []).forEach(seat => {
            selected.push(`${seat.paxIndex}-${seat.seatNumber}`);
        });
        queryObject[QueryParamName.SeatsSectorIdPrefix + selection.sectorId] = selected.join('|');
    });

    return queryObject;
};

/**
 * Builds query for API request
 * @param selectedSeats
 * @returns string like seats[0]=&seats[1]=1D|2D - if outbound seats not selected
 */
export const buildSelectedSeatsQuery = (selectedSeats: ISelectedSeat[] | undefined): string[] =>
    (selectedSeats || []).map(item => (item.seats || []).map(seat => seat.seatNumber).join('|'));

// rooms should look like this: {adultNum}_{childNum}:{childAge1}|{childAgeN}_{infantNum},
export const buildRoomsQueryParams = (roomsArr: IQueryRoomParams[] | IQueryRoom[]): string[] =>
    roomsArr
        .map((room: IQueryRoomParams | IQueryRoom) => {
            const guests = [room.adults];

            if (+room.children) {
                guests.push(`${room.children}${!!room.childrenAges?.length ? `:${room.childrenAges.join('|')}` : ''}`);
            }

            if (+room.infants) {
                if (!+room.children) {
                    guests.push('0');
                }

                guests.push(room.infants);
            }

            let guestsStr = guests.join('_');

            if (room.roomCode) {
                guestsStr += `/${room.roomCode}`;
            }

            return guestsStr;
        })
        .filter(Boolean);

export const checkIfQueryRooms = (rooms: IQueryRoomParams[] | IQueryRoom[] | string | string[]): boolean => {
    if (!rooms) {
        return false;
    }

    if (!Array.isArray(rooms)) {
        return false;
    }

    if (typeof rooms[0] === 'object') {
        return rooms[0].adults !== undefined;
    }

    return false;
};

export const booleanToStringNumber = (val: boolean): '0' | '1' => (val ? '1' : '0');

const removeTrailingSlash = (val: string): string => (val.endsWith('/') ? val.substring(0, val.length - 1) : val);

const removeBasePath = (path: string, basePath: string): string => {
    if (path.startsWith(basePath)) {
        return path.slice(basePath.length);
    }

    return path;
};

export const matchesPathname = ({
    asPath: initialAsPath,
    pathname: initialPathname,
    basePath,
}: {
    asPath: string;
    basePath: string;
    pathname: string;
}): boolean => {
    if (initialAsPath === initialPathname) {
        return true;
    }

    const asPath = removeTrailingSlash(initialAsPath.split('?')[0]);
    const asPathWithoutBasePath = removeBasePath(asPath, basePath);

    const pathname = removeTrailingSlash(initialPathname.split('?')[0]);

    if (asPathWithoutBasePath === pathname) {
        return true;
    }

    return false;
};

export const getAccommodationIdsString = ({
    accommodationIdFromUrl,
    altAccommodationsFromUrl,
    selectedAccommodationCodesFromUrl,
}: {
    accommodationIdFromUrl: string;
    altAccommodationsFromUrl: { accomCode: string }[];
    selectedAccommodationCodesFromUrl: string;
}): string => {
    const accommodationIdsRaw = new Set([
        accommodationIdFromUrl,
        ...altAccommodationsFromUrl.map(({ accomCode }) => accomCode),
        ...(selectedAccommodationCodesFromUrl ? selectedAccommodationCodesFromUrl.split(',') : []),
    ]);

    return Array.from(accommodationIdsRaw)
        .filter(v => !!v)
        .join(',');
};

export const hyphenateString = (input: string): string => {
    if (!input) return '';

    return input.trim().replace(/\s+/g, '-').toLowerCase();
};

export const filterInvalidRelativePath = (path: string | undefined): string => {
    if (path && path.startsWith('/') && !path.includes(' ')) {
        return path;
    }

    return '';
};

export const buildFlightPlusHotelUrl = (path: string): string => {
    const [basePath, existingQuery] = path.split('?');
    const params = new URLSearchParams(existingQuery);
    params.set(QueryParamName.ExperienceContextProvider, FLIGHTS_PLUS_HOTEL_PROVIDER);

    return `${basePath}?${params.toString()}`;
};
