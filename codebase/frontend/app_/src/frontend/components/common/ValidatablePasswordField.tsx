import * as React from 'react';
import classNames from 'classnames';
import { action, computed, makeObservable, observable } from 'mobx';
import { inject, observer } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { focusNextElementOnEnter } from 'frontend/utils/event.utils';
import { moveInputCursor } from 'frontend/utils/ui.utils';
import { IValidationError } from 'models/data/validation/IValidationError';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ValidationRule } from 'models/enum/ValidationRule';
import { ValidationType } from 'models/enum/ValidationType';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';
import { ValidationIcon } from 'frontend/components/common/ValidationIcon/ValidationIcon';
import ValidationIndicators from 'frontend/components/common/ValidationIndicators/ValidationIndicators';
import SVGHide from 'frontend/components/icons-new/Hide';
import SVGTick from 'frontend/components/icons-new/Tick';
import SVGView from 'frontend/components/icons-new/View';

interface IValidatablePasswordFieldProps extends IComponentWithDictionary {
    errors: IValidationError[];
    id: string;
    isTradePortal: boolean;
    label: string;
    onChange: (string: string, onFinish?: () => void) => void;
    trackValidation: (field: Nullable<string>, errorMessage: string) => void;
    autoComplete?: boolean;
    children?: any;
    containerClass?: string;
    disableValidationTraking?: boolean;
    disabled?: boolean;
    errorContainerClass?: string;
    fieldClass?: string;
    forceError?: boolean;
    hasGroup?: boolean;
    hasRevealIcon?: boolean;
    hasValidationIndicators?: boolean;
    iconToRender?: JSX.Element;
    inputClass?: string;
    inputContainerClass?: string;
    inputRef?: React.RefObject<HTMLInputElement>;
    isVertical?: boolean;
    name?: string;
    notShowValidIcon?: boolean;
    readonly?: boolean;
    required?: boolean;
    value?: string;
}

const PasswordIndicatorsMessages = [
    SitecoreDictionary.CreateAccountPasswordCriteriaLength,
    SitecoreDictionary.CreateAccountPasswordCriteriaNumber,
    SitecoreDictionary.CreateAccountPasswordCriteriaUppercaseLetter,
    SitecoreDictionary.CreateAccountPasswordCriteriaLowercaseLetter,
    SitecoreDictionary.CreateAccountPasswordCriteriaFirstCharacter,
    SitecoreDictionary.CreateAccountPasswordCriteriaSpecialCharacters,
];

export class ValidatablePasswordField extends React.Component<IValidatablePasswordFieldProps> {
    constructor(props: IValidatablePasswordFieldProps) {
        super(props);
        makeObservable(this);
    }

    private defaultInputClass = 'form-control__input';

    private innerInputRef = React.createRef<HTMLInputElement>();
    private inputContainerRef = React.createRef<HTMLDivElement>();

    @observable showPassword: boolean = false;

    @action toggleShowPassword = (state: boolean): void => {
        if (state && !this.props.value) {
            return;
        }

        this.showPassword = state;
    };

    @observable private isTouched: boolean = false;
    @observable private isBlurred: boolean = false;

    @action updateTouchField = (state: boolean): void => {
        this.isTouched = state;
    };

    @action private onBlur = (e?: React.FocusEvent<HTMLInputElement>): void => {
        // Don't update state, if next active element is inside input container
        const nextActiveElement = e?.relatedTarget || document.activeElement;

        if (
            this.inputContainerRef.current &&
            nextActiveElement &&
            this.inputContainerRef.current.contains(nextActiveElement as Node)
        ) {
            return;
        }

        this.isBlurred = true;
    };

    @action private onFocus = (): void => {
        this.isBlurred = false;
        this.updateTouchField(true);
    };

    private attachInputRef = (el: HTMLInputElement): void => {
        // set ref for using in component
        (this.innerInputRef as React.MutableRefObject<HTMLInputElement>).current = el;
        // set ref for props
        this.props.inputRef && ((this.props.inputRef as React.MutableRefObject<HTMLInputElement>).current = el);
    };

    private setFocusOnInput = (moveCursorToEnd: boolean = true): void => {
        const inputEl = this.innerInputRef.current;

        if (inputEl) {
            inputEl.focus();

            // Set cursor to the end of the input field
            if (moveCursorToEnd && this.props.value?.length) {
                moveInputCursor(inputEl, this.props.value.length);
            }
        }
    };

    private onRevealToogleClick = (e?: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        e?.preventDefault();
        this.toggleShowPassword(!this.showPassword);
        setTimeout(() => {
            this.setFocusOnInput();
        });
    };

    @computed private get fieldErrors(): IValidationError[] {
        if (this.props.forceError) {
            return this.props.errors;
        }

        if (!this.isTouched) {
            return [];
        }

        if (this.props.errors.length) {
            return this.props.errors.filter(
                el => el.trigger === ValidationType.OnType || (el.trigger === ValidationType.OnBlur && this.isBlurred),
            );
        }

        return [];
    }

