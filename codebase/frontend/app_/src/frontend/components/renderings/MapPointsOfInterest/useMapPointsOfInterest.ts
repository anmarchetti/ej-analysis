import { useEffect, useState } from 'react';

import { Tokens } from 'code/tokens';
import { useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import offersService from 'frontend/services/offers.service';
import { TStores } from 'frontend/store/IStores';
import { getLocationHierarchy } from 'frontend/utils/getLocationHierarchy';
import { Tokenizer } from 'frontend/utils/tokenizer';

import {
    IHotelPointsOfInterest,
    IMapPointsOfInterestFields,
    IUseMapPointsOfInterestResult,
} from './IMapPointsOfInterest';
import { getCategoriesWithItems, getHotelPointsOfInterestProps } from './MapPointsOfInterest.utils';

export const useMapPointsOfInterest = (fields?: IMapPointsOfInterestFields): IUseMapPointsOfInterestResult => {
    const {
        hotel,
        layout,
        language,
        isHotelDetailsBookPage,
        outboundFlight,
        getPhrase,
        trackMapPointsOfInterestInteraction,
    } = useStore((stores: TStores) => ({
        hotel: stores.bookingStore.hotel,
        layout: stores.layoutStore.layout,
        getPhrase: stores.layoutStore.getPhrase,
        language: stores.layoutStore.lang,
        isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
        outboundFlight: stores.bookingStore.outboundFlight,
        trackMapPointsOfInterestInteraction: stores.trackingStore.trackMapPointsOfInterestInteraction,
    }));

    const [hotelPOIs, setHotelPOIs] = useState<Nullable<IHotelPointsOfInterest[]>>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const isMobile = useXSMobileViewport();

    const { Title, Categories = [], Distance } = fields ?? {};

    const locationHierarchy = getLocationHierarchy(layout);
    const { lat, lon, resortId, categories, airport, theme } = getHotelPointsOfInterestProps(
        isHotelDetailsBookPage,
        hotel,
        layout,
        locationHierarchy,
        Categories,
        outboundFlight?.arrPt,
    );

    useEffect(() => {
        const loadPointsOfInterest = async (): Promise<void> => {
            if (!resortId || !categories || !Number.isFinite(lat) || !Number.isFinite(lon)) {
                return;
            }

            const points = await offersService.getHotelPointsOfInterest({
                resortId,
                categories,
                lon,
                lat,
                airport,
                theme,
            });
            setHotelPOIs(points);
            setActiveIndex(0);
        };

        loadPointsOfInterest();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lat, lon, resortId, categories]);

    useEffect(
        () => () => {
            setHotelPOIs(null);
        },
        [],
    );

    const hotelName = isHotelDetailsBookPage ? hotel?.name : locationHierarchy?.hotel?.name;
    const title = Tokenizer.replaceToken(Title?.value, Tokens.HotelName, hotelName);

    const categoriesWithItems = getCategoriesWithItems({
        categories: Categories,
        points: hotelPOIs,
        language: language,
        distanceText: Distance?.value,
        getPhrase: getPhrase,
    });

    return {
        title,
        categoriesWithItems,
        isMobile,
        activeIndex,
        setActiveIndex,
        handleCategoryClick: trackMapPointsOfInterestInteraction,
    };
};
