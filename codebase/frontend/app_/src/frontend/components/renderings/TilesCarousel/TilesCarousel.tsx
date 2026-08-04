import React, { FC, useEffect } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import {
    getCustomisableTitleClassName,
    getPaddingSizeClassName,
} from 'frontend/utils/componentStylesCustomisation.utils';
import useIsLuxuryStatus from 'frontend/components/renderings/HotelDetails/HotelImageCarousel/components/HotelImageCarousel.utils';

import InformationBelowTilesVariant from './InformationBelowTilesVariant/InformationBelowTilesVariant';
import TextOnImageVariant from './TextOnImageVariant/TextOnImageVariant';
import { useHotelTiles } from './TilesCarousel.utils';
import { TilesCarouselVariant, TTilesCarouselProps } from './TilesCarouselInterfaces';

const TilesCarousel: FC<TTilesCarouselProps> = ({ fields, params }) => {
    const { isLuxuryPackage, selectedOffer, layout, loadHotelHighlightsInfo, hotelHighlightsInfo } = useStore(
        ({ bookingStore, layoutStore }: TStores) => ({
            isLuxuryPackage: bookingStore.isLuxuryPackage,
            selectedOffer: bookingStore.selectedOffer,
            loadHotelHighlightsInfo: bookingStore.loadHotelHighlightsInfo,
            hotelHighlightsInfo: bookingStore.hotelHighlightsInfo,
            layout: layoutStore.layout,
        }),
    );

    const isLuxuryHotelBrowsePage = useIsLuxuryStatus();

    useEffect(() => {
        if (selectedOffer && fields?.UseHotelTiles?.value) {
            loadHotelHighlightsInfo();
        }
    }, [selectedOffer, loadHotelHighlightsInfo, fields?.UseHotelTiles?.value]);

    const tiles = useHotelTiles(fields, hotelHighlightsInfo, layout);

    if (!fields || !tiles.length || (fields.IsLuxuryExclusive?.value && !isLuxuryPackage && !isLuxuryHotelBrowsePage)) {
        return null;
    }

    const titleClassName = getCustomisableTitleClassName('', params);
    const wrapperClassName = getPaddingSizeClassName(params.PaddingSize) ?? '';
    const titleTag = params.TitleTag || 'p';

    // Create a modified fields object with the potentially new tiles source
    const modifiedFields = {
        ...fields,
        Tiles: tiles,
    };

    switch (fields.Variant?.value) {
        case TilesCarouselVariant.TextOnImage:
            return (
                <TextOnImageVariant
                    {...modifiedFields}
                    titleClassName={titleClassName}
                    wrapperClassName={wrapperClassName}
                    titleTag={titleTag}
                />
            );

        case TilesCarouselVariant.InformationBelowTiles:
            return (
                <InformationBelowTilesVariant
                    {...modifiedFields}
                    titleClassName={titleClassName}
                    wrapperClassName={wrapperClassName}
                    titleTag={titleTag}
                />
            );

        default:
            return null;
    }
};

export default observer(TilesCarousel);
