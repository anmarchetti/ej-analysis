import { ENGLISH } from 'code/cmsLang';
import { Tokens } from 'code/tokens';
import { LayoutStore } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IHotel } from 'models/data/IHotel';
import { ILocationHierarchy } from 'models/data/ILocationHierarchy';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';

import {
    ICategoriesWithItems,
    IHotelPointsOfInterest,
    IHotelPointsOfInterestRequestParams,
    IMapPointsOfInterestCategory,
} from './IMapPointsOfInterest';

export const DEFAULT_NUMBER_OF_ITEMS = 20;

export const formatCategoriesWithNumberOfItems = (
    categories: ISitecoreCompositeField<IMapPointsOfInterestCategory>[],
): string =>
    categories
        .map(category => {
            const key = category.fields.Key?.value;

            if (!key) {
                return null;
            }

            return `${key}:${category.fields.MaxNumberOfItems?.value || DEFAULT_NUMBER_OF_ITEMS}`;
        })
        .filter(Boolean)
        .join(',');

export const getHotelPointsOfInterestProps = (
    isHotelDetailsBookPage: boolean,
    hotel: Nullable<IHotel>,
    layout: ISitecoreLayout,
    locationHierarchy: Nullable<ILocationHierarchy>,
    Categories: ISitecoreCompositeField<IMapPointsOfInterestCategory>[],
    airportCode?: string,
): IHotelPointsOfInterestRequestParams => {
    const categories = formatCategoriesWithNumberOfItems(Categories);

    if (isHotelDetailsBookPage) {
        return {
            lat: Number(hotel?.latitude),
            lon: Number(hotel?.longitude),
            resortId: hotel?.resort?.code,
            categories,
            airport: airportCode,
            theme: hotel?.theme?.code,
        };
    }

    const { Latitude, Longitude, Airports, HotelTheme } = layout.sitecore.route.fields || {};

    return {
        lat: Number(Latitude?.value),
        lon: Number(Longitude?.value),
        resortId: locationHierarchy?.resort?.code,
        categories,
        airport: Airports?.[0]?.fields?.Code?.value,
        theme: HotelTheme?.fields?.Code?.value,
    };
};

export const getCategoriesWithItems = ({
    categories,
    points,
    language,
    getPhrase,
    distanceText,
}: {
    categories: ISitecoreCompositeField<IMapPointsOfInterestCategory>[];
    getPhrase: LayoutStore['getPhrase'];
    language: string;
    points: Nullable<IHotelPointsOfInterest[]>;
    distanceText?: string;
}): ICategoriesWithItems[] => {
    if (!points?.length) {
        return [];
    }

    const pointsMap = new Map(points.map(p => [p.category, p.items]));
    const categoriesWithItems = categories
        .map(category => {
            const items = (pointsMap.get(category.fields.Key.value) ?? []).map(item => {
                const newItem = { ...item };

                newItem.distance = formatDistance(language, newItem.distance, distanceText);
                newItem.categoryName = getPhrase(`Map.PointsOfInterestCategories.${newItem.categoryName}`);

                return newItem;
            });

            return {
                name: category.fields.Name,
                icon: category.fields.Icon,
                items,
                key: category.fields.Key.value,
            };
        })
        .filter(category => category.items.length > 0);

    return categoriesWithItems;
};

export const formatDistance = (language: string, distance: string, distanceText?: string): string => {
    if (!distance) {
        return '';
    }

    let formattedDistance = distance;

    if (language !== ENGLISH) {
        formattedDistance = formattedDistance.replace('.', ',');
    }

    return Tokenizer.replaceToken(distanceText, Tokens.Distance, formattedDistance);
};
