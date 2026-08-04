import { Ref, useCallback, useRef } from 'react';
import { Slider } from 'react-compound-slider';

import useStore from 'frontend/hooks/useStore';
import { MAX_FLIGHT_DURATION, MIN_FLIGHT_DURATION } from 'frontend/store/base/search/BaseSearchFilterStore';
import { debounce } from 'frontend/utils/debounce';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';

import { IFlightDurationCounterProps } from './FlightDurationCounter';

interface IUseFlightDurationFilterDataProps extends IComponentWithDictionary {
    leftCounter: IFlightDurationCounterProps;
    rightCounter: IFlightDurationCounterProps;
    slider: {
        max: number;
        min: number;
        onSlide: (values: number[]) => void;
        sliderRef: Ref<Slider<HTMLDivElement>>;
        step: number;
        values: number[];
    };
}

export const STEP = 0.5;

export const useFlightDuration = (): IUseFlightDurationFilterDataProps => {
    const sliderRef = useRef<Slider>(null);

    const {
        setFlightDurationValue,
        flightDurationFrom: from,
        flightDurationTo: to,
        getPhrase,
        onApply,
    } = useStore(stores => ({
        setFlightDurationValue: stores.searchFiltersStore.setFlightDurationValue,
        flightDurationFrom: stores.searchFiltersStore.flightDurationFrom,
        flightDurationTo: stores.searchFiltersStore.flightDurationTo,
        onApply: stores.searchFiltersStore.onApply,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const prevValidValues = useRef([from, to]);

    const onChange = useCallback((value: number[]) => {
        prevValidValues.current = value;

        setFlightDurationValue(value, true);
        onApply();
    }, []);

    const onSlide = useCallback(
        debounce(value => {
            const [min, max] = value;
            // isValid: since a 0.5-hour flight makes no sense, we check if 1-hour(s)+ difference is selected.
            const isValid = max - min >= 1;

            if (isValid) {
                onChange(value);
            } else {
                const slider = sliderRef?.current;

                if (!slider) return;

                slider.setState({
                    handles: slider.state.handles.map((item, idx) => ({
                        ...item,
                        val: prevValidValues.current[idx],
                    })),
                });
            }
        }, 300),
        [],
    );

    return {
        getPhrase,
        slider: {
            min: MIN_FLIGHT_DURATION,
            max: MAX_FLIGHT_DURATION,
            step: STEP,
            values: [from, to],
            onSlide,
            sliderRef,
        },
        leftCounter: {
            value: from,
            step: STEP,
            onChange: val => onChange([val, to]),
            isDecreaseDisabled: from <= MIN_FLIGHT_DURATION,
            isIncreaseDisabled: from + 1 >= to,
            ariaLabel: SitecoreDictionary.AccessibilityAriaLabelsFlightDurationMinValue,
        },
        rightCounter: {
            value: to,
            step: STEP,
            onChange: val => onChange([from, val]),
            isDecreaseDisabled: to - 1 <= from,
            isIncreaseDisabled: to >= MAX_FLIGHT_DURATION,
            ariaLabel: SitecoreDictionary.AccessibilityAriaLabelsFlightDurationMaxValue,
        },
    };
};

export default useFlightDuration;
