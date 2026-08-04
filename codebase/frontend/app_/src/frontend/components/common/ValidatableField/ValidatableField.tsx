import * as React from 'react';
import classNames from 'classnames';
import { action, computed, IReactionDisposer, makeObservable, observable, reaction } from 'mobx';
import { inject, observer } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { focusNextElementOnEnter } from 'frontend/utils/event.utils';
import { moveInputCursor } from 'frontend/utils/ui.utils';
import { IValidationError } from 'models/data/validation/IValidationError';
import { ValidationType } from 'models/enum/ValidationType';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import { ValidationIcon } from 'frontend/components/common/ValidationIcon/ValidationIcon';
import SVGTick from 'frontend/components/icons-new/Tick';

import { getErrorText } from './validatableField.utils';

import styles from './ValidatableField.module.scss';

// Only props that can be passed to component
export interface IValidatableFieldProps {
    errors: IValidationError[];
    id: string;
    label: string;
    onChange: (string: string, onFinish?: () => void) => void;
    Prefix?: React.FC | null;
    autoComplete?: boolean;
    blockChange?: (value: string) => void;
    blurFilter?: RegExp;
    children?: any;
    containerClass?: string;
    customErrorClass?: string;
    disableValidationTraking?: boolean;
    disabled?: boolean;
    errorContainerClass?: string;
    fieldClass?: string;
    forceError?: boolean;
    hasDisabledFieldClass?: boolean;
    hasGroup?: boolean;
    hideErrorDetails?: boolean;
    highlighted?: boolean;
    iconToRender?: JSX.Element;
    inputClass?: string;
    inputContainerClass?: string;
    inputFilter?: RegExp;
    // Don't use 'number' type for numeric keyboard it breaks input.setSelectionRange call in moveInputCursor method use 'numeric' inputMode instead
    inputMode?: 'numeric' | 'text' | 'decimal' | 'tel' | 'email' | 'url' | 'search' | 'none';
    inputRef?: React.RefObject<HTMLInputElement>;
    isVertical?: boolean;
    labelClass?: string;
    maxLength?: number;
    name?: string;
    notShowValidIcon?: boolean;
    note?: any;
    onBlur?: () => void;
    onError?: (error: string) => void;
    onFocus?: () => void;
    onKeyDown?: (event: any) => void;
    optionalLabel?: string;
    readonly?: boolean;
    removeDefaultInputContainerClass?: boolean;
    required?: boolean;
    shouldMoveCursor?: boolean;
    shouldTrimOnBlur?: boolean;
    srLabel?: string;
    type?: 'text' | 'search' | 'password' | 'tel' | 'url';
    value?: string;
    watermark?: string;
}

// All props = props passed to component + props injected from stores
interface IValidatableFieldAllProps extends IValidatableFieldProps, IComponentWithDictionary {
    isTradePortal: boolean;
    trackValidation: (field: Nullable<string>, errorMessage: string) => void;
}

export class ValidatableField extends React.Component<IValidatableFieldAllProps> {
    constructor(props: IValidatableFieldAllProps) {
        super(props);
        makeObservable(this);
    }

    private defaultInputClass = 'form-control__input';

    @observable private isTouched: boolean = false;
    @observable private isBlurred: boolean = false;

    private disposer: IReactionDisposer;
    private moveCursor;

    componentDidMount(): void {
        // if there is onError callback, pass error to parent (useful if error should be rendered not in field, but somewhere else)
        if (!!this.props.onError) {
            this.disposer = reaction(
                () => this.firstError,
                error => this.props.onError?.(error),
                {
                    fireImmediately: true,
                },
            );
        }
    }

    componentDidUpdate(): void {
        this.props.shouldMoveCursor && this.isTouched && !this.isBlurred && this.moveCursor?.();
    }

    componentWillUnmount(): void {
        this.updateTouchField(false);
        this.disposer?.();
    }

    @action updateTouchField = (state: boolean): void => {
        this.isTouched = state;
    };

    @action private readonly onBlur = (): void => {
        this.isBlurred = true;
        this.moveCursor = null;
        this.props.shouldTrimOnBlur && this.setTrimmedValue();
        this.props.blurFilter &&
            this.props.value &&
            this.props.onChange(this.props.value.replace(this.props.blurFilter, ''));
        this.props.onBlur?.();
    };

    @action private readonly onFocus = (): void => {
        this.isBlurred = false;
        this.updateTouchField(true);
        this.props.onFocus?.();
    };

    @computed private get fieldErrors(): IValidationError[] {
        if (this.props.forceError) {
            return this.props.errors;
        }

        if (!this.isTouched) {
            return [];
        }

        if (this.props.errors?.length) {
            return this.props.errors.filter(
                el => el.trigger === ValidationType.OnType || (el.trigger === ValidationType.OnBlur && this.isBlurred),
            );
        }

        return [];
    }

    @computed private get firstError() {
        if (this.hasErrors) {
            const firstError = this.fieldErrors[0];

            if (!this.props.hideErrorDetails && !this.props.disableValidationTraking) {
                this.props.trackValidation(firstError.propertyName, firstError.errorMessage);
            }

            return getErrorText(firstError, this.props.getPhrase);
        }

        return '';
    }

    @computed private get hasErrors() {
        return !!this.fieldErrors.length;
    }

