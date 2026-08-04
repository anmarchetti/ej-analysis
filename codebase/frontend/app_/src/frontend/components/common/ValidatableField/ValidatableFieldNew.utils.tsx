import { useState } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { BaseLayoutStore } from 'frontend/store/base';
import { IValidationError } from 'models/data/validation/IValidationError';
import { ValidationType } from 'models/enum/ValidationType';
import SVGTick from 'frontend/components/icons-new/Tick';

import styles from './ValidatableFieldNew.module.scss';

export interface IUseValidatableFieldProps {
    disabled: boolean;
    errors: IValidationError[];
    hideError: boolean;
    onChange: (value: string) => void;
    submitted: boolean;
    blurTransform?: (value: string) => string;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
    value?: string;
}

interface IUseValidatableFieldData {
    getPhrase: BaseLayoutStore['getPhrase'];
    hasError: boolean;
    isErrorShown: boolean;
    isTradePortal: boolean;
    onBlur: () => void;
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
    state: {
        blurred: boolean;
        focused: boolean;
        touched: boolean;
    };
    validIcon: React.ReactNode | null;
}

const useValidatableField = ({
    errors,
    value,
    disabled,
    onChange,
    hideError,
    submitted,
    blurTransform,
    onFocus,
}: IUseValidatableFieldProps): IUseValidatableFieldData => {
    const { getPhrase, isTradePortal } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        isTradePortal: stores.layoutStore.isTradePortal,
    }));

    const [state, setState] = useState({
        touched: false,
        blurred: false,
        focused: false,
    });

    const onChangeError = state.focused && !!value?.length && errors.some(i => i.trigger === ValidationType.OnType);
    const onSubmitError = submitted && !!errors.length;
    const onBlurError = state.touched && !state.focused && !!errors.length;

    const anyError = onChangeError || onSubmitError || onBlurError;

    const isValid = !errors.length && !!value;

    const validIcon = isValid ? (
        <span className={classNames(styles.validIcon, { [styles.disabled]: disabled })}>
            <SVGTick />
        </span>
    ) : null;

    const onBlur = (): void => {
        let currentValue = value?.trim() ?? '';

        if (blurTransform) {
            currentValue = blurTransform(currentValue);
        }

        if (value !== currentValue) {
            onChange(currentValue);
        }

        setState(prevState => ({ ...prevState, touched: true, blurred: true, focused: false }));
    };

    return {
        state,
        onBlur,
        onFocus: (e: React.FocusEvent<HTMLInputElement>): void => {
            onFocus?.(e);
            setState(prevState => ({ ...prevState, touched: true, blurred: false, focused: true }));
        },
        validIcon,
        getPhrase,
        hasError: anyError,
        isErrorShown: anyError && !hideError,
        isTradePortal,
    };
};

export default useValidatableField;
