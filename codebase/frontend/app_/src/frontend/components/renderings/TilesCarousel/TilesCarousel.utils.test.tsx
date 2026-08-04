import { renderHook } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IHotelHighlight } from 'models/data/IHotel';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';

import * as tilesCarouselUtils from './TilesCarousel.utils';
import { useHotelTiles } from './TilesCarousel.utils';
import { ICarouselTile, ITilesCarouselFields, TilesCarouselVariant } from './TilesCarouselInterfaces';

// Access the non-exported function for testing
const mapHotelHighlightsToCarouselTiles = tilesCarouselUtils.mapHotelHighlightsToCarouselTiles;

describe('TilesCarousel.utils', () => {
    describe('mapHotelHighlightsToCarouselTiles', () => {
        it('should map hotel highlights to carousel tiles correctly', () => {
            // Arrange
            const hotelHighlights: IHotelHighlight[] = [
                {
                    title: 'Test Title',
                    description: 'Test Description',
                    image: 'test-image.jpg',
                    subtitle: 'Test Subtitle',
                },
            ];
            const expectedMapped = {
                fields: {
                    Title: { value: hotelHighlights[0].title },
                    Description: { value: hotelHighlights[0].description },
                    Image: { value: { src: hotelHighlights[0].image } },
                    Subtitle: { value: hotelHighlights[0].subtitle },
                },
                id: 'highlight-0',
            };

            // Act
            const result = mapHotelHighlightsToCarouselTiles(hotelHighlights);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0]).toStrictEqual(expectedMapped);
        });

        it('should handle missing or undefined values', () => {
            // Arrange
            const hotelHighlights: IHotelHighlight[] = [
                {
                    title: undefined,
                    description: undefined,
                    image: undefined,
                    subtitle: undefined,
                },
            ];
            const expectedMapped = {
                fields: {
                    Title: { value: '' },
                    Description: { value: '' },
                    Image: { value: { src: '' } },
                    Subtitle: { value: '' },
                },
                id: 'highlight-0',
            };

            // Act
            const result = mapHotelHighlightsToCarouselTiles(hotelHighlights);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0]).toStrictEqual(expectedMapped);
        });

        it('should map multiple hotel highlights correctly', () => {
            // Arrange
            const hotelHighlights: IHotelHighlight[] = [
                { title: 'Title 1', description: 'Desc 1', image: 'image1.jpg', subtitle: 'Sub 1' },
                { title: 'Title 2', description: 'Desc 2', image: 'image2.jpg', subtitle: 'Sub 2' },
            ];
            const expectedMapped = [
                {
                    fields: {
                        Title: { value: hotelHighlights[0].title },
                        Description: { value: hotelHighlights[0].description },
                        Image: { value: { src: hotelHighlights[0].image } },
                        Subtitle: { value: hotelHighlights[0].subtitle },
                    },
                    id: 'highlight-0',
                },
                {
                    fields: {
                        Title: { value: hotelHighlights[1].title },
                        Description: { value: hotelHighlights[1].description },
                        Image: { value: { src: hotelHighlights[1].image } },
                        Subtitle: { value: hotelHighlights[1].subtitle },
                    },
                    id: 'highlight-1',
                },
            ];

            // Act
            const result = mapHotelHighlightsToCarouselTiles(hotelHighlights);

            // Assert
            expect(result).toHaveLength(2);
            expect(result).toStrictEqual(expectedMapped);
        });
    });

    describe('useHotelTiles', () => {
        const mockTiles: ISitecoreCompositeField<ICarouselTile>[] = [
            {
                fields: {
                    Title: { value: 'Original Tile' },
                    Description: { value: 'Original Description' },
                    Image: { value: { src: 'original.jpg' } },
                    Subtitle: { value: 'Original Subtitle' },
                },
                id: 'original-tile',
            },
        ];

        const mockFields: ITilesCarouselFields = {
            UseHotelTiles: { value: true },
            Tiles: mockTiles,
            IsLuxuryExclusive: mockSitecoreField(false),
            Title: mockSitecoreField('title'),
            Variant: mockSitecoreField(TilesCarouselVariant.TextOnImage),
        };

        const mockHotelHighlights: IHotelHighlight[] = [
            { title: 'Hotel Title', description: 'Hotel Description', image: 'hotel.jpg', subtitle: 'Hotel Subtitle' },
        ];

        const mockLayoutHighlights: ISitecoreCompositeField<ICarouselTile>[] = [
            {
                fields: {
                    Title: { value: 'Layout Title' },
                    Description: { value: 'Layout Description' },
                    Image: { value: { src: 'layout.jpg' } },
                    Subtitle: { value: 'Layout Subtitle' },
                },
                id: 'layout-tile',
            },
        ];

        it('should return original tiles when UseHotelTiles is false', () => {
            // Arrange
            const fields = { ...mockFields, UseHotelTiles: { value: false } };
            const offer = null;
            const layout = {} as ISitecoreLayout;

            // Act
            const { result } = renderHook(() => useHotelTiles(fields, offer, layout));

            // Assert
            expect(result.current).toStrictEqual(mockTiles);
        });

        it('should return hotel highlights from selectedOffer when available', () => {
            // Arrange
            const fields = mockFields;
            const layout = {} as ISitecoreLayout;

            // Act
            const { result } = renderHook(() => useHotelTiles(fields, mockHotelHighlights, layout));

            // Assert
            expect(result.current).toHaveLength(1);
            expect(result.current[0].fields.Title.value).toBe('Hotel Title');
        });

        it('should return hotel highlights from layout when offer highlights are not available', () => {
            // Arrange
            const fields = mockFields;
            const offer = null;
            const layout = {
                sitecore: {
                    route: {
                        fields: {
                            HotelHighlights: mockLayoutHighlights,
                        },
                    },
                },
            } as ISitecoreLayout;

            // Act
            const { result } = renderHook(() => useHotelTiles(fields, offer, layout));

            // Assert
            expect(result.current).toStrictEqual(mockLayoutHighlights);
        });

        it('should return empty list when no alternatives are available', () => {
            // Arrange
            const fields = mockFields;
            const offer = null;
            const layout = {} as ISitecoreLayout;

            // Act
            const { result } = renderHook(() => useHotelTiles(fields, offer, layout));

            // Assert
            expect(result.current).toStrictEqual([]);
        });

        it('should filter out tiles with empty fields', () => {
            // Arrange
            const emptyTile = {
                fields: {},
                id: 'empty-tile',
            };

            const fieldsWithEmptyTile = {
                ...mockFields,
                UseHotelTiles: { value: false },
                Tiles: [...mockTiles, emptyTile],
            };

            const offer = null;
            const layout = {} as ISitecoreLayout;

            // Act
            const { result } = renderHook(() =>
                useHotelTiles(fieldsWithEmptyTile as ITilesCarouselFields, offer, layout),
            );

            // Assert
            expect(result.current).toHaveLength(1);
            expect(result.current[0].id).toBe('original-tile');
        });

        it('should filter out tiles with empty title', () => {
            // Arrange
            const emptyTile = {
                fields: {
                    Title: { value: '' },
                },
                id: 'empty-tile',
            };

            const fieldsWithEmptyTile = {
                ...mockFields,
                UseHotelTiles: { value: false },
                Tiles: [...mockTiles, emptyTile],
            };

            const offer = null;
            const layout = {} as ISitecoreLayout;

            // Act
            const { result } = renderHook(() =>
                useHotelTiles(fieldsWithEmptyTile as ITilesCarouselFields, offer, layout),
            );

            // Assert
            expect(result.current).toHaveLength(1);
            expect(result.current[0].id).toBe('original-tile');
        });

        it('should filter out tiles with empty image', () => {
            // Arrange
            const emptyTile = {
                fields: {
                    Image: { value: { src: '' } },
                },
                id: 'empty-tile',
            };

            const fieldsWithEmptyTile = {
                ...mockFields,
                UseHotelTiles: { value: false },
                Tiles: [...mockTiles, emptyTile],
            };

            const offer = null;
            const layout = {} as ISitecoreLayout;

            // Act
            const { result } = renderHook(() =>
                useHotelTiles(fieldsWithEmptyTile as ITilesCarouselFields, offer, layout),
            );

            // Assert
            expect(result.current).toHaveLength(1);
            expect(result.current[0].id).toBe('original-tile');
        });
    });
});