    @computed private get validated(): boolean {
        return (
            !this.props.notShowValidIcon &&
            !this.props.errors?.length &&
            !!this.props.value &&
            !(this.props.shouldTrimOnBlur && this.trimmedValue === '')
        );
    }

    @computed private get isHighlighted(): boolean {
        return !!this.props.highlighted && !!this.props.errors?.length && !this.isTouched;
    }

    private calculateStringStart = (start: number, newVal: string, oldVal: string, isBlocked: boolean) => {
        if (newVal === oldVal || isBlocked) {
            return start - 1;
        }

        return start;
    };

    private onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = event.target.value;
        let oldValue = this.props.value || '';

        if (this.props.inputFilter) {
            value = value.replace(this.props.inputFilter, '');
            oldValue = oldValue.replace(this.props.inputFilter, '');
        }

        const isBlocked = this.props.blockChange?.(value);
        const wasChanged = value !== oldValue;
        const target = event.target;
        const start = this.calculateStringStart(target.selectionStart || 0, value, oldValue, !!isBlocked);
        this.moveCursor = () => start < value.length && moveInputCursor(target, start);

        if (isBlocked || !wasChanged) {
            event.preventDefault();
            this.forceUpdate();

            return;
        }

        if (this.props.shouldMoveCursor) {
            this.props.onChange?.(value, () => this.forceUpdate());

            return;
        }

        this.props.onChange?.(value);
    };

    private setTrimmedValue() {
        return this.trimmedValue !== this.props.value && this.props.onChange?.(this.trimmedValue);
    }

    private get trimmedValue() {
        const { value } = this.props;

        return (!!value && typeof value === 'string' ? value.trim() : value) || '';
    }

    private get groupClass(): string {
        const { containerClass } = this.props;

        return classNames('form-group', this.hasErrors && 'error', containerClass);
    }

    private get fieldClass(): string {
        const { value, isVertical = false, fieldClass = '', hasDisabledFieldClass } = this.props;

        return classNames(
            !isVertical && 'row',
            this.props.isTradePortal && 'form-field__trade',
            'form-field',
            fieldClass,
            (this.hasErrors || this.isHighlighted) && 'form-field--error',
            value && 'form-field--active',
            hasDisabledFieldClass && 'form-field--disabled',
        );
    }

    onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        focusNextElementOnEnter(event, `.${this.defaultInputClass}`);
        this.props.onKeyDown?.(event);
    };

    private get field() {
        const {
            value,
            id,
            disabled,
            readonly,
            required,
            label,
            srLabel = this.props.label,
            isVertical = false,
            inputClass,
            autoComplete = true,
            inputContainerClass,
            removeDefaultInputContainerClass,
            errorContainerClass,
            name,
            inputRef,
            hideErrorDetails = false,
            Prefix,
            customErrorClass,
            note,
            maxLength,
        } = this.props;

        return (
            <>
                <div className={this.fieldClass} data-tid={id}>
                    <div
                        className={classNames(
                            !removeDefaultInputContainerClass && !isVertical && 'col-md-6 col-lg-4',
                            inputContainerClass,
                        )}
                    >
                        {!!Prefix && <Prefix />}
                        <input
                            onKeyDown={this.onKeyDown}
                            onChange={this.onChange}
                            onBlur={this.onBlur}
                            onFocus={this.onFocus}
                            type={this.props.type || 'text'}
                            inputMode={this.props.inputMode || 'text'}
                            autoComplete={autoComplete ? 'on' : 'off'}
                            className={classNames(this.defaultInputClass, inputClass)}
                            id={id}
                            value={value || ''}
                            disabled={disabled}
                            readOnly={readonly}
                            required={required}
                            aria-label={srLabel}
                            placeholder={this.props.watermark}
                            name={name}
                            ref={inputRef}
                            maxLength={maxLength}
                        />
                        <span className={classNames('form-control__label', this.props.labelClass, styles.label)}>
                            {label}
                        </span>

                        {this.props.optionalLabel && (
                            <div className='form-control__optional'>
                                <span>{this.props.optionalLabel}</span>
                            </div>
                        )}

                        {this.props.iconToRender ||
                            (this.validated && (
                                <i className={classNames('form-control__icon', this.props.disabled && 'disabled')}>
                                    <SVGTick />
                                </i>
                            ))}
                    </div>
                    {this.props.children}
                    {this.hasErrors && !hideErrorDetails && (
                        <div
                            data-tid='validatable-field-error'
                            className={
                                customErrorClass ||
                                classNames(
                                    !isVertical ? 'col-lg-8' : 'vertical__error',
                                    'form-control__error',
                                    errorContainerClass,
                                )
                            }
                        >
                            <i className='form-control__error__icon'>
                                <ValidationIcon isTradePortal={this.props.isTradePortal} />
                            </i>
                            <span className='form-control__error__label'>{this.firstError}</span>
                        </div>
                    )}
                </div>
                {note}
            </>
        );
    }

    render(): React.ReactNode {
        const { hasGroup = true } = this.props;

        return hasGroup ? <div className={this.groupClass}>{this.field}</div> : this.field;
    }
}

const ConnectedValidatableField = inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    isTradePortal: stores.layoutStore.isTradePortal,
    trackValidation: stores.trackingStore.trackValidation,
}))(observer(class WrappedValidatableField extends ValidatableField {}));

export default ConnectedValidatableField;
