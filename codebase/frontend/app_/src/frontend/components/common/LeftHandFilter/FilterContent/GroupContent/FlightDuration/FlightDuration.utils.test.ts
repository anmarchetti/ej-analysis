import React from 'react';
import { renderHook } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { MAX_FLIGHT_DURATION, MIN_FLIGHT_DURATION } from 'frontend/store/base/search/BaseSearchFilterStore';
import * as debounceUtils from 'frontend/utils/debounce';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import useFlightDuration, { STEP } from './FlightDuration.utils';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;

describe('useFlightDuration', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            searchFiltersStore: {
                setFlightDurationValue: jest.fn(),
                onApply: jest.fn(),
                flightDurationFrom: MIN_FLIGHT_DURATION,
                flightDurationTo: MAX_FLIGHT_DURATION,
            },
        });
    });

    it('should return getPhrase property', () => {
        const { result } = renderHook(() => useFlightDuration());

        expect(result.current).toHaveProperty('getPhrase', mockStores.layoutStore.getPhrase);
    });

    it('should return proper props for slider', () => {
        const value = { current: {} };
        jest.spyOn(React, 'useRef').mockReturnValue(value);

        const { result } = renderHook(() => useFlightDuration());

        const { flightDurationFrom: min, flightDurationTo: max } = mockStores.searchFiltersStore;

        expect(result.current.slider).toHaveProperty('min', min);
        expect(result.current.slider).toHaveProperty('max', max);
        expect(result.current.slider).toHaveProperty('step', STEP);
        expect(result.current.slider).toHaveProperty('values', [min, max]);
        expect(result.current.slider).toHaveProperty('onSlide', expect.any(Function));
        expect(result.current.slider).toHaveProperty('sliderRef', value);
    });

    describe('onSlide function', () => {
        it('should set valid data', () => {
            jest.spyOn(React, 'useRef').mockReturnValue({ current: { setState: jest.fn() } });
            jest.spyOn(debounceUtils, 'debounce').mockImplementation(fn => fn);

            const { result } = renderHook(() => useFlightDuration());

            const value = [1, 5];

            result.current.slider.onSlide(value);

            expect(mockStores.searchFiltersStore.setFlightDurationValue).toHaveBeenCalledWith(value, true);
            expect(mockStores.searchFiltersStore.onApply).toHaveBeenCalledTimes(1);
        });

        it('should NOT set invalid data', () => {
            const state = { handles: [{ val: 1 }, { val: 5 }] };
            const slider = { current: { setState: jest.fn(), state } };

            jest.spyOn(React, 'useRef').mockReturnValue(slider);
            jest.spyOn(debounceUtils, 'debounce').mockImplementation(fn => fn);

            const { result } = renderHook(() => useFlightDuration());

            const invalidValue = [1, 1];

            result.current.slider.onSlide(invalidValue);

            expect(slider.current.setState).toHaveBeenCalledTimes(1);
        });
    });

    it('should return proper props for leftCounter', () => {
        const { result } = renderHook(() => useFlightDuration());

        const { flightDurationFrom: min, flightDurationTo: max } = mockStores.searchFiltersStore;

        expect(result.current.leftCounter).toHaveProperty('value', min);
        expect(result.current.leftCounter).toHaveProperty('step', STEP);
        expect(result.current.leftCounter).toHaveProperty('onChange', expect.any(Function));
        expect(result.current.leftCounter).toHaveProperty('isDecreaseDisabled', min <= MIN_FLIGHT_DURATION);
        expect(result.current.leftCounter).toHaveProperty('isIncreaseDisabled', min + 1 >= max);
        expect(result.current.leftCounter).toHaveProperty(
            'ariaLabel',
            SitecoreDictionary.AccessibilityAriaLabelsFlightDurationMinValue,
        );
    });

    it('should set flightDurationFrom value on onChange of leftCounter', () => {
        const { result } = renderHook(() => useFlightDuration());

        const { flightDurationTo: max } = mockStores.searchFiltersStore;

        const value = [2, max];

        result.current.leftCounter.onChange(2);

        expect(mockStores.searchFiltersStore.setFlightDurationValue).toHaveBeenCalledWith(value, true);
        expect(mockStores.searchFiltersStore.onApply).toHaveBeenCalledTimes(1);
    });

    it('should return proper props for rightCounter', () => {
        const { result } = renderHook(() => useFlightDuration());

        const { flightDurationFrom: min, flightDurationTo: max } = mockStores.searchFiltersStore;

        expect(result.current.rightCounter).toHaveProperty('value', max);
        expect(result.current.rightCounter).toHaveProperty('step', STEP);
        expect(result.current.rightCounter).toHaveProperty('onChange', expect.any(Function));
        expect(result.current.rightCounter).toHaveProperty('isDecreaseDisabled', max - 1 <= min);
        expect(result.current.rightCounter).toHaveProperty('isIncreaseDisabled', max >= MAX_FLIGHT_DURATION);
        expect(result.current.rightCounter).toHaveProperty(
            'ariaLabel',
            SitecoreDictionary.AccessibilityAriaLabelsFlightDurationMaxValue,
        );
    });

    it('should set flightDurationTo value on onChange of rightCounter', () => {
        const { result } = renderHook(() => useFlightDuration());

        const { flightDurationFrom: min } = mockStores.searchFiltersStore;

        const value = [min, 2];

        result.current.rightCounter.onChange(2);

        expect(mockStores.searchFiltersStore.setFlightDurationValue).toHaveBeenCalledWith(value, true);
        expect(mockStores.searchFiltersStore.onApply).toHaveBeenCalledTimes(1);
    });
});
