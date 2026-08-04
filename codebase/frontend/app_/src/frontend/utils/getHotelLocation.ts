import { Tokens } from 'code/tokens';
import { MarketStore } from 'frontend/store/base';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IClosestFacility, IHotel, IHotelDestination, ITheme } from 'models/data/IHotel';
import { HolidayDistance, HolidayThemes } from 'models/enum/HolidayThemes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { ILocation } from 'frontend/components/common/MapComponent/OldMap/MapDirectionsProptypes';
import { IHotelLocationLink } from 'frontend/components/renderings/HotelDetails/components/HotelLocation';

import { formatNumber, THOUSAND_DIVISOR, TWO_PLACES } from './formatNumber';
import { joinNonEmptyWordsWithComma } from './string.utils';
import { Tokenizer } from './tokenizer';

function buildHotelDestinationUrl(...destinations: IHotelDestination[]) {
    const destNames = destinations.map(dest => dest?.name?.trim());

    // If any of the destinations is empty, return empty string
    if (destNames.some(name => !name)) {
        return '';
    }

    return `/${destNames.join('/')}`.replace(/[-&']/g, '').replace(/\s+/g, '-').toLowerCase();
}

function buildHotelCountryUrl(hotel: Nullable<IHotel>): string {
    return hotel ? hotel.country?.url || buildHotelDestinationUrl(hotel.country) : '';
}

function buildHotelRegionUrl(hotel: Nullable<IHotel>): string {
    return hotel ? hotel.location?.url || buildHotelDestinationUrl(hotel.country, hotel.location) : '';
}

function buildHotelResortUrl(hotel: Nullable<IHotel>): string {
    return hotel ? hotel.resort?.url || buildHotelDestinationUrl(hotel.country, hotel.location, hotel.resort) : '';
}

export function buildHotelDetailsUrl(hotel: Nullable<IHotel>) {
    return hotel
        ? hotel.url || buildHotelDestinationUrl(hotel.country, hotel.location, hotel.resort, hotel as IHotelDestination)
        : '';
}

/**
 * Returns formatted hotel location
 * @param hotel hotel information
 * @param includeCountry whether to include country in the location string, default is true
 */
export const getHotelLocation = (hotel: IHotel, includeCountry = true): string => {
    const locationParts = [] as string[];

    const addLocation = (dest: Nullable<IHotelDestination>): void => {
        if (dest?.name) {
            locationParts.push(dest.name);
        }
    };

    addLocation(hotel.resort);
    addLocation(hotel.location);

    if (includeCountry) {
        addLocation(hotel.country);
    }

    return locationParts.join(', ');
};

/**
 * Returns hotel location as array of links
 * @param hotel hotel information
 */
export function getHotelLocationHrefs(hotel: Nullable<IHotel>): IHotelLocationLink[] {
    if (!hotel) {
        return [];
    }

    const locationParts: IHotelLocationLink[] = [];

    const addLocation = (dest: Nullable<IHotelDestination>, url: string) => {
        if (dest) {
            locationParts.push({
                key: dest.code,
                value: {
                    code: dest.code,
                    href: url,
                    text: dest.name,
                    linktype: SitecoreLinkType.Internal,
                    target: '_blank',
                },
            });
        }
    };

    addLocation(hotel.resort, buildHotelResortUrl(hotel));
    addLocation(hotel.location, buildHotelRegionUrl(hotel));
    addLocation(hotel.country, buildHotelCountryUrl(hotel));

    return locationParts;
}

export function distanceInfo(
    closestFacility: Nullable<IClosestFacility>,
    distanceText: string,
    isEditMode: boolean,
    getFormattedNumber: MarketStore['getFormattedNumber'],
): string {
    if (!isEditMode && closestFacility && distanceText) {
        const distanceInKm = formatNumber(closestFacility.distance, THOUSAND_DIVISOR, TWO_PLACES);
        const formattedDistanceInKm = `${distanceInKm}`;

        return Tokenizer.replaceTokens(distanceText, {
            [Tokens.Facility]: closestFacility.name,
            [Tokens.Distance]: getFormattedNumber(formattedDistanceInKm),
        });
    }

    return distanceText;
}

/*
 *
 *  return distance string from sitecore
 *  if there is a closestFacility and depending on the holidayTheme we take a different distance
 *  for Beach: than more 200m we show long text from sitecore
 *  for City: than more 100m we show long text from sitecore
 *
 */
export function distanceTextFromSitecore(
    closestFacility: Nullable<IClosestFacility>,
    getPhrase: (key: string) => string,
    holidayTheme: Nullable<ITheme>,
): string {
    let distanceTextFromSiteCore = '';

    if (closestFacility && holidayTheme) {
        switch (holidayTheme.code) {
            case HolidayThemes.Beach:
                distanceTextFromSiteCore =
                    closestFacility.distance > HolidayDistance.Beach
                        ? getPhrase(SitecoreDictionary.HolidayDistanceLabelsLongDistanceBeach)
                        : getPhrase(SitecoreDictionary.HolidayDistanceLabelsShortDistanceBeach);
                break;
            case HolidayThemes.City:
                distanceTextFromSiteCore =
                    closestFacility.distance > HolidayDistance.City
                        ? getPhrase(SitecoreDictionary.HolidayDistanceLabelsLongDistanceCity)
                        : getPhrase(SitecoreDictionary.HolidayDistanceLabelsShortDistanceCity);
                break;
            default:
                distanceTextFromSiteCore = '';
                break;
        }
    }

    return distanceTextFromSiteCore;
}

export const getHotelAddress = (booking: Nullable<IBookingInfo>): string => {
    if (!booking?.package.accom.hotel.fullHotelAddress) {
        return '';
    }

    const { city, region, country } = booking.package.accom.hotel.fullHotelAddress;

    return joinNonEmptyWordsWithComma([city, region, country]);
};

export const getHotelCoordinates = (hotel: Nullable<IHotel>): ILocation => ({
    latitude: hotel?.latitude ?? '',
    longitude: hotel?.longitude ?? '',
});
