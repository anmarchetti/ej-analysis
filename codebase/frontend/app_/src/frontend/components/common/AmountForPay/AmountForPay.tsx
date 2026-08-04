import React, { Component, CSSProperties, ReactNode } from 'react';
import { action, autorun, computed, IReactionDisposer, makeObservable, observable, reaction } from 'mobx';
import { inject, observer } from 'mobx-react';

import { CurrencyCode, TrailingZeroDisplay } from 'code/currency';
import { ValidationConfig } from 'code/validation.config';
import validationService from 'frontend/services/validation.service';
import { MarketStore } from 'frontend/store/base';
import { IHolidaysStores } from 'frontend/store/holidays';
import { validate } from 'frontend/utils/validation.utils';
import { IValidationError } from 'models/data/validation/IValidationError';
import { IValidationRulesWithDictionary } from 'models/data/validation/IValidationRules';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ValidationRule } from 'models/enum/ValidationRule';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import RadioButton from 'frontend/components/common/RadioButton';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';

import styles from './AmountForPay.module.scss';

export interface IAmountForPayProps extends IComponentWithDictionary {
    currency: CurrencyCode | undefined;
    forceErrors: boolean;
    formatMoney: MarketStore['formatMoney'];
    fullAmount: number;
    getCurrencySymbol: MarketStore['getCurrencySymbol'];
    highlightFields: boolean;
    inFocus: boolean;
    onAmountChange: (amount: number) => void;
    toggleFocus: (state: boolean) => void;
    amount?: number;
    hideErrors?: boolean;
    hideTotalLabel?: boolean;
    inputShownAndSelected?: boolean; // immediately show input and remove any ability to select/deselect it
    isCredit?: boolean; // show different error message if credit
    isDisabled?: boolean;
    label?: string;
    onValidationChange?: (isValid: boolean) => void;
    residualBalance?: number;
    title?: string;
}

const amountConfig = ValidationConfig.paymentAmount;
const creditConfig = [...ValidationConfig.paymentAmount];

if (creditConfig[1]?.type === ValidationRule.MaxValue) {
    (creditConfig[1] as IValidationRulesWithDictionary).message = SitecoreDictionary.PaymentErrorMessagesCreditAmount;
}

enum AmountForPayState {
    Total = 'totalAmount',
    Other = 'otherAmount',
}

// TODO:(?) get all props from stores
@observer
export class AmountForPay extends Component<IAmountForPayProps> {
    constructor(props: IAmountForPayProps) {
        super(props);
        makeObservable(this);
    }

    config = ValidationConfig.paymentAmount;

    @validate(amountConfig) @observable paymentAmountRemaining: string = this.props.amount
        ? this.props.amount + ''
        : '';

    @validate(creditConfig) @observable paymentAmountCredit: string = ''; // another variable is used so we can use different error messages when used for credit input

    @computed get paymentAmount(): string {
        return !!this.props.isCredit ? this.paymentAmountCredit : this.paymentAmountRemaining;
    }

    set paymentAmount(amount: string) {
        if (!!this.props.isCredit) {
            this.paymentAmountCredit = amount;
        } else {
            this.paymentAmountRemaining = amount;
        }
    }

    @observable isInputShow: boolean = !!this.props.inputShownAndSelected;
    @observable isInputFocus: boolean = false;
    @observable isActiveRadioButton: AmountForPayState = this.props.inputShownAndSelected
        ? AmountForPayState.Other
        : AmountForPayState.Total;

    @observable forceError: boolean = false;

    private disposer: IReactionDisposer;
    private disposer2: IReactionDisposer;
    private inputBlock = React.createRef<HTMLDivElement>();

    @action setInputShow(value: boolean): void {
        this.isInputShow = value;
    }

    @action setActiveRadioButton(checkbox: AmountForPayState): void {
        this.isActiveRadioButton = checkbox;
    }

    @action onChangeAmount(value: string): void {
        this.paymentAmount = value;
    }

    @action onChangeInputFocus(value: boolean): void {
        this.isInputFocus = value;
    }

    @computed get amountErrors(): IValidationError[] {
        return this.isInputShow && !this.props.hideErrors
            ? validationService.validateField(
                  this,
                  !!this.props.isCredit ? 'paymentAmountCredit' : 'paymentAmountRemaining',
              )
            : [];
    }

    get currencySymbol(): string {
        return this.props.getCurrencySymbol(this.props.currency);
    }

    componentDidMount(): void {
        this.disposer = reaction(
            () => this.amountErrors.length > 0,
            isInvalid => {
                this.props.onValidationChange?.(!isInvalid);
            },
            {
                fireImmediately: true,
            },
        );

        this.disposer2 = autorun(() => {
            if (this.props.inFocus) {
                this.inputBlock.current?.scrollIntoView({ behavior: 'smooth' });
                this.props.toggleFocus(false);
            }
        });
    }

