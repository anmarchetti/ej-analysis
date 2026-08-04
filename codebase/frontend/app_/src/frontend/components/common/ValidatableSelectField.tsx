import * as React from 'react';
import Select from 'react-select';
import classNames from 'classnames';
import { action, computed, makeObservable, observable } from 'mobx';
import { inject, observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ISelectOption } from 'models/data/ISelectOption';
import { IValidationError } from 'models/data/validation/IValidationError';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ValidationType } from 'models/enum/ValidationType';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import DropdownIndicator from 'frontend/components/common/Select/DropdownIndicator/DropdownIndicator';
import ValueContainer from 'frontend/components/common/Select/ValueContainer';
import { ValidationIcon } from 'frontend/components/common/ValidationIcon/ValidationIcon';

import CheckboxOption from './Select/CheckboxOption/CheckboxOption';
import ClearIndicator from './Select/ClearIndicator/ClearIndicator';
import MultiValueContainer from './Select/MultiValueContainer/MultiValueContainer';
import MultiValueLabel from './Select/MultiValueLabel/MultiValueLabel';
import MultiValueRemove from './Select/MultiValueRemove/MultiValueRemove';
import { customPortalStyles } from './ValidatableSelectField.utils';

interface IValidatableSelectFieldProps extends IComponentWithDictionary {
    errors: IValidationError[];
    id: string;
    label: string;
    onChange: (string: string, option?: ISelectOption) => void;
    options: ISelectOption[];
    trackValidation: (field: Nullable<string>, errorMessage: string) => void;
    Components?: Record<string, React.ComponentType<any> | null>;
    children?: any;
    defaultValue?: { label: string; value: string };
    disableValidationTraking?: boolean;
    disabled?: boolean;
    fieldClass?: string;
    filterOption?: any;
    forceError?: boolean;
    hasGroup?: boolean;
    inputValue?: string;
    isClearable?: boolean;
    isGroupBooking?: boolean;
    isLoading?: boolean;
    isMultiSelect?: boolean;
    isOptionDisabled?: (option: ISelectOption) => boolean;
    isSearchable?: boolean;
    isTradePortal?: boolean;
    isVertical?: boolean;
    loadingMessage?: () => string;
    multiValue?: string[];
    note?: any;
    onInputChange?: (inputValue: string, actionMeta: { action: string; prevInputValue: string }) => void;
    portal?: boolean;
    required?: boolean;
    srLabel?: string;
    value?: string;
}

export class ValidatableSelectField extends React.Component<IValidatableSelectFieldProps> {
    constructor(props: IValidatableSelectFieldProps) {
        super(props);
        makeObservable(this);
    }

    @observable private isTouched: boolean = false;
    @observable private isBlurred: boolean = false;

    @action private onBlur = () => {
        this.isBlurred = true;
    };

    @action private onFocus = () => {
        this.isBlurred = false;
        this.isTouched = true;
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

            if (!this.props.disableValidationTraking) {
                this.props.trackValidation(firstError.propertyName, firstError.errorMessage);
            }

            if (this.props.isGroupBooking) {
                return firstError.rawErrorMessage;
            }

            return this.props.getPhrase(firstError.errorMessage);
        }

