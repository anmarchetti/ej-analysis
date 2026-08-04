import { getCMSLang, TCmsLang } from 'code/cmsLang';
import { DATE_FORMATS } from 'code/dates';
import settings from 'code/settings';
import { sitecoreUrls } from 'code/sitecoreUrls';
import offersService from 'frontend/services/offers.service';
import { SearchStore } from 'frontend/store/holidays';
import { IMarketSettings, MarketCode, TAllMarketsSettings } from 'models/data/MarketSettings';
import { DestinationType } from 'models/enum/DestinationType';
import { RoomAllocation } from 'models/RoomAllocation';

import { isEmpty } from './array.utils';
import { parseDateL10n } from './date.utils';
import { findMarketsByDepAirports } from './market.utils';
import AxiosRequest from './request';

export interface IGuestsAmount {
    adults: number;
    children: number;
    infants: number;
}

export const MainLangPerMarket: Record<MarketCode, TCmsLang> = {
    [MarketCode.UK]: 'en',
    [MarketCode.CH]: 'fr-CH',
    [MarketCode.FR]: 'fr-FR',
    [MarketCode.DE]: 'de-DE',
};

const DEFAULT_GUESTS: IGuestsAmount = {
    adults: 0,
    children: 0,
    infants: 0,
};

export const saveDotComDeeplinkOriginsToSearchStore = (airports: string, searchStore: SearchStore): void => {
    searchStore.searchFrom.setNormalOrigins([]);

    if (airports) {
        const departureAirports: string[] = airports.split(','); // 'LGW';
        departureAirports.forEach(airport => searchStore.searchFrom.onAddOrigin(airport));
    }
};

export const saveDotComDeeplinkDatesToSearchStore = (from: string, to: string, searchStore: SearchStore): void => {
    const dd: string = from || ''; // '2019-11-14';
    const rd: string = to || ''; // '2019-11-21';

    const departureDate = parseDateL10n(dd, DATE_FORMATS.query) as Date;
    const returningDate = parseDateL10n(rd, DATE_FORMATS.query) as Date;
    searchStore.searchWhen.onChangeDates([departureDate, returningDate]);
};

export const saveDotComDepplinkDestinationToSearchStore = async (
    _destinations: string,
    searchStore: SearchStore,
): Promise<boolean> => {
    try {
        const destinations = await offersService.getDestinationByDotComCodes(_destinations);

        const countries = Array.from(new Set(destinations.countries));
        const regions = destinations.regions;
        const resorts = destinations.resorts;

        if (isEmpty(countries) && isEmpty(regions) && isEmpty(resorts)) {
            return false;
        }

        searchStore.searchTo.setSelectedDestinationCodes([]);

        if (!isEmpty(resorts)) {
            resorts.forEach(resort => {
                searchStore.searchTo.addDestination({
                    code: resort,
                    name: '',
                    type: DestinationType.Resort,
                    parents: [
                        {
                            code: '',
                            name: '',
                            type: DestinationType.VirtualCountry,
                            relatedRegions: regions,
                            parents: [
                                {
                                    code: countries[0],
                                    name: '',
                                    type: DestinationType.Country,
                                },
                            ],
                        },
                    ],
                });
            });
        } else if (!isEmpty(regions)) {
            regions.forEach(region => {
                searchStore.searchTo.addDestination({
                    code: region,
                    name: '',
                    type: DestinationType.Region,
                    parents: [
                        {
                            code: countries[0],
                            name: '',
                            type: DestinationType.Country,
                            parents: [],
                        },
                    ],
                });
            });
        } else {
            countries.forEach(country => {
                searchStore.searchTo.addDestination({
                    code: country,
                    name: '',
                    type: DestinationType.Country,
                    parents: [],
                });
            });
        }

        return true;
    } catch (e) {
        return false;
    }
};

/**
 * Allocate guests to rooms and save it to Search Store
 */
