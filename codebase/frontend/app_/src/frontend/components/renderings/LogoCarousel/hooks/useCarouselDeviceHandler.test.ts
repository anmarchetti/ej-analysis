import { RefObject } from 'react';
import { renderHook } from '@testing-library/react';

import { TCarouselRef } from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import { CarouselScreenTypes } from 'frontend/components/renderings/LogoCarousel/constants';

import { useCarouselDeviceHandler } from './useCarouselDeviceHandler';

const createStores = () => ({
    appStore: {
        isScreenExtraSmall: false,
    },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('useCarouselDeviceHandler', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should return desktop type when the component was rerendered and carousel ref state return desktop screen type', () => {
        const carouselRef = {
            current: {
                state: {
                    deviceType: CarouselScreenTypes.Desktop,
                },
            },
        } as unknown as RefObject<TCarouselRef>;

        const { result } = renderHook(() => useCarouselDeviceHandler({ wasRerendered: true, carouselRef }));

        expect(result.current).toBe(CarouselScreenTypes.Desktop);
    });

    it('should return mobile type when the component was rerendered and carousel ref state return mobile screen type', () => {
        const carouselRef = {
            current: {
                state: {
                    deviceType: CarouselScreenTypes.Mobile,
                },
            },
        } as unknown as RefObject<TCarouselRef>;

        const { result } = renderHook(() => useCarouselDeviceHandler({ wasRerendered: true, carouselRef }));

        expect(result.current).toBe(CarouselScreenTypes.Mobile);
    });

    it('should return default deviceType from init when carousel ref state do not have a deviceType param', () => {
        const carouselRef = {
            current: {
                state: {},
            },
        } as unknown as RefObject<TCarouselRef>;

        const { result } = renderHook(() => useCarouselDeviceHandler({ wasRerendered: true, carouselRef }));

        expect(result.current).toBe(CarouselScreenTypes.Desktop);
    });

    describe('carouselRef is not presented', () => {
        it('should return mobile type when carousel ref state is not defined and the component was rerendered and it is not mobile screen', () => {
            const { result } = renderHook(() => useCarouselDeviceHandler({ wasRerendered: true, carouselRef: null }));

            expect(result.current).toBe(CarouselScreenTypes.Desktop);
        });

        it('should return desktop type when carousel ref state is not defined and the component was not rerendered', () => {
            const { result } = renderHook(() => useCarouselDeviceHandler({ wasRerendered: false, carouselRef: null }));

            expect(result.current).toBe(CarouselScreenTypes.Desktop);
        });

        it('should return mobile type when carousel ref state is not defined and the component was rerendered and it is mobile screen', () => {
            mockStores.appStore.isScreenExtraSmall = true;

            const { result } = renderHook(() => useCarouselDeviceHandler({ wasRerendered: true, carouselRef: null }));

            expect(result.current).toBe(CarouselScreenTypes.Mobile);
        });
    });
});
