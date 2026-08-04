import { useMemo } from 'react';

import { IHotelHighlight } from 'models/data/IHotel';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';

import { ICarouselTile, ITilesCarouselFields } from './TilesCarouselInterfaces';

/**
 * Maps hotel highlights to the expected ISitecoreCompositeField<ICarouselTile> format
 */
export const mapHotelHighlightsToCarouselTiles = (
    hotelHighlights: IHotelHighlight[],
): ISitecoreCompositeField<ICarouselTile>[] =>
    hotelHighlights.map((highlight, idx) => ({
        fields: {
            Title: { value: highlight.title ?? '' },
            Description: { value: highlight.description ?? '' },
            Image: { value: { src: highlight.image ?? '' } },
            Subtitle: { value: highlight.subtitle ?? '' },
        },
        id: `highlight-${idx}`,
    }));

/**
 * Custom hook to determine the source of tiles based on configuration
 * Uses hotel highlights from selectedOffer or layout when UseHotelTiles is true
 * @param fields - component fields
 * @param hotelHighlightsInfo - loaded hotel highlights for the selected offer
 * @param layout - sitecore layout
 * @returns an array of ISitecoreCompositeField<ICarouselTile>
 */
export const useHotelTiles = (
    fields: ITilesCarouselFields | undefined,
    hotelHighlightsInfo: Nullable<IHotelHighlight[]>,
    layout: ISitecoreLayout,
): ISitecoreCompositeField<ICarouselTile>[] =>
    useMemo(() => {
        let tiles: ISitecoreCompositeField<ICarouselTile>[] = [];

        // Use original tiles if UseHotelTiles is not enabled
        if (!fields?.UseHotelTiles?.value) {
            tiles = fields?.Tiles ?? [];
        }

        // Use hotel highlights from selected offer if available
        else if (hotelHighlightsInfo?.length) {
            tiles = mapHotelHighlightsToCarouselTiles(hotelHighlightsInfo);
        }

        // Fallback to hotel highlights from layout
        else if (layout?.sitecore?.route?.fields?.HotelHighlights?.length) {
            tiles = layout.sitecore.route.fields.HotelHighlights;
        }

        return tiles.filter(
            tile =>
                tile?.fields &&
                Object.keys(tile.fields).length > 0 &&
                tile.fields?.Title?.value &&
                tile.fields?.Image?.value,
        );
    }, [
        fields?.Tiles,
        fields?.UseHotelTiles?.value,
        hotelHighlightsInfo,
        layout?.sitecore?.route?.fields?.HotelHighlights,
    ]);
