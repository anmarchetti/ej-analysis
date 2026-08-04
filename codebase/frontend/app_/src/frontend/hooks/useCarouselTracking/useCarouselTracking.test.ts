import * as swipeAbleUtils from 'react-swipeable';
import { SwipeableHandlers, SwipeableOptions } from 'react-swipeable';
import { act, renderHook } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import useCarouselTracking, { ICarouselTrackingProps } from './useCarouselTracking';
import * as utils from './useCarouselTracking.utils';

const createStores = () =>
    createMockStores({
        trackingStore: {
            trackEventWithParams: jest.fn(),
        },
    });

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.spyOn(utils, 'getCustomParams').mockImplementation(() => ({}));
jest.spyOn(utils, 'getEventParams').mockImplementation(() => ({}));
jest.spyOn(utils, 'getExpandAction').mockImplementation(() => 'Expand action');

jest.spyOn(swipeAbleUtils, 'useSwipeable').mockImplementation(
    (props: SwipeableOptions) =>
        ({
            onMouseDown: props.onSwiped,
        } as SwipeableHandlers),
);

describe('useCarouselTracking', () => {
    const defaultProps: ICarouselTrackingProps = {
        isVideo: false,
        numberOfItems: 5,
        hotelName: 'Test Hotel',
        isRecommender: false,
    };

    const defaultGetCustomParamsProps = {
        currentIndex: 0,
        isSwipe: false,
        isThumbnailClick: false,
        isVideo: false,
        numberOfItems: 5,
        prevIndex: 0,
        videoIndex: 0,
    };

    beforeEach(() => {
        mockStores = createStores();
    });

    it('should return handlers', () => {
        const { result } = renderHook(() => useCarouselTracking(defaultProps));

        expect(result.current).toHaveProperty('handleSlide');
        expect(result.current).toHaveProperty('onCarouselSync');
        expect(result.current).toHaveProperty('swipeHandlers');
        expect(result.current).toHaveProperty('trackFullScreenClose');
        expect(result.current).toHaveProperty('trackFullScreenOpen');
        expect(result.current).toHaveProperty('trackThumbnailClick');
    });

    it('should call trackEventWithParams on handleSlide', () => {
        const { result } = renderHook(() => useCarouselTracking(defaultProps));

        act(() => {
            result.current.handleSlide(2);
        });

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(EventTypes.GenericEvent, {}, {});
        expect(utils.getEventParams).toHaveBeenCalledWith(false, false, 'Test Hotel');
        expect(utils.getCustomParams).toHaveBeenCalledWith({ ...defaultGetCustomParamsProps, currentIndex: 2 });
    });

    it('should skip tracking when shouldSkipNextLog is true', () => {
        const { result } = renderHook(() => useCarouselTracking(defaultProps));

        act(() => {
            result.current.onCarouselSync(1, 2);
            result.current.handleSlide(2);
        });

        expect(mockStores.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
        expect(utils.getCustomParams).not.toHaveBeenCalled();
        expect(utils.getEventParams).not.toHaveBeenCalled();
    });

    it('should NOT skip tracking when shouldSkipNextLog is false', () => {
        const { result } = renderHook(() => useCarouselTracking(defaultProps));

        act(() => {
            result.current.onCarouselSync(1, 1);
            result.current.handleSlide(1);
        });

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalled();
    });

    it('should set isSwipe to true on swipe', () => {
        const { result } = renderHook(() => useCarouselTracking(defaultProps));

        act(() => {
            result.current.swipeHandlers.onMouseDown?.({} as React.MouseEvent);
            result.current.handleSlide(1);
        });

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalled();
        expect(utils.getEventParams).toHaveBeenCalledWith(false, false, 'Test Hotel');
        expect(utils.getCustomParams).toHaveBeenCalledWith({
            ...defaultGetCustomParamsProps,
            currentIndex: 1,
            isSwipe: true,
        });
    });

    it('should set isThumbnailClick to true when trackThumbnailClick is called', () => {
        const { result } = renderHook(() => useCarouselTracking(defaultProps));

        act(() => {
            result.current.trackThumbnailClick();
            result.current.handleSlide(1);
        });

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalled();
        expect(utils.getEventParams).toHaveBeenCalledWith(false, false, 'Test Hotel');
        expect(utils.getCustomParams).toHaveBeenCalledWith({
            ...defaultGetCustomParamsProps,
            currentIndex: 1,
            isThumbnailClick: true,
        });
    });

    it('should call trackEventWithParams on trackFullScreenClose', () => {
        const { result } = renderHook(() => useCarouselTracking(defaultProps));

        act(() => {
            result.current.trackFullScreenClose(3);
        });

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(EventTypes.GenericEvent, {}, {});
        expect(utils.getEventParams).toHaveBeenCalledWith(true, false, 'Test Hotel');
        expect(utils.getCustomParams).toHaveBeenCalledWith({
            ...defaultGetCustomParamsProps,
            action: 'Exit fullscreen click',
            currentIndex: 3,
        });
    });

    it('should call trackEventWithParams on trackFullScreenOpen', () => {
        const { result } = renderHook(() => useCarouselTracking(defaultProps));

        act(() => {
            result.current.trackFullScreenOpen(4, true);
        });

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(EventTypes.GenericEvent, {}, {});
        expect(utils.getEventParams).toHaveBeenCalledWith(false, false, 'Test Hotel');
        expect(utils.getExpandAction).toHaveBeenCalledWith(true);
        expect(utils.getCustomParams).toHaveBeenCalledWith({
            ...defaultGetCustomParamsProps,
            action: 'Expand action',
            currentIndex: 4,
        });
    });

    it('should call trackEventWithParams on trackFullScreenOpen when isImageClick is false', () => {
        const { result } = renderHook(() => useCarouselTracking(defaultProps));

        act(() => {
            result.current.trackFullScreenOpen(4);
        });

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(EventTypes.GenericEvent, {}, {});
        expect(utils.getExpandAction).toHaveBeenCalledWith(false);
    });

    it('should use default values for optional props', () => {
        const { result } = renderHook(() => useCarouselTracking({ isVideo: true, numberOfItems: 1 }));

        act(() => {
            result.current.handleSlide(0);
        });

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalled();
        expect(utils.getEventParams).toHaveBeenCalledWith(false, false, '');
        expect(utils.getCustomParams).toHaveBeenCalledWith({
            ...defaultGetCustomParamsProps,
            currentIndex: 0,
            isVideo: true,
            numberOfItems: 1,
        });
    });

    it('should handle videoIndex when isVideo is true', () => {
        const { result } = renderHook(() => useCarouselTracking({ isVideo: true, numberOfItems: 3, videoIndex: 1 }));

        act(() => {
            result.current.handleSlide(1);
        });

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalled();
        expect(utils.getCustomParams).toHaveBeenCalledWith({
            ...defaultGetCustomParamsProps,
            currentIndex: 1,
            isVideo: true,
            videoIndex: 1,
            numberOfItems: 3,
        });
    });
});