export const saveDotComDeeplinkGuestsToSearchStore = (
    { adults, children, infants }: IGuestsAmount,
    searchStore: SearchStore,
): void => {
    const roomsAllocationSet = new Set<RoomAllocation>();
    let roomAllocation = new RoomAllocation();

    new Array(adults).fill(null).forEach(() => {
        roomAllocation.addAdult();
        roomsAllocationSet.add(roomAllocation);

        if (roomAllocation.adults.length === settings.RoomAllocation.AdultsInFirstRoom) {
            roomAllocation = new RoomAllocation();
        }
    });

    const roomsAllocationArray = Array.from(roomsAllocationSet);
    let roomIndex = 0;

    new Array(children).fill(null).forEach(() => {
        const room = roomsAllocationArray[roomIndex];

        if (room) {
            room.addChild();
        }
    });

    roomIndex = 0;
    new Array(infants).fill(null).forEach(() => {
        const room = roomsAllocationArray[roomIndex];

        if (room) {
            room.addInfant();

            if (room.isMaximumNumberOfInfantsForAdults) {
                roomIndex++;
            }
        }
    });

    searchStore.searchWho.roomsAllocation = roomsAllocationArray;
};

/**
 * Get guests from query['rooms'] param. The first element of 'rooms' encodes all guests info.
 *
 * - '2' - 2 adults
 *
 * New format (underscore-separated): 'adults_children_infants'
 * - '2_0_0' - 2 adults, 0 children, 0 infants
 * - '2_1_0' - 2 adults, 1 child, 0 infants
 * - '2_0_1' - 2 adults, 0 children, 1 infant
 *
 * Legacy format (dot-separated): 'X.0.0', where 'X' is adults amount, the number of all '0' — children amount.
 * - '1.0.0.0' - 1 adult and 3 children.
 * Note: Legacy format doesn't support infants (they were treated as children)
 */
const getGuestsFromDotComRooms = (rooms: string[]): IGuestsAmount => {
    if (!rooms.length || typeof rooms[0] !== 'string') {
        return { ...DEFAULT_GUESTS };
    }

    const roomsParam = rooms[0];

    // New format: underscore-separated (adults_children_infants)
    if (roomsParam.includes('_')) {
        const [adults, children, infants] = roomsParam.split('_');

        return {
            adults: Number(adults) || DEFAULT_GUESTS.adults,
            children: Number(children) || DEFAULT_GUESTS.children,
            infants: Number(infants) || DEFAULT_GUESTS.infants,
        };
    }

    // Legacy format: dot-separated (adults.0.0...)
    const guests = roomsParam.split('.');

    return {
        adults: Number(guests.find(g => g !== '0')) || DEFAULT_GUESTS.adults,
        children: guests.filter(g => g === '0').length || DEFAULT_GUESTS.children,

        // There is a known issue: .com sends infants the same as children, so can't get the amount.
        infants: DEFAULT_GUESTS.infants,
    };
};

export const saveDotComDeeplinkRoomsToSearchStore = (rooms: string[], searchStore: SearchStore): void => {
    const guests = getGuestsFromDotComRooms(rooms);
    saveDotComDeeplinkGuestsToSearchStore(guests, searchStore);
};

export const findClosestMarketByLang = (markets: IMarketSettings[], lang: string): Nullable<IMarketSettings> => {
    if (markets.length <= 1) {
        return markets[0] || null;
    }

    const cmsLang = getCMSLang(lang, '');

    // find the market with the same language
    let market = markets.find(m => m.Language === cmsLang);

    // if there is no market with the same language, find the market with the same language group
    // for example, de-De and de-CH have the same language group 'de'
    if (!market) {
        const langGroup = cmsLang.split('-')[0];
        market = markets.find(m => m.Language?.split('-')[0] === langGroup);
    }

    // if there is no market with the same language group and all market have the same code,
    // then find the market based on its main language
    if (!market && markets.every(m => m.Code === markets[0].Code)) {
        market = markets.find(m => m.Language === MainLangPerMarket[markets[0].Code as MarketCode]);
    }

    return market || markets[0];
};

export const getMarketFromDotComDeeplink = async (
    depAirports: string[],
    siteLang: string,
): Promise<Nullable<IMarketSettings>> => {
    if (!depAirports.length) return null;

    try {
        const allMarketsSettings = (await AxiosRequest.get(sitecoreUrls.marketSettings())).data as TAllMarketsSettings;
        const markets = findMarketsByDepAirports(depAirports, allMarketsSettings);
        const market = findClosestMarketByLang(markets, siteLang);

        return market;
    } catch (e) {}

    return null;
};