        return '';
    }

    @computed private get hasErrors() {
        return !!this.fieldErrors.length;
    }

    private readonly onChange = (selectedOption: ISelectOption | null): void => {
        this.props.onChange?.((selectedOption?.value as string) || '', selectedOption as ISelectOption);
    };

    private get groupClass(): string {
        return classNames('form-group', this.hasErrors && 'error');
    }

    private get fieldClass(): string {
        const { value, isVertical = false, fieldClass = '' } = this.props;

        return classNames(
            !isVertical && 'row',
            this.props.isTradePortal && 'form-field__trade',
            'form-field',
            fieldClass,
            this.hasErrors && 'form-field--error',
            value && 'form-field--active',
            'gd-select-field-wrapper',
        );
    }

    private get value(): ISelectOption[] {
        if (this.props.onInputChange) {
            return this.props.inputValue ? [{ label: '', value: '' }] : [];
        }

        const valueFromOption = this.props.options.filter(
            el => this.toLowerCase(el.value) === this.toLowerCase(this.props.value),
        );

        if (!valueFromOption.length && this.props.defaultValue) {
            return [this.props.defaultValue];
        }

        return valueFromOption;
    }

    private get selectedValuesScreenReaderLabel(): string {
        const { isMultiSelect, multiValue, onInputChange, inputValue = '' } = this.props;

        if (onInputChange) return inputValue;

        const value = isMultiSelect ? multiValue?.join(', ') : this.value?.[0]?.label.toString();

        if (!value) {
            return this.props.getPhrase(SitecoreDictionary.AccessibilityAriaLabelsComboboxNoOptionSelected);
        }

        const dictionary =
            isMultiSelect && multiValue && multiValue?.length > 1
                ? SitecoreDictionary.AccessibilityAriaLabelsComboboxSelectedValues
                : SitecoreDictionary.AccessibilityAriaLabelsComboboxSelectedValue;

        return Tokenizer.replaceToken(this.props.getPhrase(dictionary), Tokens.Value, value);
    }

    private toLowerCase(str: string | number | undefined) {
        return (str || '').toString().toLowerCase();
    }

    private components = !this.props.isMultiSelect
        ? {
              DropdownIndicator,
              ValueContainer,
              ...this.props.Components,
          }
        : {
              DropdownIndicator,
              ValueContainer,
              MultiValueLabel,
              MultiValueContainer,
              MultiValueRemove,
              Option: CheckboxOption,
              ClearIndicator,
              ...this.props.Components,
          };

    private get field() {
        const {
            value,
            id,
            disabled,
            label,
            options,
            srLabel = this.props.label,
            isVertical = false,
            isSearchable = false,
            isClearable = false,
            isOptionDisabled,
            required,
            isMultiSelect,
            defaultValue,
            onInputChange,
            filterOption,
            isLoading,
            inputValue,
            loadingMessage,
        } = this.props;

        return (
            <div className={this.fieldClass} data-tid={id}>
                <div className={classNames({ 'col-md-6 col-lg-4': !isVertical }, 'gd-select-field')}>
                    <span id={`selected-options-screen-reader-${id}`} data-tid='screen-reader-label' className='d-none'>
                        {this.selectedValuesScreenReaderLabel}
                    </span>
                    <Select
                        styles={this.props.portal ? customPortalStyles : undefined}
                        instanceId={id}
                        isLoading={isLoading}
                        className='custom-select'
                        classNamePrefix='custom-select'
                        label={label}
                        options={options}
                        placeholder={label}
                        defaultValue={defaultValue || isMultiSelect ? this.props.multiValue || [] : value || ''}
                        onChange={isMultiSelect ? this.props.onChange : this.onChange}
                        onBlur={this.onBlur}
                        onFocus={this.onFocus}
                        onInputChange={onInputChange}
                        aria-label={srLabel}
                        isDisabled={disabled}
                        id={id}
                        isSearchable={isSearchable}
                        isClearable={isMultiSelect ? true : isClearable}
                        components={this.components}
                        inputValue={inputValue}
                        blurInputOnSelect={!isMultiSelect}
                        value={isMultiSelect ? this.props.multiValue : this.value}
                        required={required}
                        isOptionDisabled={isOptionDisabled}
                        isMulti={isMultiSelect}
                        hideSelectedOptions={false}
                        closeMenuOnSelect={!isMultiSelect}
                        menuPortalTarget={this.props.portal ? document.body : undefined}
                        filterOption={filterOption}
                        loadingMessage={loadingMessage}
                    />
                </div>
                {this.props.children}
                {this.hasErrors && (
                    <div
                        className={classNames(
                            isVertical ? 'vertical__error' : 'col-md-8',
                            'form-control__error',
                            'gd-select-field-error',
                        )}
                    >
                        <i className='form-control__error__icon'>
                            <ValidationIcon isTradePortal={this.props.isTradePortal} />
                        </i>
                        <span className='form-control__error__label'>{this.firstError}</span>
                    </div>
                )}
                {this.props.note}
            </div>
        );
    }

    render() {
        const { hasGroup = true } = this.props;

        return hasGroup ? <div className={this.groupClass}>{this.field}</div> : <>{this.field}</>;
    }
}

export default inject((stores: TStores) => ({
    isTradePortal: stores.layoutStore.isTradePortal,
    getPhrase: stores.layoutStore.getPhrase,
    trackValidation: stores.trackingStore.trackValidation,
}))(observer(ValidatableSelectField));
