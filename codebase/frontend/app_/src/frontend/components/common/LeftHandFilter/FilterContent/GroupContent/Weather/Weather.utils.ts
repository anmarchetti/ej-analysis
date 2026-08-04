import { ChangeEvent, RefObject, useEffect, useRef, useState } from 'react';
import { toJS } from 'mobx';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { sortPrice } from 'frontend/utils/sort.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';

interface IWeatherInputFieldProps {
    autoComplete: string;
    className: string;
    max: number;
    min: number;
    onBlur: () => void;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void | boolean;
    ref: RefObject<HTMLInputElement>;
    type: string;
}

interface IUseFlightDurationFilterDataProps extends IComponentWithDictionary {
    fromField: IWeatherInputFieldProps;
    getFormattedTemperature: (value: number) => string;
    isDisabled: boolean;
    maxAvailableTemp: number;
    minAvailableTemp: number;
    slider: {
        getValue: (value: number) => string;
        max: number;
        min: number;
        onSlide: (values: number[]) => void;
        onSliding: (values: number[]) => void;
        step: number;
        values: number[];
    };
    toField: IWeatherInputFieldProps;
}

export const useWeather = (): IUseFlightDurationFilterDataProps => {
    const { setWeatherValue, weatherFrom, weatherTo, minAvailableTemp, maxAvailableTemp, getPhrase, onChange } =
        useStore(({ searchFiltersStore, layoutStore }) => ({
            setWeatherValue: searchFiltersStore.setWeatherValue,
            weatherFrom: searchFiltersStore.weatherFrom,
            weatherTo: searchFiltersStore.weatherTo,
            minAvailableTemp: searchFiltersStore.minAvailableTemp ?? 0,
            maxAvailableTemp: searchFiltersStore.maxAvailableTemp ?? 0,
            getPhrase: layoutStore.getPhrase,
            onChange: searchFiltersStore.onChange,
        }));

    const fromInputRef = useRef<HTMLInputElement>(null);
    const toInputRef = useRef<HTMLInputElement>(null);

    const [weatherValues, setWeatherValues] = useState([weatherFrom, weatherTo]);
    const [sliderValues, setSliderValues] = useState([weatherFrom ?? minAvailableTemp, weatherTo ?? maxAvailableTemp]);
    const [lastValueFrom, setLastValueFrom] = useState(weatherFrom);
    const [lastValueTo, setLastValueTo] = useState(weatherTo);

    useEffect(() => {
        updateInputsValues(weatherValues);
        updateSliderValues(weatherValues);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minAvailableTemp, maxAvailableTemp]);

    useEffect(() => {
        if (lastValueFrom !== weatherFrom || lastValueTo !== weatherTo) {
            setLastValueFrom(weatherFrom);
            setLastValueTo(weatherTo);
            updateBaseValues([weatherFrom, weatherTo]);
            updateInputsValues([weatherFrom, weatherTo]);
            updateSliderValues([weatherFrom, weatherTo]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastValueFrom, weatherFrom, lastValueTo, weatherTo]);

    const updateInputsValues = (values: (number | null)[]): void => {
        const sortedValues = sortPrice([...values]);
        const val0 = sortedValues[0];
        const val1 = sortedValues[1];

        if (fromInputRef.current) {
            const val = val0 ?? minAvailableTemp;
            fromInputRef.current.value = val.toString();
        }

        if (toInputRef.current) {
            const val = val1 ?? maxAvailableTemp;
            toInputRef.current.value = val.toString();
        }
    };

    const updateBaseValues = (values: (number | null)[]): void => {
        const val0 = values[0];
        const val1 = values[1];

        if (val0 !== null && (val0 <= minAvailableTemp || val0 >= maxAvailableTemp)) {
            values[0] = null;
        }

        if (val1 !== null && (val1 <= minAvailableTemp || val1 >= maxAvailableTemp)) {
            values[1] = null;
        }

        setWeatherValues(values);
    };

    const updateSliderValues = (values: (number | null)[]): void => {
        const sliderValues: number[] = [];
        const val0 = values[0];
        const val1 = values[1];

        sliderValues[0] = val0 ?? minAvailableTemp;
        sliderValues[1] = val1 ?? maxAvailableTemp;

        setSliderValues(sliderValues);
    };

    const onType = (e, isFrom): void => {
        const strVal: string = e.target.value;
        const newValues: (number | null)[] = toJS(weatherValues);
        const newSliderValues: (number | null)[] = toJS(sliderValues);

        const idx = isFrom ? 0 : 1;
        newValues[idx] = null;
        newSliderValues[idx] = null;

        if (strVal.length > 0) {
            const intVal = parseInt(strVal);

            if (intVal !== null) {
                newSliderValues[idx] = intVal;
            }

            if (intVal !== null && intVal >= minAvailableTemp && intVal <= maxAvailableTemp) {
                newValues[idx] = intVal;
            }
        }

        updateSliderValues(newSliderValues);
        updateBaseValues(newValues);
    };

    const onBlur = (): void => {
        updateStoreValue(weatherValues);
    };

    const onSlide = (values: number[]): void => {
        if (!isDisabled) {
            updateBaseValues(values);
            updateStoreValue(values);
            updateInputsValues(values);
            updateSliderValues(values);
        }
    };

    const onSliding = (values: number[]): void => {
        updateInputsValues(values);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            onBlur();
        }
    };

    const updateStoreValue = (values: (number | null)[], noUpdate?: boolean): void => {
        const sortedValues = sortPrice([...values]);

        if (weatherFrom === sortedValues[0] && weatherTo === sortedValues[1]) {
            noUpdate = true;
        }

        setLastValueFrom(sortedValues[0]);
        setLastValueTo(sortedValues[1]);
        setWeatherValue(sortedValues, true);

        if (!noUpdate) {
            onChange();
        }
    };

    const getNormalizedSliderValues = (): number[] => {
        const values = [...sliderValues];
        sortPrice(values);

        const val0 = values[0];
        const val1 = values[1];

        if (val0 < minAvailableTemp) {
            values[0] = minAvailableTemp;
        } else if (val0 > maxAvailableTemp) {
            values[0] = maxAvailableTemp;
        } else {
            values[0] = val0;
        }

        if (val1 < minAvailableTemp) {
            values[1] = minAvailableTemp;
        } else if (val1 > maxAvailableTemp) {
            values[1] = maxAvailableTemp;
        } else {
            values[1] = val1;
        }

        return values;
    };

    const getFormattedTemperature = (value: number): string =>
        Tokenizer.replaceToken(
            getPhrase(SitecoreDictionary.WeatherLabelsCelsiusDegreesWithNumber),
            Tokens.Number,
            value.toString(),
        );

    const isDisabled = maxAvailableTemp - minAvailableTemp <= 1;

    return {
        getPhrase,
        getFormattedTemperature,
        minAvailableTemp,
        maxAvailableTemp,
        isDisabled: isDisabled,
        slider: {
            step: 1,
            min: minAvailableTemp,
            max: maxAvailableTemp,
            values: getNormalizedSliderValues(),
            onSlide: onSlide,
            onSliding: onSliding,
            getValue: getFormattedTemperature,
        },
        fromField: {
            ref: fromInputRef,
            type: 'number',
            className: 'form-control__input',
            autoComplete: 'off',
            min: minAvailableTemp,
            max: maxAvailableTemp,
            onChange: e => onType(e, true),
            onKeyDown: e => onKeyDown(e),
            onBlur: onBlur,
        },
        toField: {
            ref: toInputRef,
            type: 'number',
            className: 'form-control__input',
            autoComplete: 'off',
            min: minAvailableTemp,
            max: maxAvailableTemp,
            onChange: e => onType(e, false),
            onKeyDown: e => onKeyDown(e),
            onBlur: onBlur,
        },
    };
};

export default useWeather;
