import classNames from 'classnames';

import { IValidationError } from 'models/data/validation/IValidationError';
import { ValidationIcon } from 'frontend/components/common/ValidationIcon/ValidationIcon';

import { getErrorText } from './validatableField.utils';
import useValidatableField from './ValidatableFieldNew.utils';

import styles from './ValidatableFieldNew.module.scss';

interface IValidatableFieldNewProps {
    errors: IValidationError[];
    id: string;
    label: string;
    onChange: (value: string) => void;
    afterFieldRender?: React.ReactNode;
    ariaLabel?: string;
    autoComplete?: string;
    blurTransform?: (value: string) => string;
    children?:
        | React.ReactNode
        | (({ state }: { state: { blurred: boolean; focused: boolean; touched: boolean } }) => React.ReactNode);
    disabled?: boolean;
    fieldClassName?: string;
    hideError?: boolean;
    inputMode?: React.HTMLAttributes<HTMLElement>['inputMode'];
    maxLength?: number;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
    placeholder?: string;
    postfix?: React.ReactNode;
    prefix?: React.ReactNode;
    // validate outside, for example on click on continue button
    submitted?: boolean;
    type?: string;
    value?: string;
    vertical?: boolean;
}

const ValidatableFieldNew: React.FC<IValidatableFieldNewProps> = ({
    id,
    type = 'text',
    inputMode = 'text',
    label,
    value,
    placeholder,
    errors,
    onChange,
    disabled = false,
    children,
    prefix,
    postfix,
    afterFieldRender,
    vertical = false,
    hideError = false,
    ariaLabel,
    autoComplete = 'on',
    submitted = false,
    fieldClassName,
    maxLength,
    blurTransform,
    onFocus: onCustomFocus,
}) => {
    const { hasError, isErrorShown, state, onBlur, onFocus, validIcon, getPhrase, isTradePortal } = useValidatableField(
        {
            errors,
            value,
            disabled,
            onChange,
            hideError,
            submitted,
            blurTransform,
            onFocus: onCustomFocus,
        },
    );

    return (
        <div
            className={classNames(styles.wrapper, {
                [styles.active]: state.touched || !!value?.length,
                [styles.error]: hasError,
                [styles.focused]: state.focused,
                [styles.disabled]: disabled,
                // for scrollIntoErrors logic
                ['error']: hasError,
            })}
        >
            <div className={classNames(styles.content, { [styles.vertical]: vertical })}>
                <div className={styles.fieldWrapper}>
                    <div className={classNames(styles.field, fieldClassName)}>
                        {prefix}

                        <input
                            onChange={(e): void => onChange(e.target.value)}
                            className={styles.input}
                            id={id}
                            type={type}
                            inputMode={inputMode}
                            value={value || ''}
                            placeholder={placeholder}
                            onBlur={onBlur}
                            onFocus={onFocus}
                            aria-label={ariaLabel || label}
                            disabled={disabled}
                            data-tid='validatable-field-input'
                            autoComplete={autoComplete}
                            maxLength={maxLength}
                        />

                        <label htmlFor={id} className={classNames('form-control__label', styles.label)}>
                            {label}
                        </label>

                        {postfix || validIcon}
                    </div>

                    {afterFieldRender}
                </div>

                {isErrorShown && (
                    <div className={classNames(styles.errorWrapper)}>
                        <ValidationIcon isTradePortal={isTradePortal} />

                        <span className={styles.errorMsg}>{getErrorText(errors?.[0], getPhrase)}</span>
                    </div>
                )}
            </div>

            {typeof children === 'function' ? children({ state }) : children}
        </div>
    );
};

export default ValidatableFieldNew;
