import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventCategories } from 'models/enum/tracking/GenericEventParams';

import {
    createActionMessage,
    createEventLabel,
    getCustomParams,
    getDefaultGalleryMediaContent,
    getDirection,
    getEventParams,
    getExpandAction,
} from './useCarouselTracking.utils';

describe('useCarouselTracking.utils', () => {
    describe('createEventLabel', () => {
        it('should return hotel name when isRecommender is true', () => {
            expect(createEventLabel(false, true, 'HotelX')).toBe('HotelX');
        });

        it('should return hotel name with Fullscreen when isFullScreen is true', () => {
            expect(createEventLabel(true, false, 'HotelY')).toBe('HotelY - Fullscreen');
        });

        it('should return hotel name with Normal when isFullScreen is false', () => {
            expect(createEventLabel(false, false, 'HotelZ')).toBe('HotelZ - Normal');
        });

        it('should return only mode when hotelName is empty', () => {
            expect(createEventLabel(true, false, '')).toBe('Fullscreen');
            expect(createEventLabel(false, false, '')).toBe('Normal');
        });
    });

    describe('getEventParams', () => {
        it('should return correct params when isRecommender is true', () => {
            const params = getEventParams(false, true, 'HotelA');

            expect(params).toStrictEqual({
                eventCategory: EventCategories.HotelGallery,
                eventAction: 'Recommender',
                eventLabel: 'HotelA',
                eventType: EventTypes.NonInteraction,
            });
        });

        it('should return correct params when isImpressions is true', () => {
            const params = getEventParams(true, false, 'HotelB');

            expect(params.eventAction).toBe('Impressions');
            expect(params.eventLabel).toBe('HotelB - Fullscreen');
        });
    });

    describe('getDirection', () => {
        it('should return Right when moving forward', () => {
            expect(getDirection(2, 1, 5)).toBe('Right');
        });

        it('should return Left when moving backward', () => {
            expect(getDirection(1, 2, 5)).toBe('Left');
        });

        it('should return Right when wrapping forward', () => {
            expect(getDirection(0, 4, 5)).toBe('Right');
        });

        it('should return Left when wrapping backward', () => {
            expect(getDirection(4, 0, 5)).toBe('Left');
        });

        it('should return Right when distances are equal', () => {
            expect(getDirection(2, 2, 5)).toBe('Right');
        });
    });

    describe('getCustomParams', () => {
        it('should return correct params when video is at index 0', () => {
            const params = getCustomParams({
                currentIndex: 0,
                prevIndex: 4,
                numberOfItems: 5,
                isVideo: true,
                isThumbnailClick: false,
                isSwipe: false,
            });

            expect(params.genericValue1).toBe('Video');
            expect(params.genericValue2).toBe(1);
            expect(params.genericValue3).toBe(5);
            expect(params.genericValue4).toBe('Right Arrow Click');
            expect(params.destinationUrl).toBeNull();
        });

        it('should return correct params when video is at index 1', () => {
            const params = getCustomParams({
                currentIndex: 1,
                prevIndex: 0,
                numberOfItems: 5,
                isVideo: true,
                videoIndex: 1,
                isThumbnailClick: false,
                isSwipe: false,
            });

            expect(params.genericValue1).toBe('Video');
            expect(params.genericValue2).toBe(2);
            expect(params.genericValue3).toBe(5);
            expect(params.genericValue4).toBe('Right Arrow Click');
        });

        it('should return correct params when image is at index 1', () => {
            const params = getCustomParams({
                currentIndex: 1,
                prevIndex: 0,
                numberOfItems: 5,
                isVideo: false,
                isThumbnailClick: false,
                isSwipe: false,
            });

            expect(params.genericValue1).toBe('Image');
            expect(params.genericValue2).toBe(2);
            expect(params.genericValue3).toBe(5);
            expect(params.genericValue4).toBe('Right Arrow Click');
        });

        it('should use action when action is provided', () => {
            const params = getCustomParams({
                currentIndex: 1,
                prevIndex: 0,
                numberOfItems: 5,
                isVideo: false,
                isThumbnailClick: false,
                isSwipe: false,
                action: 'CustomAction',
            });

            expect(params.genericValue4).toBe('CustomAction');
        });

        it('should return Thumbnail when isThumbnailClick is true', () => {
            const params = getCustomParams({
                currentIndex: 2,
                prevIndex: 1,
                numberOfItems: 5,
                isVideo: false,
                isThumbnailClick: true,
                isSwipe: false,
            });

            expect(params.genericValue4).toBe('Thumbnail');
        });

        it('should return Swipe Left when isSwipe is true and direction is left', () => {
            const params = getCustomParams({
                currentIndex: 1,
                prevIndex: 2,
                numberOfItems: 5,
                isVideo: false,
                isThumbnailClick: false,
                isSwipe: true,
            });

            expect(params.genericValue4).toBe('Swipe Left');
        });
    });

    describe('createActionMessage', () => {
        it('should return Thumbnail when isThumbnailClick is true', () => {
            expect(createActionMessage(true, false, 'Right')).toBe('Thumbnail');
        });

        it('should return Swipe with direction when isSwipe is true', () => {
            expect(createActionMessage(false, true, 'Left')).toBe('Swipe Left');
        });

        it('should return Arrow Click with direction otherwise', () => {
            expect(createActionMessage(false, false, 'Right')).toBe('Right Arrow Click');
        });
    });

    describe('getExpandAction', () => {
        it('should return correct string when image is clicked', () => {
            expect(getExpandAction(true)).toBe('Expand - Image Click');
        });

        it('should return correct string when icon is clicked', () => {
            expect(getExpandAction(false)).toBe('Expand - Icon Click');
        });
    });

    describe('getDefaultGalleryMediaContent', () => {
        it('should return Video when isVideo is true', () => {
            expect(getDefaultGalleryMediaContent(true)).toBe('Video');
        });

        it('should return Image when isVideo is false', () => {
            expect(getDefaultGalleryMediaContent(false)).toBe('Image');
        });
    });
});
