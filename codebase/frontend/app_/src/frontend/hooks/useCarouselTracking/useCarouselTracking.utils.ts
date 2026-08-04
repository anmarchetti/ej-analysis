import { ICustomParams, IEventParams } from 'models/data/tracking/IEventWithParams';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventCategories } from 'models/enum/tracking/GenericEventParams';

interface IGetCustomParamsProps {
    currentIndex: number;
    isSwipe: boolean;
    isThumbnailClick: boolean;
    isVideo: boolean;
    numberOfItems: number;
    prevIndex: number;
    action?: string;
    videoIndex?: number;
}

export const createEventLabel = (isFullScreen: boolean, isRecommender: boolean, hotelName: string): string => {
    if (isRecommender) {
        return hotelName;
    }

    const mode = isFullScreen ? 'Fullscreen' : 'Normal';

    return hotelName ? `${hotelName} - ${mode}` : mode;
};

export const getEventParams = (isFullScreen: boolean, isRecommender: boolean, hotelName: string): IEventParams => {
    const eventCategory = EventCategories.HotelGallery;
    const eventAction = isRecommender ? 'Recommender' : 'Impressions';
    const eventLabel = createEventLabel(isFullScreen, isRecommender, hotelName);
    const eventType = EventTypes.NonInteraction;

    return {
        eventCategory,
        eventAction,
        eventLabel,
        eventType,
    };
};

export const getDirection = (currentIndex: number, prevIndex: number, numberOfItems: number): string => {
    const forwardDistance = (currentIndex - prevIndex + numberOfItems) % numberOfItems;
    const backwardDistance = (prevIndex - currentIndex + numberOfItems) % numberOfItems;

    return forwardDistance <= backwardDistance ? 'Right' : 'Left';
};
export const getCustomParams = ({
    currentIndex,
    prevIndex,
    numberOfItems,
    isVideo,
    videoIndex = 0,
    isThumbnailClick,
    isSwipe,
    action,
}: IGetCustomParamsProps): ICustomParams => {
    const direction = getDirection(currentIndex, prevIndex, numberOfItems);

    return {
        genericValue1: isVideo && currentIndex === videoIndex ? 'Video' : 'Image',
        genericValue2: currentIndex + 1,
        genericValue3: numberOfItems,
        genericValue4: action ?? createActionMessage(isThumbnailClick, isSwipe, direction),
        destinationUrl: null,
    };
};

export const createActionMessage = (isThumbnailClick: boolean, isSwipe: boolean, direction: string): string => {
    if (isThumbnailClick) {
        return 'Thumbnail';
    }

    if (isSwipe) {
        return `Swipe ${direction}`;
    }

    return `${direction} Arrow Click`;
};

export const getExpandAction = (isImageClick: boolean): string =>
    isImageClick ? 'Expand - Image Click' : 'Expand - Icon Click';

export const getDefaultGalleryMediaContent = (isVideo: boolean): string => (isVideo ? 'Video' : 'Image');
