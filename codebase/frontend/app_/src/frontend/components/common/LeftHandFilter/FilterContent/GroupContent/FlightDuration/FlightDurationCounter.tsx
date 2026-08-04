import { FC } from 'react';

import useStore from 'frontend/hooks/useStore';
import { MAX_FLIGHT_DURATION } from 'frontend/store/base/search/BaseSearchFilterStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SvgMinus from 'frontend/components/icons-new/Minus';
import SvgPlus from 'frontend/components/icons-new/Plus';

import styles from './FlightDuration.module.scss';

export interface IFlightDurationCounterProps {
    ariaLabel: SitecoreDictionary;
    isDecreaseDisabled: boolean;
    isIncreaseDisabled: boolean;
    onChange: (value: number) => void;
    step: number;
    value: number;
}

const FlightDurationCounter: FC<IFlightDurationCounterProps> = ({
    value,
    step,
    onChange,
    isIncreaseDisabled,
    isDecreaseDisabled,
    ariaLabel,
}) => {
    const { getPhrase } = useStore((stores: TStores) => ({ getPhrase: stores.layoutStore.getPhrase }));

    const updatedValue = value === MAX_FLIGHT_DURATION ? `${value}+` : value;

    return (
        <div className={styles.counter} data-tid='flight-duration-counter'>
            <button
                className={styles.round}
                onClick={(): void => onChange(value - step)}
                disabled={isDecreaseDisabled}
                aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsFlightDurationCounterMinus)}
                data-tid='flight-duration-counter-button-minus'
            >
                <SvgMinus />
            </button>
            <input
                data-tid='flight-duration-counter-value'
                aria-label={getPhrase(ariaLabel)}
                className={styles.input}
                readOnly
                value={updatedValue}
            />
            <button
                className={styles.round}
                onClick={(): void => onChange(value + step)}
                disabled={isIncreaseDisabled}
                aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsFlightDurationCounterPlus)}
                data-tid='flight-duration-counter-button-plus'
            >
                <SvgPlus />
            </button>
        </div>
    );
};

export default FlightDurationCounter;
