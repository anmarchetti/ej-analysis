import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IValidationError } from 'models/data/validation/IValidationError';
import { ValidationType } from 'models/enum/ValidationType';

import ValidationIndicator from './ValidationIndicator';

export interface IValidationIndicatorsProps {
    errors: IValidationError[];
    hasFieldValue: boolean;
    isFieldBlurred: boolean;
    messages: string[];
    title: string;
}

export const ValidationIndicators = ({
    title,
    messages,
    errors,
    hasFieldValue,
    isFieldBlurred,
}: IValidationIndicatorsProps) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const [indicators, setIndicators] = useState(() =>
        messages.map(message => ({ message, valid: null as Nullable<boolean> })),
    );

    const validateIndicators = () => {
        const validated = indicators.map(indicator => {
            const error = errors.find(e => e.errorMessage === indicator.message);
            let valid = indicator.valid;

            // Force update indicator state if indicator is not in default (null) state or field is blurred
            const forceUpdate = indicator.valid !== null || isFieldBlurred;

            if (!error) {
                // Set VALID state, if NO error and field has value.
                // Else set INVALID/default state (depends on forceUpdate)
                valid = hasFieldValue ? true : forceUpdate ? false : null;
            } else if (forceUpdate || (error.trigger === ValidationType.OnType && hasFieldValue)) {
                // Set INVALID if there is error and need to force update or error is triggered on touch.
                valid = false;
            }

            return { ...indicator, valid };
        });

        setIndicators(validated);
    };

    useEffect(() => {
        validateIndicators();
    }, [errors, hasFieldValue, isFieldBlurred]);

    return (
        <div className='validation-indicators'>
            <p className='validation-indicators__title'>{title}</p>
            <ul>
                {indicators.map((indicator, i) => (
                    <li key={i}>
                        <ValidationIndicator valid={indicator.valid} label={getPhrase(indicator.message)} />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default observer(ValidationIndicators);
