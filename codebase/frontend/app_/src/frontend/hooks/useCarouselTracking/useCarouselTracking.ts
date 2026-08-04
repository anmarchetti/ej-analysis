import { useRef } from 'react';
import { SwipeableHandlers, useSwipeable } from 'react-swipeable';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import { getCustomParams, getEventParams, getExpandAction } from './useCarouselTracking.utils';

export interface ICarouselTrackingHandlers {
    handleSlide: (currentIndex: number, isFullScreen?: boolean) => void;
    onCarouselSync: (currentIndex: number, nextIndex: number) => void;
    swipeHandlers: SwipeableHandlers;
    trackFullScreenClose: (index: number) => void;
    trackFullScreenOpen: (index: number, isImageClick?: boolean) => void;
    trackThumbnailClick: () => void;
}

export interface ICarouselTrackingProps {
    isVideo: boolean;
    numberOfItems: number;
    hotelName?: string;
    isRecommender?: boolean;
    videoIndex?: number;
}

const useCarouselTracking = ({
    isVideo,
    videoIndex = 0,
    numberOfItems,
    hotelName = '',
    isRecommender = false,
}: ICarouselTrackingProps): ICarouselTrackingHandlers => {
    const { trackEventWithParams } = useStore((stores: TStores) => ({
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
    }));

    const trackingOptions = useRef({
        isSwipe: false,
        isThumbnailClick: false,
        shouldSkipNextLog: false,
        prevIndex: 0,
    });

    const resetOptions = (currentIndex: number): void => {
        trackingOptions.current = {
            ...trackingOptions.current,
            isSwipe: false,
            isThumbnailClick: false,
            prevIndex: currentIndex,
        };
    };

    const swipeHandlers = useSwipeable({
        onSwiped: () => {
            trackingOptions.current.isSwipe = true;
        },
        trackMouse: false,
    });

    const handleSlide = (currentIndex: number, isFullScreen: boolean = false): void => {
        if (trackingOptions.current.shouldSkipNextLog) {
            trackingOptions.current.shouldSkipNextLog = false;
            trackingOptions.current.prevIndex = currentIndex;

            return;
        }

        trackEventWithParams(
            EventTypes.GenericEvent,
            getEventParams(isFullScreen, isRecommender, hotelName),
            getCustomParams({
                currentIndex,
                isSwipe: trackingOptions.current.isSwipe,
                isThumbnailClick: trackingOptions.current.isThumbnailClick,
                isVideo,
                videoIndex,
                numberOfItems,
                prevIndex: trackingOptions.current.prevIndex,
            }),
        );

        resetOptions(currentIndex);
    };

    const trackThumbnailClick = (): void => {
        trackingOptions.current.isThumbnailClick = true;
    };

    const onCarouselSync = (currentIndex: number, nextIndex: number): void => {
        if (currentIndex !== nextIndex) {
            trackingOptions.current.shouldSkipNextLog = true;
        }
    };

    const trackFullScreenClose = (index: number): void => {
        trackEventWithParams(
            EventTypes.GenericEvent,
            getEventParams(true, isRecommender, hotelName),
            getCustomParams({
                action: 'Exit fullscreen click',
                currentIndex: index,
                isSwipe: false,
                isThumbnailClick: false,
                isVideo,
                videoIndex,
                numberOfItems,
                prevIndex: trackingOptions.current.prevIndex,
            }),
        );
    };

    const trackFullScreenOpen = (index: number, isImageClick: boolean = false): void => {
        trackEventWithParams(
            EventTypes.GenericEvent,
            getEventParams(false, isRecommender, hotelName),
            getCustomParams({
                action: getExpandAction(isImageClick),
                currentIndex: index,
                isSwipe: false,
                isThumbnailClick: false,
                isVideo,
                videoIndex,
                numberOfItems,
                prevIndex: trackingOptions.current.prevIndex,
            }),
        );
    };

    return {
        swipeHandlers,
        handleSlide,
        trackThumbnailClick,
        onCarouselSync,
        trackFullScreenClose,
        trackFullScreenOpen,
    };
};

export default useCarouselTracking;
