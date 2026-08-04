import { CurrencyCode } from 'code/currency';
import { DATE_FORMATS } from 'code/dates';
import { DEFAULT_PAGE_SIZE } from 'frontend/services/booking.service';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { formatDateL10n, getDaysDifference } from 'frontend/utils/date.utils';
import { checkDestinationTypeExists } from 'frontend/utils/destinations.utils';
import { convertToYesNoString } from 'frontend/utils/string.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IRoom } from 'models/data/IHotel';
import { IGuestPassenger } from 'models/data/ILeadPassenger';
import { IRoute } from 'models/data/IRoute';
import { IDetailHolidayProduct } from 'models/data/tracking/IProduct';
import { ISearchDependenciesData } from 'models/data/tracking/ISearch';
import { DestinationType } from 'models/enum/DestinationType';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ProductDimensions } from 'models/enum/tracking/ProductCategories';
import { GuestInfo, IGuestAllocation } from 'models/GuestInfo';
import { getAdultsQuantity, getChildrenQuantity, getInfantsQuantity } from 'models/RoomAllocation.utils';

import {
    getChildrenAge,
    getDepartureAirportsNames,
    getDepartureDateFlexibility,
    getDestinationCodes,
    getDestinationLevels,
    getDestinationNames,
    getFirstPositionOnPage,
    getOffersDestinationAirportsCodes,
    getOffersDestinationAirportsNames,
    getPassengerConfig,
    getSeason,
    getTimestamp,
} from './tracking.utils';

export const getSearchDetailObject = (
    offers: IAlternativeOffer[],
    eventType: EventTypes,
    {
        origins,
        originsWithNames,
        selectedDestinations,
        flexDays,
        isFlexible,
        to,
        from,
        roomsAllocation,
        roomsAllocationLength,
        page,
        take,
        filteredDestinations,
        currencyCode,
    }: ISearchDependenciesData,
): IDetailHolidayProduct => {
    const { Region, VirtualRegion } = DestinationType;
    const adults = getAdultsQuantity(roomsAllocation);
    const children = getChildrenQuantity(roomsAllocation);
    const infants = getInfantsQuantity(roomsAllocation);
    const isVirtualRegions = checkDestinationTypeExists(selectedDestinations, VirtualRegion);

    const isVirtualAndDestinationExists = isVirtualRegions && !!filteredDestinations;

    const dimension22 = isVirtualAndDestinationExists
        ? getDestinationLevels(filteredDestinations)
        : getDestinationLevels(selectedDestinations);

    const dimension25 = isVirtualAndDestinationExists
        ? getDestinationNames(filteredDestinations, Region, VirtualRegion)
        : getDestinationNames(selectedDestinations, Region);

    const dimension26 = isVirtualAndDestinationExists
        ? getDestinationCodes(filteredDestinations, Region, VirtualRegion)
        : getDestinationCodes(selectedDestinations, Region);

    return {
        dimension108: eventType,
        currencyCode,
        dimension13: getTimestamp(),
        dimension18: getDepartureAirportsNames(origins, originsWithNames),
        dimension19: origins.join('|'),
        dimension20: getOffersDestinationAirportsNames(offers),
        dimension21: getOffersDestinationAirportsCodes(offers),
        dimension22,
        dimension23: getDestinationNames(selectedDestinations, DestinationType.Country),
        dimension24: getDestinationCodes(selectedDestinations, DestinationType.Country),
        dimension25,
        dimension26,
        dimension27: getDestinationNames(selectedDestinations, DestinationType.Resort),
        dimension28: getDestinationCodes(selectedDestinations, DestinationType.Resort),
        dimension29: convertToYesNoString(origins.length > 1),
        dimension30: origins.length,
        dimension31: convertToYesNoString(selectedDestinations.length > 1),
        dimension32: selectedDestinations.length,
        dimension33: ProductDimensions.DateLevel,
        dimension34: getDepartureDateFlexibility(flexDays, isFlexible),
        dimension35: formatDateL10n(from, DATE_FORMATS.query),
        dimension36: formatDateL10n(from, DATE_FORMATS.yearMonthFormat),
        dimension37: getSeason(from),
        dimension40: from ? getDaysDifference(from, new Date()) : '',
        dimension41: ProductDimensions.DateLevel,
        dimension42: formatDateL10n(to, DATE_FORMATS.query),
        dimension43: formatDateL10n(to, DATE_FORMATS.yearMonthFormat),
        dimension44: getSeason(to),
        dimension47: to && from ? getDaysDifference(to, from) : '',
        dimension49: adults + children,
        dimension50: getPassengerConfig(adults, children, infants),
        dimension51: adults,
        dimension52: children,
        dimension53: infants,
        dimension54: roomsAllocationLength,
        dimension62: getFirstPositionOnPage(page, take),
        dimension79: getChildrenAge(roomsAllocation),
    };
};

export const getSearchDetailsForBooking = (
    routes: IRoute[],
    guests: IGuestPassenger[],
    room: IRoom,
    pageNumber: number,
    currencyCode: CurrencyCode,
): ISearchDependenciesData => {
    const roomsAllocation: IGuestAllocation = GuestInfo.getGuestsAllocation(guests, room);

    const { outbound: outboundTransport } = getRouteByDirection(routes);
    const { depDate, depPt } = outboundTransport || {};
    const outboundDate = depDate ? new Date(depDate) : null;

    return {
        origins: depPt ? [depPt] : [],
        originsWithNames: [],
        selectedDestinations: [],
        flexDays: 0,
        isFlexible: false,
        to: outboundDate,
        from: outboundDate,
        roomsAllocation: [roomsAllocation],
        roomsAllocationLength: 1, // One room
        page: pageNumber,
        take: DEFAULT_PAGE_SIZE,
        filteredDestinations: null,
        currencyCode,
    };
};