    componentWillUnmount(): void {
        this.disposer();
        this.disposer2();
    }

    @action onCheckboxHandler = (checkbox: AmountForPayState): void => {
        if (checkbox === AmountForPayState.Total) {
            this.setInputShow(false);
            this.props.onAmountChange(this.props.fullAmount);
            this.paymentAmount = '';
        } else if (checkbox === AmountForPayState.Other && checkbox !== this.isActiveRadioButton) {
            this.setInputShow(true);
            this.props.onAmountChange(0);
        }

        this.setActiveRadioButton(checkbox);
    };

    onInputChangeHandler = (value: string): void => {
        const regexpFloat = /^[+-]?\d+[,\.]?\d*$/;

        if (regexpFloat.test(value) || !value) {
            value = value.replace(/,/g, '.');

            this.onChangeAmount(value);
            this.props.onAmountChange(this.amountErrors.length == 0 ? Number.parseFloat(value || '0') : 0);
        }
    };

    render(): ReactNode {
        const {
            getPhrase,
            highlightFields,
            hideTotalLabel = false,
            isCredit = false,
            label,
            title,
            inputShownAndSelected = false,
        } = this.props;

        return (
            <div
                className={styles.amountBlock}
                ref={this.inputBlock}
                data-tid={`amount-block${isCredit ? '_credit' : ''}`}
            >
                {!inputShownAndSelected && (
                    <>
                        {title && <h2 className='payment-subtitle'>{title}</h2>}
                        <RadioButton
                            csMask
                            checked={this.isActiveRadioButton === AmountForPayState.Total}
                            label={
                                hideTotalLabel
                                    ? this.props.formatMoney(this.props.fullAmount, {
                                          currency: this.props.currency,
                                          trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                                      })
                                    : getPhrase(SitecoreDictionary.PaymentLabelsTotalAmount)
                            }
                            disabled={this.props.isDisabled}
                            onChange={() => this.onCheckboxHandler(AmountForPayState.Total)}
                            labelClass={hideTotalLabel ? 'amount__value' : ''}
                            dataTid='total-amount-radio'
                        >
                            {!hideTotalLabel && (
                                <span className='amount__value' data-cs-mask>
                                    {this.props.formatMoney(this.props.fullAmount, {
                                        currency: this.props.currency,
                                        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                                    })}
                                </span>
                            )}
                        </RadioButton>
                        <RadioButton
                            checked={this.isActiveRadioButton === AmountForPayState.Other}
                            label={getPhrase(SitecoreDictionary.PaymentLabelsOtherAmount)}
                            onChange={() => this.onCheckboxHandler(AmountForPayState.Other)}
                            disabled={this.props.isDisabled}
                            dataTid='other-amount-radio'
                        />
                    </>
                )}
                {this.isInputShow && (
                    <div
                        className={styles.amountFormGroup}
                        // Input left padding should include currency, use CSS variable to calculate it dynamically
                        style={{ '--currency-symbols': this.currencySymbol.length ?? 0 } as CSSProperties}
                    >
                        <ValidatableField
                            inputContainerClass={styles.amountInputContainer}
                            fieldClass={styles.fieldError}
                            label={label ?? getPhrase(SitecoreDictionary.PaymentLabelsAmountToPay)}
                            onChange={value => this.onInputChangeHandler(value)}
                            id={`paymentAmount${isCredit ? '_credit' : ''}`}
                            name={`paymentAmount${isCredit ? '_credit' : ''}`}
                            autoComplete={false}
                            isVertical
                            containerClass='col-md-6 col-lg-4'
                            value={this.paymentAmount}
                            errors={this.amountErrors}
                            inputMode='decimal'
                            onBlur={() => {
                                this.onChangeInputFocus(false);
                            }}
                            onFocus={() => {
                                this.onChangeInputFocus(true);
                            }}
                            forceError={this.props.forceErrors && !this.props.hideErrors}
                            highlighted={highlightFields}
                            Prefix={() =>
                                this.isInputFocus || this.paymentAmount ? (
                                    <span className={styles.currency}>{this.currencySymbol}</span>
                                ) : null
                            }
                            disabled={this.props.isDisabled}
                        />
                    </div>
                )}
            </div>
        );
    }
}

export default inject((stores: IHolidaysStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    forceErrors: stores.payStore.forceFieldErrors,
    onValidationChange: stores.payBalanceStore.onAmountPayValidChange,
    inFocus: stores.payBalanceStore.amountForPayInFocus,
    toggleFocus: stores.payBalanceStore.toggleFocusAmountForPay,
    highlightFields: stores.payStore.highlightFields,
    formatMoney: stores.marketStore.formatMoney,
    getCurrencySymbol: stores.marketStore.getCurrencySymbol,
}))(AmountForPay);