    @computed private get errorMessage(): string {
        // If there are validation indicators, show only "Prohibited Words" error, all others errors will be inside the <ValidationIndicators />
        // If no indicators, show the first error in array.
        const error = this.props.hasValidationIndicators
            ? this.fieldErrors.find(e => e.rule === ValidationRule.ProhibitedWords)
            : this.fieldErrors[0];

        if (!error) return '';

        const message = this.props.getPhrase(error.errorMessage);

        if (!this.props.disableValidationTraking) {
            this.props.trackValidation(error.propertyName, message);
        }

        return message;
    }

    @computed private get hasErrors(): boolean {
        return !!this.fieldErrors.length;
    }

    @computed private get validated(): boolean {
        return !this.props.notShowValidIcon && (this.isTouched || !!this.props.value) && !this.props.errors.length;
    }

    private readonly onChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        this.props.onChange?.(event.target.value);
    };

    private get groupClass(): string {
        const { containerClass } = this.props;

        return classNames('form-group', this.hasErrors && 'error', containerClass);
    }

    private get fieldClass(): string {
        const { value, isTradePortal, isVertical = false, fieldClass = '' } = this.props;

        return classNames(
            !isVertical && 'row',
            isTradePortal && 'form-field__trade',
            'form-field',
            fieldClass,
            this.hasErrors && 'form-field--error',
            value && 'form-field--active',
        );
    }

    private get revealToggle(): JSX.Element {
        return (
            <Button
                isText
                className='form-control__icon'
                onClick={this.onRevealToogleClick}
                hasDisabledStyles={!this.props.value}
                aria-pressed={this.showPassword}
                aria-label={this.props.getPhrase(
                    this.showPassword
                        ? SitecoreDictionary.GuestDetailsButtonsHidePassword
                        : SitecoreDictionary.GuestDetailsButtonsShowPassword,
                )}
                id='revealToggle'
            >
                {this.showPassword ? <SVGHide /> : <SVGView />}
            </Button>
        );
    }

    private get field(): JSX.Element {
        const {
            value,
            id,
            disabled,
            required,
            readonly,
            label,
            isVertical = false,
            inputClass,
            inputContainerClass,
            errorContainerClass,
            autoComplete,
            name,
            hasRevealIcon = true,
            hasValidationIndicators = false,
        } = this.props;

        return (
            <div className={this.fieldClass}>
                <div
                    className={classNames(!isVertical && 'col-md-4', inputContainerClass)}
                    ref={this.inputContainerRef}
                >
                    <input
                        onKeyPress={event => focusNextElementOnEnter(event, `.${this.defaultInputClass}`)}
                        onChange={this.onChange}
                        onBlur={this.onBlur}
                        onFocus={this.onFocus}
                        type={this.showPassword ? 'text' : 'password'}
                        className={classNames(this.defaultInputClass, inputClass)}
                        id={id}
                        name={name}
                        value={value || ''}
                        key={this.props.id}
                        disabled={disabled}
                        required={required}
                        readOnly={readonly}
                        autoComplete={autoComplete ? 'on' : 'new-password'}
                        ref={this.attachInputRef}
                        data-tid='password-input'
                    />

                    <label className='form-control__label ' htmlFor={id}>
                        {label}
                    </label>
                    {hasRevealIcon
                        ? this.revealToggle
                        : this.props.iconToRender ||
                          (this.validated && (
                              <i className='form-control__icon'>
                                  <SVGTick />
                              </i>
                          ))}
                </div>
                {this.props.children}
                {!!this.errorMessage && (
                    <div
                        className={classNames(
                            !isVertical && !errorContainerClass && 'col-md-8',
                            isVertical && 'vertical__error',
                            'form-control__error',
                            errorContainerClass,
                        )}
                    >
                        <i className='form-control__error__icon'>
                            <ValidationIcon isTradePortal={this.props.isTradePortal} />
                        </i>
                        <span className='form-control__error__label'>{this.errorMessage}</span>
                    </div>
                )}
                {hasValidationIndicators && this.isTouched && (
                    <div className='col-md-12'>
                        <ValidationIndicators
                            title={this.props.getPhrase(SitecoreDictionary.CreateAccountPasswordCriteriaTitle)}
                            messages={PasswordIndicatorsMessages}
                            errors={this.props.errors}
                            hasFieldValue={!!value}
                            isFieldBlurred={this.isBlurred}
                        />
                    </div>
                )}
            </div>
        );
    }

    render() {
        const { hasGroup = true } = this.props;

        return hasGroup ? <div className={this.groupClass}>{this.field}</div> : this.field;
    }
}

const ConnectedValidatablePasswordField = inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    isTradePortal: stores.layoutStore.isTradePortal,
    trackValidation: stores.trackingStore.trackValidation,
}))(observer(class WrappedValidatablePasswordField extends ValidatablePasswordField {}));

export default ConnectedValidatablePasswordField;
