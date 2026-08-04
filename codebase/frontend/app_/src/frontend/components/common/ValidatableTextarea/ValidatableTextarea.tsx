import React, { useMemo, useState } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IValidationError } from 'models/data/validation/IValidationError';
import { ValidationType } from 'models/enum/ValidationType';
import { ValidationIcon } from 'frontend/components/common/ValidationIcon/ValidationIcon';
import SVGTick from 'frontend/components/icons-new/Tick';

import { getCharactersRemainingLabel } from './utils';

export interface IValidatableTextareaProps {
    errors: IValidationError[];
    id: string;
    label: string;
    onChange: (string: string, onFinish?: () => void) => void;
    blockChange?: (value: string) => void;
    blurFilter?: RegExp;
    disabled?: boolean;
    forceError?: boolean;
    hideErrorDetails?: boolean;
    highlighted?: boolean;
    iconToRender?: JSX.Element;
    inputFilter?: RegExp;
    isTradePortal?: boolean;
    isVertical?: boolean;
    maxCharacters?: number;
    name?: string;
    notShowValidIcon?: boolean;
    onFocus?: () => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    required?: boolean;
    shouldTrimOnBlur?: boolean;
    textareaClass?: string;
    value?: string;
}

export const ValidatableTextarea = (props: IValidatableTextareaProps) => {
    const { getPhrase, isTradePortal, trackValidation, getFormattedNumber } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isTradePortal: stores.layoutStore.isTradePortal,
        trackValidation: stores.trackingStore.trackValidation,
        getFormattedNumber: stores.marketStore.getFormattedNumber,
    }));

    const [isTouched, setIsTouched] = useState(false);
    const [isBlurred, setIsBlurred] = useState(false);

    const {
        value,
        id,
        required,
        label,
        isVertical = false,
        textareaClass,
        name,
        disabled,
        hideErrorDetails = false,
        maxCharacters,
        placeholder,
        onKeyDown,
    } = props || {};

    const [textAreaCount, setTextAreaCount] = useState(maxCharacters);

    const charactersRemainingLabel = useMemo(
        () => getCharactersRemainingLabel(textAreaCount, getPhrase, getFormattedNumber),
        [textAreaCount],
    );

    if (!props) {
        return null;
    }

    const getFieldErrors = (): IValidationError[] => {
        if (props.forceError) {
            return props.errors;
        }

        if (!isTouched) {
            return [];
        }

        if (props.errors?.length) {
            return props.errors.filter(
                el => el.trigger === ValidationType.OnType || (el.trigger === ValidationType.OnBlur && isBlurred),
            );
        }

        return [];
    };

    const isHasErrors = !!getFieldErrors().length;

    const isHighlighted = !!props.highlighted && !!props.errors?.length && !isTouched;

    const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        let value = event.target.value;
        let oldValue = props.value || '';

        if (props.inputFilter) {
            value = value.replace(props.inputFilter, '');
            oldValue = oldValue.replace(props.inputFilter, '');
        }

        const isBlocked = props.blockChange?.(value);
        const wasChanged = value !== oldValue;

        if (isBlocked || !wasChanged) {
            event.preventDefault();

            return;
        }

        if (maxCharacters) {
            remainingCharacters(value.length);
        }

        props.onChange?.(value);
    };

    const trimmedValue = (!!props.value && typeof props.value === 'string' ? props.value.trim() : props.value) || '';

    const isValidated =
        !props.notShowValidIcon &&
        !props.errors?.length &&
        !!props.value &&
        !(props.shouldTrimOnBlur && trimmedValue === '');

    const getFirstError = () => {
        if (isHasErrors) {
            const firstError = getFieldErrors()[0];

            if (!props.hideErrorDetails) {
                trackValidation(firstError.propertyName, firstError.errorMessage);
            }

            return firstError.rawErrorMessage ? firstError.rawErrorMessage : getPhrase(firstError.errorMessage);
        }

        return '';
    };

    const updateTouchField = (state: boolean) => {
        setIsTouched(state);
    };

    const onFocus = () => {
        setIsBlurred(false);
        updateTouchField(true);
        props.onFocus?.();
    };

    const onBlur = () => {
        setIsBlurred(true);
    };

    const remainingCharacters = (charLimit: number) => {
        if (!maxCharacters) {
            return;
        }

        const remaining = maxCharacters - charLimit;
        setTextAreaCount(remaining);
    };

    return (
        <div
            className={classNames(
                !isVertical && 'row',
                isTradePortal && 'form-field__trade',
                'form-field form-field__textarea',
                (isHasErrors || isHighlighted) && 'form-field--error error',
                props.value && 'form-field--active',
            )}
            data-tid={id}
        >
            <div className={classNames(!isVertical && 'col-md-6 col-lg-4')}>
                <textarea
                    id={id}
                    className={classNames('form-control__input', textareaClass)}
                    onChange={onChange}
                    value={value}
                    required={required}
                    disabled={disabled}
                    name={name}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    maxLength={maxCharacters}
                    placeholder={!isBlurred && isTouched ? placeholder : ''}
                    onKeyDown={onKeyDown}
                    data-tid={`${id}-text-area`}
                />
                <label className={classNames('form-control__label')} htmlFor={id}>
                    {label}
                </label>
                {props.iconToRender ||
                    (isValidated && (
                        <i className={classNames('form-control__icon', props.disabled && 'disabled')}>
                            <SVGTick />
                        </i>
                    ))}
            </div>
            {maxCharacters && <div className='form-control__remaining'>{charactersRemainingLabel}</div>}
            {isHasErrors && !hideErrorDetails && (
                <div className={classNames(!isVertical ? 'col-lg-8' : 'vertical__error', 'form-control__error')}>
                    <i className='form-control__error__icon'>
                        <ValidationIcon isTradePortal={isTradePortal} />
                    </i>
                    <span className='form-control__error__label'>{getFirstError()}</span>
                </div>
            )}
        </div>
    );
};

export default ValidatableTextarea;
