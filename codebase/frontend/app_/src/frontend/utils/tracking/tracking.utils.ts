import { BasicTypes } from '@sitecore/engage/types/lib/utils/interfaces';

import { ENGLISH, getCMSLang } from 'code/cmsLang';
import { ANALYTIC_SEPARATOR } from 'code/tracking.config';
import {
    formatDateL10n,
    getDaysDifference,
    getDaysDifferenceRoundedFloor,
    getTotalHoursDifference,
} from 'frontend/utils/date.utils';
import {
    getDestinationHierarchy,
    getDestinationTypeByCodeLength,
    getDestinationTypeByType,
} from 'frontend/utils/destinations.utils';
import { getRoomName } from 'frontend/utils/offer.utils';
import { getTransaction, isTransactionDone, isTransactionTracked } from 'frontend/utils/paymentTransaction';
import { getWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { IFilterOption } from 'models/data/IFilters';
import { ILuggageInfoItem } from 'models/data/IFlightExtras';
import { IHotel, IRoom, IThemeType } from 'models/data/IHotel';
import { IOffer, IUnit } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { ISelectedSeatDetails } from 'models/data/ISeatMapStore';
import { IPriceBreakdownItem } from 'models/data/IValidPackageInfo';
import { IMyCreditInfo } from 'models/data/MyCreditInfo';
import { IHolidaySearchSelection } from 'models/data/tracking/IEcommerceObject';
import { ICustomParams } from 'models/data/tracking/IEventWithParams';
import { DestinationType } from 'models/enum/DestinationType';
import { PriceBreakdownCode } from 'models/enum/PriceBreakdownCode';
import { GEOGRAPHY_ALL_CODE } from 'models/enum/RequestConstants';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import { AmendProductPBPostfix } from 'models/enum/tracking/AmendProductPBPostfix';
import { GuestTypes } from 'models/enum/tracking/GuestTypes';
import TradePortalSitecoreTemplateId from 'models/enum/tradePortal/TradePortalSitecoreTemplateId';
import { TransferType } from 'models/enum/transfer/TransferType';
import { GuestInfo, IGuestAllocation } from 'models/GuestInfo';
import { RoomAllocation } from 'models/RoomAllocation';
import { IAirport } from 'models/sitecore/IAirportsData';

enum SeatCategory {
    Dynamic = 'Dynamic',
    Series = 'Series',
}

enum ScreenOrientation {
    Landscape = 'Landscape',
    Portrait = 'Portrait',
}

export enum NavItemType {
    Link = 'link',
    NavItem = 'navItem',
}

enum TrackingTrasferName {
    Bus = 'Bus',
    Taxi = 'Taxi',
    Private = 'Private',
}

enum ScreenSize {
    ExtraLarge = 'Extra large',
    Large = 'Large',
    Medium = 'Medium',
    Small = 'Small',
    ExtraSmall = 'Extra small',
}

interface IScreenFlags {
    isScreenExtraLarge: boolean;
    isScreenLarge: boolean;
    isScreenMedium: boolean;
    isScreenSmall: boolean;
}

type TSeatsByActionType = {
    [key in AmendProductPBPostfix]?: ISelectedSeatDetails[];
};

export enum SearchSelectionCategory {
    Departure = 'Departure',
    Destination = 'Destination',
}

export enum SearchSelectionVariant {
    DepartureAirport = 'Departure Airport',
    Anywhere = 'Anywhere',
}

export const NO_FLEXIBILITY = 'No Flexibility';
export const I_DONT_MIND = "I don't mind";

export const createUniquePipedList = (array: Array<any>): string => Array.from(new Set(array)).join('|');

export const getBrand = (type: IThemeType | undefined, prom: string): string => {
    let brand = type?.itemName || type?.name;

    if (!brand && prom) {
        const offerCode = prom.substr(3, 1); // brand defined by 4th letter of code
        brand = offerCode === 'O' ? 'Other' : '';
    }

    return brand || '';
};

export const getChildrenAge = (roomAllocations: (RoomAllocation | IGuestAllocation)[]): string => {
    const childrenAge: Array<any> = roomAllocations.map(room => room.children.map(child => child.age));

    return [].concat(...childrenAge).join('|');
};

export const getGuests = (rooms: IUnit[], type: GuestTypes): number =>
    rooms.reduce((total, value) => total + value.occupation[type], 0);

export const getHotelFacilities = (hotel: Nullable<IHotel>): string => {
    if (hotel) {
        const hotelFacilities: Array<any> =
            hotel.facilities?.map(facility => facility.items.map(item => item.name)) ?? [];

        return [].concat(...hotelFacilities).join('|');
    }

    return '';
};

export const getBoardsTypes = (rooms: Array<IUnit | IRoom>): string => {
    const types = rooms.map(room => room.boardType?.itemName || room.boardType?.title || null).filter(Boolean);

    return createUniquePipedList(types);
};

export const normalizeBoardBasis = (code: string): string => {
    const map: Record<string, string> = {
        ai: 'allInclusive',
        hb: 'halfBoard',
        fb: 'fullBoard',
        bb: 'bedAndBreakfast',
        sc: 'selfCatering',
        ro: 'roomOnly',
        ao: 'roomOnly',
    };
    const lower = code.toLowerCase();

    return map[lower] ?? lower;
};

export const resolveBoardBasis = (code: string, boardFilterOptions: IFilterOption[] = []): string => {
    const lower = code.toLowerCase();

    for (const option of boardFilterOptions) {
        if (option.code.toLowerCase() === lower) {
            return normalizeBoardBasis(option.code);
        }

        if (option.children?.some(child => child.code.toLowerCase() === lower)) {
            return normalizeBoardBasis(option.code);
        }
    }

    return normalizeBoardBasis(code);
};

export const getRoomsTypesTitles = (rooms: Array<IUnit | IRoom>): string => {
    const types = rooms
        .map(room => (room.roomType ? room.roomType.itemName || getRoomName(room.roomType) : null))
        .filter(Boolean);

    return createUniquePipedList(types);
};

export const getDestinationData = (
    dataKey: string,
    destinations: IDestination[],
    ...types: DestinationType[]
): string => {
    const result = destinations.filter(({ type }) => {
        if (!type) return false;

        return types.includes(type);
    });

    return result.map(item => item[dataKey]).join(ANALYTIC_SEPARATOR);
};

export const getDestinationNames = getDestinationData.bind(null, 'itemName');
export const getDestinationCodes = getDestinationData.bind(null, 'code');

export const getDestinationLevels = (destinations: IDestination[]): string => {
    const types = destinations.map(destination => getDestinationTypeByType(destination));

    return createUniquePipedList(types);
};

export const getDestinationLevelsByCodes = (destinationsCodes: string[]): string => {
    const types = destinationsCodes.map(code => getDestinationTypeByCodeLength(code));

    return createUniquePipedList(types);
};

export const getDepartureDateFlexibility = (flexDays: number, isFlexible: boolean): string =>
    isFlexible ? `+/- ${flexDays} days` : NO_FLEXIBILITY;

export const findOriginNameByCode = (code: string, originsWithNames: IDestinationCountry[]): string | null => {
    for (const origin of originsWithNames) {
        if (origin.code === code) {
            return origin.itemName || origin.name;
        }

        const child = origin.children?.find(ch => ch.code === code);

        if (child) {
            return child.itemName || child.name;
        }
    }

    return null;
};

export const getDepartureAirportsNames = (originsCodes: string[], originsWithNames: IDestinationCountry[]): string => {
    const airportsNames: string[] = [];
    originsCodes.forEach(code => {
        const name = findOriginNameByCode(code, originsWithNames);
        name && airportsNames.push(name);
    });

    return createUniquePipedList(airportsNames);
};

export const getDepartureAirportsCodes = (
    originsCodes: string[],
    originsWithNames: IDestinationCountry[],
): { [key: string]: BasicTypes }[] => {
    const airports: { [key: string]: BasicTypes }[] = [];

    originsCodes.forEach(code => {
        const name = findOriginNameByCode(code, originsWithNames);
        name && airports.push({ name, code });
    });

    return airports;
};

export const getOffersBrands = (offers: IOffer[]): string => {
    const brandsArray: string[] = offers.map(offer => getBrand(offer.accom.type, offer.accom.prom));

    return createUniquePipedList(brandsArray);
};

const getOffersOutboundFlightData = (dataKey: string, offers: IAlternativeOffer[]): string => {
    const airports = offers.map(offer => offer.transport.routes[0][dataKey]);

    return createUniquePipedList(airports);
};
export const getOffersDestinationAirportsNames = getOffersOutboundFlightData.bind(null, 'arrItemName');
export const getOffersDestinationAirportsCodes = getOffersOutboundFlightData.bind(null, 'arrPt');

export const getOffersStarRatings = (offers: IOffer[]): string => {
    const ratings = offers.map(offer => offer.hotel?.starRating || null).filter(rating => !!rating);

    return createUniquePipedList(ratings);
};

export const getPassengerConfig = (adults: number, children: number, infants: number): string =>
    `A: ${adults}, C: ${children}, I: ${infants}`;

export const getNumberOfRooms = (isAutoAllocation: boolean, roomsAllocationLength: number): string =>
    isAutoAllocation ? I_DONT_MIND : `${roomsAllocationLength}`;

export const getFirstPositionOnPage = (page: number, itemsPerPage: number): number => (page - 1) * itemsPerPage;

export const getPercentageOfTotal = (part: number, total: number): number =>
    // round to 2 decimal digits
    part ? Math.round((part / total) * 10000) / 100 : 0;

export const getPosition = (index: number, page: number, itemsPerPage: number): number =>
    getFirstPositionOnPage(page, itemsPerPage) + (index + 1);

export const getPromoCodeAmount = (priceBreakdown: Nullable<IPriceBreakdownItem[]>): number => {
    const discount = priceBreakdown?.find(p => p.code === PriceBreakdownCode.Promotions)?.amount || 0;

    return Math.abs(discount);
};

export const getRoutesDepartureDaysDifference = (route1: IRoute | undefined, route2: IRoute | undefined): number => {
    if (!route1?.depDate || !route2?.depDate) {
        return 0;
    }

    return getDaysDifferenceRoundedFloor(new Date(route1.depDate), new Date(route2.depDate)) || 0;
};
export const getSeatCategory = (isExt: boolean): SeatCategory => (isExt ? SeatCategory.Dynamic : SeatCategory.Series);

export const getSeason = (date: Date | string | null): string => {
    if (date) {
        const APRIL_INDEX = 3;
        const OCTOBER_INDEX = 9;
        const NOVEMBER_INDEX = 10;
        const DECEMBER_INDEX = 11;
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const month = dateObj.getMonth();
        const year = dateObj.getFullYear();
        /** Summer (S) is 1st Apr to 31st Oct, Winter (W) is 1st Nov to 31st Mar. */
        const season = month >= APRIL_INDEX && month <= OCTOBER_INDEX ? 'S' : 'W';
        /** 2-digit season year should be the same for all months in season. So need change calendar year if it's November or December
         * (e.g. Nov20, Dec20, Jan21, Feb21, Mar21 should be showing as W21) */
        const seasonYear = (month === NOVEMBER_INDEX || month === DECEMBER_INDEX ? year + 1 : year)
            .toString()
            .slice(-2);

        return `${season}${seasonYear}`;
    }

    return '';
};

export const getScreenSize = ({
    isScreenSmall,
    isScreenMedium,
    isScreenLarge,
    isScreenExtraLarge,
}: IScreenFlags): ScreenSize => {
    if (isScreenExtraLarge) {
        return ScreenSize.ExtraLarge;
    }

    if (isScreenLarge) {
        return ScreenSize.Large;
    }

    if (isScreenMedium) {
        return ScreenSize.Medium;
    }

    if (isScreenSmall) {
        return ScreenSize.Small;
    }

    return ScreenSize.ExtraSmall;
};

export const getScreenOrientation = (): ScreenOrientation =>
    window.innerWidth > window.innerHeight ? ScreenOrientation.Landscape : ScreenOrientation.Portrait;

export const getTimestamp = (): string => formatDateL10n(new Date(), 'YYYY-MM-DD_HH:mm:ss');

/**
 * Purchase should be tracked if transaction has not been already tracked
 * or if transaction is null (writing transaction in localStorage was unsuccessful)
 */
export const shouldTrackPurchase = (): boolean => {
    const transaction = getTransaction();

    return (transaction && !isTransactionTracked(transaction) && isTransactionDone(transaction)) || !transaction;
};

/**
 *  Calculates the index of the first visible item on slide
 */
export const getSliderListOffset = (slideIndex: number, slidesToSlide: number): number => slideIndex * slidesToSlide;

/**
 *  Calculates the index of the item within the scope of the current slide
 */
export const getSliderListPosition = (itemIndex: number, slideIndex: number, slidesToSlide: number): number =>
    itemIndex - getSliderListOffset(slideIndex, slidesToSlide);

export const getCreditStatus = (credit: IMyCreditInfo[] | null | undefined): string => {
    if (!credit?.length) {
        return 'Not Available';
    }

    const creditCurrencies = credit.reduce(
        (accumulator, currentValue) =>
            currentValue.balance > 0 ? [...accumulator, currentValue.currency] : accumulator,
        [],
    );

    return creditCurrencies.length ? creditCurrencies.join('|') : 'No';
};

export const getNavItemPosition = (target: Element, ...other: Array<number | undefined>): string =>
    [
        target.closest('[data-position]')?.getAttribute('data-position') ?? 0,
        ...other.filter(value => value !== undefined),
    ].join('|');

export const getNavItemDestination = (targetHref: Nullable<string>): string => targetHref || 'Not Linkable';

export const getNavItemType = (isLink: boolean): NavItemType => (isLink ? NavItemType.Link : NavItemType.NavItem);

export const getTrackingTransferName = (transferType?: TransferType): TrackingTrasferName => {
    switch (transferType) {
        case TransferType.Shared:
            return TrackingTrasferName.Bus;
        case TransferType.Private:
            return TrackingTrasferName.Taxi;
        case TransferType.NoTransfer:
        default:
            return TrackingTrasferName.Private;
    }
};

export const groupSeatsByActionType = (
    newSeats: ISelectedSeatDetails[],
    prevSeats: ISelectedSeatDetails[],
): TSeatsByActionType => {
    const seatsByActionType = {};
    const addSeatToCategory = (categoryName, seat) => {
        seatsByActionType[categoryName] = seatsByActionType[categoryName] || [];
        seatsByActionType[categoryName].push(seat);
    };

    if (newSeats.length && !prevSeats.length) {
        seatsByActionType[AmendProductPBPostfix.ADD] = newSeats;
    } else {
        newSeats.forEach((nSeat, i) => {
            const pSeat = prevSeats[i];
            const categoryName = getSeatsPostBookingPostfix(nSeat, pSeat);

            // calculating priceDiff for tracking seats updates between seatMapTabs
            if (categoryName === AmendProductPBPostfix.UPGRADE && nSeat?.price && pSeat?.price) {
                nSeat.priceDiff = nSeat.price - pSeat.price;
            } else {
                nSeat.priceDiff = 0;
            }

            categoryName && addSeatToCategory(categoryName, nSeat);
        });
    }

    return seatsByActionType;
};

/**
 * Filling unused genericValues in custom params with null for generic tracking event
 * @param customParams filled custom params
 * @returns ICustomParams with null-filled unused genericValue parameters
 */
export const generateGenericValues = (customParams: ICustomParams): ICustomParams => ({
    genericValue1: null,
    genericValue2: null,
    genericValue3: null,
    genericValue4: null,
    ...customParams,
});

const getSeatsPostBookingPostfix = (
    nSeat: ISelectedSeatDetails,
    pSeat: ISelectedSeatDetails,
): Nullable<AmendProductPBPostfix> => {
    if (nSeat.price && pSeat.price && nSeat.price > pSeat.price) {
        return AmendProductPBPostfix.UPGRADE;
    }

    if (nSeat.price && pSeat.price && nSeat.price <= pSeat.price && pSeat.priceBand !== nSeat.priceBand) {
        return AmendProductPBPostfix.DOWNGRADE;
    }

    if (nSeat.seatNumber !== pSeat.seatNumber && pSeat.priceBand === nSeat.priceBand) {
        return AmendProductPBPostfix.CHANGE;
    }

    return undefined;
};

export const getTotalPrice = (items: (ILuggageInfoItem | ISelectedSeatDetails)[]): number =>
    items.reduce((total, item) => total + (item?.price || 0), 0) || 0;

export const getAncillariesPrice = (booking: IBookingInfo): number => {
    const { extraLuggageInfo, seatSelection, airportParking } = booking;

    let price = getTotalPrice(extraLuggageInfo?.items || []);

    if (seatSelection) {
        price = seatSelection.reduce((total, route) => total + getTotalPrice(route.seats || []), price);
    }

    if (airportParking) {
        price += airportParking.bookingDetails.totalPrice;
    }

    return price;
};

export const getSearchOriginPageTitle = (
    prevTemplateId: SitecoreTemplateId | TradePortalSitecoreTemplateId | undefined,
    prevLayoutName: string,
): Nullable<string> => {
    switch (prevTemplateId) {
        case SitecoreTemplateId.HomePage:
        case SitecoreTemplateId.HotelDetailsBrowse:
        case SitecoreTemplateId.AllDestinationsPage:
        case SitecoreTemplateId.ResortBrowsePage:
        case SitecoreTemplateId.DealsPage:
            return prevLayoutName;

        case SitecoreTemplateId.PromoPage:
        case SitecoreTemplateId.DynamicPromoPage:
        case SitecoreTemplateId.RecurringPromoPage:
        case SitecoreTemplateId.PeriodDrivenPromoPage:
            return 'Promo: Not Found';

        case SitecoreTemplateId.DestinationPage:
        case SitecoreTemplateId.CountryBrowsePage:
        case SitecoreTemplateId.RegionBrowsePage:
        case SitecoreTemplateId.VirtualRegionBrowsePage:
            return `Destination Guide: ${prevLayoutName}`;

        default:
            return null;
    }
};

/* eslint-disable no-magic-numbers */
export const getDaysToDepartureBucket = (booking: IBookingInfo): string => {
    const departureDate = booking.package.transport?.routes[0].depDate;
    const depDate = new Date(departureDate || '');
    const now = new Date();

    const hours = getTotalHoursDifference(depDate, now);

    if (hours < 0) {
        return 'On Holiday';
    }

    if (hours < 24) {
        return '-24Hr';
    }

    const days = getDaysDifference(depDate, now);

    if (days < 5) {
        return '-5';
    }

    if (days < 28) {
        return '-28';
    }

    return '28+';
};
/* eslint-enable no-magic-numbers */

export const getPageLang = (lang: string | undefined): string => getCMSLang(lang ?? ENGLISH).toUpperCase();
export const getVersion = (): string => 'v1.0.0';
export const getBusinessType = (): string => 'Package';
export const getBusinessChannel = (): string => 'Website';

export const getCategoryLabel = (baseLabel: string, price: number): string => {
    let label: AmendProductPBPostfix = AmendProductPBPostfix.CHANGE;

    if (price > 0) {
        label = AmendProductPBPostfix.UPGRADE;
    }

    if (price < 0) {
        label = AmendProductPBPostfix.DOWNGRADE;
    }

    return `${baseLabel}: ${label}`;
};

export const getBookingEmail = (email?: string): string | undefined => {
    let resultEmail = email;

    if (!resultEmail) {
        const data = getWebStorageItem<GuestInfo[]>('guestDetails', true, sessionStorage);
        const guest = data?.find(({ isLead }): boolean => isLead);
        resultEmail = guest?.email;
    }

    return resultEmail ? resultEmail.toLowerCase() : undefined;
};

export const createFromSearchSelectionItem = (
    airport: IAirport,
    country: Nullable<string>,
): IHolidaySearchSelection => {
    const { code, itemName, countryName } = airport;

    const searchSelectionItem: IHolidaySearchSelection = {
        item_id: code,
        item_name: itemName || '',
        item_category: SearchSelectionCategory.Departure,
        //airport?.countryName is available for EUX markets
        item_category2: countryName || country || null,
        item_category3: null,
        item_category4: null,
        item_category5: null,
        item_variant: SearchSelectionVariant.DepartureAirport,
        item_generic_1: null,
        price: 0,
        quantity: 1,
    };

    return searchSelectionItem;
};

export const createToSearchSelectionItem = (destination: IDestination): IHolidaySearchSelection => {
    const { code, itemName, type, trackingHotelTheme } = destination;
    const hierarchy = getDestinationHierarchy(destination);
    const isAnywhere = code === GEOGRAPHY_ALL_CODE;

    const searchSelectionItem: IHolidaySearchSelection = {
        item_id: isAnywhere ? SearchSelectionVariant.Anywhere : code,
        item_name: isAnywhere ? SearchSelectionVariant.Anywhere : itemName || '',
        item_category: SearchSelectionCategory.Destination,
        item_category2: isAnywhere ? SearchSelectionVariant.Anywhere : hierarchy[DestinationType.Country] || null,
        item_category3: hierarchy[DestinationType.Region] || hierarchy[DestinationType.VirtualCountry] || null,
        item_category4: hierarchy[DestinationType.Resort] || null,
        item_category5: hierarchy[DestinationType.Hotel] || null,
        item_variant: isAnywhere ? SearchSelectionVariant.Anywhere : type || null,
        item_generic_1: trackingHotelTheme || null,
        price: 0,
        quantity: 1,
    };

    return searchSelectionItem;
};
