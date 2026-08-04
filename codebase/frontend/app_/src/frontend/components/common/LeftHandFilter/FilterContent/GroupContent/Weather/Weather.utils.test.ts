import React, { ChangeEvent, MutableRefObject } from 'react';
import { renderHook, waitFor } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import useWeather from './Weather.utils';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;

describe('useFlightDuration', () => {
    beforeEach(() => {
        jest.spyOn(React, 'useRef').mockReturnValue({ current: { value: '' } });
        mockStores = createMockStores({
            searchFiltersStore: {
                setWeatherValue: jest.fn(),
                weatherFrom: 10,
                weatherTo: 30,
                minAvailableTemp: 1,
                maxAvailableTemp: 40,
                onChange: jest.fn(),
            },
        });
    });

    it('should return standard values', () => {
        jest.spyOn(React, 'useRef').mockReturnValue({} as MutableRefObject<unknown>);

        const { result } = renderHook(() => useWeather());

        expect(result.current).toHaveProperty('getPhrase', mockStores.layoutStore.getPhrase);
        expect(result.current).toHaveProperty('getFormattedTemperature', expect.any(Function));
        expect(result.current).toHaveProperty('minAvailableTemp', 1);
        expect(result.current).toHaveProperty('maxAvailableTemp', 40);
        expect(result.current).toHaveProperty('isDisabled', false);

        expect(result.current.slider).toHaveProperty('step', 1);
        expect(result.current.slider).toHaveProperty('min', 1);
        expect(result.current.slider).toHaveProperty('max', 40);
        expect(result.current.slider).toHaveProperty('values', [10, 30]);
        expect(result.current.slider).toHaveProperty('onSlide', expect.any(Function));
        expect(result.current.slider).toHaveProperty('onSliding', expect.any(Function));
        expect(result.current.slider).toHaveProperty('getValue', expect.any(Function));
        expect(result.current.slider).toHaveProperty('getValue', expect.any(Function));

        expect(result.current.fromField).toHaveProperty('ref', {});
        expect(result.current.fromField).toHaveProperty('type', 'number');
        expect(result.current.fromField).toHaveProperty('className', 'form-control__input');
        expect(result.current.fromField).toHaveProperty('autoComplete', 'off');
        expect(result.current.fromField).toHaveProperty('min', 1);
        expect(result.current.fromField).toHaveProperty('max', 40);
        expect(result.current.fromField).toHaveProperty('onChange', expect.any(Function));
        expect(result.current.fromField).toHaveProperty('onKeyDown', expect.any(Function));
        expect(result.current.fromField).toHaveProperty('onBlur', expect.any(Function));

        expect(result.current.toField).toHaveProperty('ref', {});
        expect(result.current.toField).toHaveProperty('type', 'number');
        expect(result.current.toField).toHaveProperty('className', 'form-control__input');
        expect(result.current.toField).toHaveProperty('autoComplete', 'off');
        expect(result.current.toField).toHaveProperty('min', 1);
        expect(result.current.toField).toHaveProperty('max', 40);
        expect(result.current.toField).toHaveProperty('onChange', expect.any(Function));
        expect(result.current.toField).toHaveProperty('onKeyDown', expect.any(Function));
        expect(result.current.toField).toHaveProperty('onBlur', expect.any(Function));
    });

    it('should return disabled data when maxAvailableTemp is the same as minAvailableTemp', () => {
        mockStores.searchFiltersStore.maxAvailableTemp = 1;

        const { result } = renderHook(() => useWeather());

        expect(result.current).toHaveProperty('isDisabled', true);
    });

    it('should format temperature on getFormattedTemperature', () => {
        mockStores.layoutStore.getPhrase = jest.fn(p => `{number} ${p}`);

        const { result } = renderHook(() => useWeather());

        expect(result.current.getFormattedTemperature(10)).toBe(
            `10 ${SitecoreDictionary.WeatherLabelsCelsiusDegreesWithNumber}`,
        );
    });

    it('should update input values with 0 when weatherFrom, weatherTo, min and max temps are NOT provided', () => {
        mockStores.searchFiltersStore.weatherFrom = null;
        mockStores.searchFiltersStore.weatherTo = null;
        mockStores.searchFiltersStore.minAvailableTemp = null;
        mockStores.searchFiltersStore.maxAvailableTemp = null;

        const { result } = renderHook(() => useWeather());

        expect(result.current).toHaveProperty('minAvailableTemp', 0);
        expect(result.current).toHaveProperty('maxAvailableTemp', 0);

        expect(result.current.fromField).toHaveProperty('ref', { current: { value: '0' } });
        expect(result.current.fromField).toHaveProperty('min', 0);
        expect(result.current.fromField).toHaveProperty('max', 0);

        expect(result.current.toField).toHaveProperty('ref', { current: { value: '0' } });
        expect(result.current.toField).toHaveProperty('min', 0);
        expect(result.current.toField).toHaveProperty('max', 0);
    });

    it('should update values to new values', () => {
        const { result, rerender } = renderHook(() => useWeather());

        expect(result.current.slider).toHaveProperty('values', [10, 30]);

        mockStores.searchFiltersStore.weatherFrom = 15;
        mockStores.searchFiltersStore.weatherTo = 25;

        rerender();

        expect(result.current.slider).toHaveProperty('values', [15, 25]);
    });

    it('should update values to new values and switch their places when min > max', () => {
        const { result, rerender } = renderHook(() => useWeather());

        expect(result.current.slider).toHaveProperty('values', [10, 30]);

        mockStores.searchFiltersStore.weatherFrom = 25;
        mockStores.searchFiltersStore.weatherTo = 15;

        rerender();

        expect(result.current.slider).toHaveProperty('values', [15, 25]);
    });

    it('should update values to min and max when new values are outside bounds', () => {
        const { result, rerender } = renderHook(() => useWeather());

        expect(result.current.slider).toHaveProperty('values', [10, 30]);

        mockStores.searchFiltersStore.weatherFrom = -10;
        mockStores.searchFiltersStore.weatherTo = 50;

        rerender();

        expect(result.current.slider).toHaveProperty('values', [1, 40]);
    });

    it('should update values to min when both values are below min temp', () => {
        const { result, rerender } = renderHook(() => useWeather());

        expect(result.current.slider).toHaveProperty('values', [10, 30]);

        mockStores.searchFiltersStore.weatherFrom = -10;
        mockStores.searchFiltersStore.weatherTo = -10;

        rerender();

        expect(result.current.slider).toHaveProperty('values', [1, 1]);
    });

    it('should update from value on from field type and blur', () => {
        const { result } = renderHook(() => useWeather());

        expect(result.current.slider).toHaveProperty('values', [10, 30]);

        result.current.fromField.onChange({ target: { value: '5' } } as ChangeEvent<HTMLInputElement>);
        result.current.fromField.onBlur();

        expect(mockStores.searchFiltersStore.setWeatherValue).toHaveBeenCalledWith([5, 30], true);
        expect(mockStores.searchFiltersStore.onChange).toHaveBeenCalled();
    });

    it('should update from value on from field type and enter click', () => {
        const { result } = renderHook(() => useWeather());

        expect(result.current.slider).toHaveProperty('values', [10, 30]);

        result.current.fromField.onChange({ target: { value: '5' } } as ChangeEvent<HTMLInputElement>);
        result.current.fromField.onKeyDown({ key: 'Enter' } as React.KeyboardEvent<HTMLInputElement>);

        expect(mockStores.searchFiltersStore.setWeatherValue).toHaveBeenCalledWith([5, 30], true);
        expect(mockStores.searchFiltersStore.onChange).toHaveBeenCalled();
    });

    it('should update to value on to field type and blur', () => {
        const { result } = renderHook(() => useWeather());

        expect(result.current.slider).toHaveProperty('values', [10, 30]);

        result.current.toField.onChange({ target: { value: '35' } } as ChangeEvent<HTMLInputElement>);
        result.current.toField.onBlur();

        expect(mockStores.searchFiltersStore.setWeatherValue).toHaveBeenCalledWith([10, 35], true);
        expect(mockStores.searchFiltersStore.onChange).toHaveBeenCalled();
    });

    it('should update to value on to field type and enter click', () => {
        const { result } = renderHook(() => useWeather());

        expect(result.current.slider).toHaveProperty('values', [10, 30]);

        result.current.toField.onChange({ target: { value: '35' } } as ChangeEvent<HTMLInputElement>);
        result.current.toField.onKeyDown({ key: 'Enter' } as React.KeyboardEvent<HTMLInputElement>);

        expect(mockStores.searchFiltersStore.setWeatherValue).toHaveBeenCalledWith([10, 35], true);
        expect(mockStores.searchFiltersStore.onChange).toHaveBeenCalled();
    });

    it('should NOT update values on type and blur when values did NOT change', () => {
        const { result } = renderHook(() => useWeather());

        expect(result.current.slider).toHaveProperty('values', [10, 30]);

        result.current.fromField.onChange({ target: { value: '10' } } as ChangeEvent<HTMLInputElement>);
        result.current.fromField.onBlur();
        result.current.toField.onChange({ target: { value: '30' } } as ChangeEvent<HTMLInputElement>);
        result.current.toField.onBlur();

        expect(mockStores.searchFiltersStore.setWeatherValue).toHaveBeenCalledTimes(2);
        expect(mockStores.searchFiltersStore.onChange).not.toHaveBeenCalled();
    });

    it.skip('should update values onSlide', async () => {
        // TODO fix React v18
        const { result } = renderHook(() => useWeather());

        expect(result.current.slider).toHaveProperty('values', [10, 30]);

        result.current.slider.onSlide([15, 25]);

        await waitFor(() => {
            expect(result.current.slider).toHaveProperty('values', [15, 25]);
        });
    });

    it('should NOT update values onSlide when isDisabled is true', () => {
        mockStores.searchFiltersStore.maxAvailableTemp = 1;

        const { result } = renderHook(() => useWeather());

        expect(result.current.slider).toHaveProperty('values', [1, 1]);

        result.current.slider.onSlide([15, 25]);

        expect(result.current.slider).toHaveProperty('values', [1, 1]);
    });

    it('should update input values onSliding', () => {
        const { result } = renderHook(() => useWeather());

        expect(result.current.toField).toHaveProperty('ref', { current: { value: '30' } });

        result.current.slider.onSliding([10, 25]);

        expect(result.current.toField).toHaveProperty('ref', { current: { value: '25' } });
    });

    it('should update values on max and minAvailableTemp  change', () => {
        mockStores.searchFiltersStore.weatherTo = null;
        mockStores.searchFiltersStore.weatherFrom = null;

        const { result, rerender } = renderHook(() => useWeather());

        expect(result.current.slider).toHaveProperty('values', [1, 40]);

        mockStores.searchFiltersStore.maxAvailableTemp = 10;

        rerender();

        expect(result.current.slider).toHaveProperty('values', [1, 10]);

        mockStores.searchFiltersStore.minAvailableTemp = 5;

        rerender();

        expect(result.current.slider).toHaveProperty('values', [5, 10]);
    });
});
