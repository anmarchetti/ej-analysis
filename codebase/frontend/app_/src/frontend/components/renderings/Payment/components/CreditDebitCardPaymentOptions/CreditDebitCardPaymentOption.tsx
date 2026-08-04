import React, { FC, useEffect, useRef, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import { useMount } from 'frontend/hooks/useMount';
import useStore from 'frontend/hooks/useStore';
import validationService from 'frontend/services/validation.service';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getCardType } from 'frontend/utils/payment.utls';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { CardType } from 'models/enum/CardType';
import { PaymentType } from 'models/enum/PaymentType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Callout from 'frontend/components/common/Callout/Callout';
import { CardLogoComponent } from 'frontend/components/common/CreditCardLogoComponent/CardLogoComponent';
import RadioButtonNew from 'frontend/components/common/RadioButtonNew/RadioButtonNew';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import SvgAmericanExpressLogo from 'frontend/components/icons-new/AmericanExpressLogo';
import SvgMaestroLogo from 'frontend/components/icons-new/MaestroLogo';
import SvgMastercardLogo from 'frontend/components/icons-new/MastercardLogo';
import SvgVisaLogo from 'frontend/components/icons-new/VisaLogo';
import PaymentOptionWrapper from 'frontend/components/renderings/Payment/components/PaymentOptionWrapper/PaymentOptionWrapper';
import { gaCreditDebitCardPaymentOptionClicked } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { usePaymentTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';

import { getPaymentFormKey } from './CreditDebitCardPaymentOptions.utils';
import { IPaymentDetailsFormProps } from './interfaces';

import styles from './CreditDebitCardPaymentOption.module.scss';

const AMERICAN_EXPRESS_CARD_NUMBER_LENGTH = 15;
const REST_CARD_NUMBER_LENGTH = 16;
const LENGTH_CARD_EXPIRATION_DATE = 5;
const AMERICAN_EXPRESS_CVV_LENGTH = 4;
const REST_CARD_CVV_LENGTH = 3;
const EXPIRY_DATE_MONTH_VALUE = 2;
const EXPIRY_DATE_YEAR_VALUE = 4;
const FOUR_DIGIT_CVV = 4;
const THREE_DIGIT_CVV = 3;
const CARD_NUMBER_MASK_SPACE = {
    '4': 4,
    '8': 8,
    '10': 10,
    '12': 12,
    '15': 15,
    '16': 16,
};
const DIGIT_ONLY_REGEX = /\D/g;
const SPACE_OR_DASH_REGEX = /[ -]/g;
const CALLOUT_GAP_PX = 12;

// The input's rendered width can't be derived from CSS alone: it depends on which of several
// competing responsive width rules (bootstrap col-*, form-field__small-container) wins at a
// given breakpoint. Measuring it directly keeps the info icon hugging the input at any width.
const useCalloutOffset = (inputId: string, enabled = true): number | undefined => {
    const [offset, setOffset] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const inputEl = document.getElementById(inputId);

        if (!inputEl) {
            return;
        }

        const updateOffset = (): void => setOffset(inputEl.getBoundingClientRect().width + CALLOUT_GAP_PX);
        updateOffset();

        const resizeObserver = new ResizeObserver(updateOffset);
        resizeObserver.observe(inputEl);

        return () => resizeObserver.disconnect();
    }, [inputId, enabled]);

    return offset;
};

const CreditDebitCardPaymentOption: FC<IPaymentDetailsFormProps> = ({ fields, isDisabled }) => {
    const {
        cardInfo,
        forceErrors,
        paymentBlockInFocus,
        toggleFocusPaymentBlock,
        highlightFields,
        clearCardInfo,
        formRerenderTrigger,
        isAtcomError,
        getPhrase,
        paymentErrors,
        expirationDateWaterMask,
        selectedPaymentType,
        setSelectedPaymentType,
        paymentTypes,
    } = useStore((stores: IHolidaysStores) => ({
        cardInfo: stores.payStore.cardInfo,
        forceErrors: stores.payStore.forceFieldErrors,
        paymentBlockInFocus: stores.payStore.paymentBlockInFocus,
        toggleFocusPaymentBlock: stores.payStore.toggleFocusPaymentBlock,
        highlightFields: stores.payStore.highlightFields,
        clearCardInfo: stores.payStore.clearCardInfo,
        formRerenderTrigger: stores.payStore.formRerenderTrigger,
        isAtcomError: stores.payStore.isAtcomError,
        getPhrase: stores.layoutStore.getPhrase,
        paymentErrors: stores.payStore.paymentErrors,
        expirationDateWaterMask: stores.payStore.expirationDateWaterMask,
        selectedPaymentType: stores.paymentTypeStore.selectedPaymentType,
        setSelectedPaymentType: stores.paymentTypeStore.setSelectedPaymentType,
        paymentTypes: stores.paymentTypeStore.paymentTypes,
    }));

    const forceCardPaymentErrors = selectedPaymentType === PaymentType.Card && forceErrors;

    const { pushTrackingEvent } = usePaymentTracking();

    const cvvCalloutOffset = useCalloutOffset('cvv');
    const issueNumberCalloutOffset = useCalloutOffset('issueNumber', cardInfo.cardType === CardType.Maestro);

    const paymentBlock = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (paymentBlockInFocus) {
            paymentBlock.current?.scrollIntoView({ behavior: 'smooth' });
        }

        toggleFocusPaymentBlock(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentBlockInFocus]);

    useMount(() => clearCardInfo);

    const onChangeCardNumber = (value: string, onFinish?: () => void): void => {
        if (getCardType(value) !== cardInfo.cardType) {
            cardInfo.onChange('cvv', '');
        }

        const val = getFormattedByMaskCardNumber(value).replaceAll(SPACE_OR_DASH_REGEX, '');
        cardInfo.onChange('cardNumber', val);
        onFinish?.();
    };

    const onChangeExpiryDate = (value: string, onFinish?: () => void): void => {
        const separator = expirationDateWaterMask[2];

        const valueWithoutSeparator = value.replace(separator, '');
        let val = valueWithoutSeparator;

        if (val.length > EXPIRY_DATE_MONTH_VALUE) {
            val = `${valueWithoutSeparator.substring(
                0,
                EXPIRY_DATE_MONTH_VALUE,
            )}${separator}${valueWithoutSeparator.substring(EXPIRY_DATE_MONTH_VALUE, EXPIRY_DATE_YEAR_VALUE)}`;
        }

        cardInfo.onChange('expirationDate', val);
        onFinish?.();
    };

    const onChangeCvv = (value: string, onFinish?: () => void): void => {
        if (cardInfo.cardType === CardType.AmericanExpress || cardInfo.cardType === CardType.InvalidType) {
            cardInfo.onChange('cvv', value.substring(0, FOUR_DIGIT_CVV));
        } else {
            cardInfo.onChange('cvv', value.substring(0, THREE_DIGIT_CVV));
        }

        onFinish?.();
    };

    const cardNumber = (): string => getFormattedByMaskCardNumber(cardInfo.cardNumber);

    const blockInput = (value: string, maxLength?: () => number): boolean =>
        value.length > (maxLength ? maxLength() : 0);

    /**
     * Show card number according to mask
     * American Express - xxxx xxxxxx xxxxx
     * All other - xxxx xxxx xxxx xxxx
     */
    const getFormattedByMaskCardNumber = (val: string): string => {
        val = val.replaceAll(SPACE_OR_DASH_REGEX, '');

        return cardInfo.cardType === CardType.AmericanExpress
            ? `${val.substring(0, CARD_NUMBER_MASK_SPACE['4'])} ${val.substring(
                  CARD_NUMBER_MASK_SPACE['4'],
                  CARD_NUMBER_MASK_SPACE['10'],
              )} ${val.substring(CARD_NUMBER_MASK_SPACE['10'], CARD_NUMBER_MASK_SPACE['15'])}`.trim()
            : `${val.substring(0, CARD_NUMBER_MASK_SPACE['4'])} ${val.substring(
                  CARD_NUMBER_MASK_SPACE['4'],
                  CARD_NUMBER_MASK_SPACE['8'],
              )} ${val.substring(CARD_NUMBER_MASK_SPACE['8'], CARD_NUMBER_MASK_SPACE['12'])} ${val.substring(
                  CARD_NUMBER_MASK_SPACE['12'],
                  CARD_NUMBER_MASK_SPACE['16'],
              )}`.trim();
    };

    const onCreditCardPaymentTypeSelected = (): void => {
        if (selectedPaymentType !== PaymentType.Card) {
            pushTrackingEvent(gaCreditDebitCardPaymentOptionClicked);
        }

        setSelectedPaymentType(PaymentType.Card);
    };
    const multiplePaymentTypes = paymentTypes.length > 1;

    return (
        <PaymentOptionWrapper
            dataTid='card-payment-type-option'
            onSelect={onCreditCardPaymentTypeSelected}
            clickable={multiplePaymentTypes}
            ref={paymentBlock}
            variant='creditCard'
        >
            <div className={styles.creditCardDetails}>
                {multiplePaymentTypes && (
                    <RadioButtonNew
                        dataTid='card-payment-type'
                        label={fields?.CreditDebitCardLabel.value}
                        checked={selectedPaymentType === PaymentType.Card}
                        onChange={(): void => setSelectedPaymentType(PaymentType.Card)}
                        labelClass={styles.radioLabel}
                    />
                )}
                {!multiplePaymentTypes && <Text field={fields?.CreditDebitCardLabel} />}
                {/* Using key here to rerender fields on error */}
                <form
                    autoComplete='off'
                    key={getPaymentFormKey(paymentErrors, formRerenderTrigger)}
                    className={classNames(multiplePaymentTypes && styles.creditCardDetailsForm)}
                >
                    <ValidatableField
                        onChange={(value: string): void => cardInfo.onChange('nameOnCard', value)}
                        id='nameOnCard'
                        label={getPhrase(SitecoreDictionary.PaymentLabelsNameOnCard)}
                        value={cardInfo.nameOnCard}
                        errors={validationService.validateField(cardInfo, 'nameOnCard')}
                        autoComplete={false}
                        hasGroup={false}
                        fieldClass={styles.fieldError}
                        inputContainerClass={classNames(
                            'form-field__input-container form-field__big-container',
                            styles.inputContainerRelative,
                        )}
                        forceError={forceCardPaymentErrors}
                        highlighted={highlightFields}
                        disabled={isAtcomError || isDisabled}
                        shouldTrimOnBlur
                        hideErrorDetails={selectedPaymentType !== PaymentType.Card}
                        isVertical
                    />

                    <ValidatableField
                        onChange={onChangeCardNumber}
                        id='cardNumber'
                        label={getPhrase(SitecoreDictionary.PaymentLabelsCardNumber)}
                        value={cardNumber()}
                        errors={validationService.validateField(cardInfo, 'cardNumber')}
                        iconToRender={
                            cardInfo.cardType === CardType.InvalidType ? undefined : (
                                <i className={styles.cardLogoContainer} data-tid='card-logo-container'>
                                    <CardLogoComponent cardType={cardInfo.cardType} />
                                </i>
                            )
                        }
                        hasGroup={false}
                        fieldClass={styles.fieldError}
                        inputContainerClass={classNames(
                            'form-field__input-container form-field__big-container',
                            styles.inputContainerRelative,
                        )}
                        autoComplete={false}
                        forceError={forceCardPaymentErrors}
                        highlighted={highlightFields}
                        blockChange={(value: string): boolean =>
                            blockInput(value.replaceAll(SPACE_OR_DASH_REGEX, ''), () =>
                                getCardType(value) === CardType.AmericanExpress
                                    ? AMERICAN_EXPRESS_CARD_NUMBER_LENGTH
                                    : REST_CARD_NUMBER_LENGTH,
                            )
                        }
                        inputFilter={DIGIT_ONLY_REGEX}
                        disabled={isAtcomError || isDisabled}
                        shouldMoveCursor
                        inputMode='numeric'
                        hideErrorDetails={selectedPaymentType !== PaymentType.Card}
                        isVertical
                    />

                    {cardInfo.cardType === CardType.Maestro && (
                        <ValidatableField
                            onChange={(value: string): void => cardInfo.onChange('issueNumber', value)}
                            id='issueNumber'
                            label={getPhrase(SitecoreDictionary.PaymentLabelsIssueNumber)}
                            value={cardInfo.issueNumber}
                            errors={validationService.validateField(cardInfo, 'issueNumber')}
                            autoComplete={false}
                            hasGroup={false}
                            fieldClass={styles.fieldError}
                            inputContainerClass={classNames(
                                'col-md-3 col-7 form-field__small-container',
                                styles.inputContainerRelative,
                            )}
                            removeDefaultInputContainerClass
                            forceError={forceCardPaymentErrors}
                            highlighted={highlightFields}
                            inputFilter={DIGIT_ONLY_REGEX}
                            disabled={isAtcomError || isDisabled}
                            shouldMoveCursor
                            hideErrorDetails={selectedPaymentType !== PaymentType.Card}
                            isVertical
                        >
                            <div className={styles.calloutAnchor} style={{ left: issueNumberCalloutOffset }}>
                                <Callout
                                    content={
                                        <div
                                            style={{
                                                backgroundImage: `url(${cmsUrls.media(
                                                    fields?.IssueNumberInfo?.value?.src || '',
                                                )})`,
                                            }}
                                            className='callout__card-info'
                                        />
                                    }
                                    orientation={CalloutOrientation.Top}
                                    position={CalloutPosition.Center}
                                />
                            </div>
                        </ValidatableField>
                    )}

                    <ValidatableField
                        onChange={onChangeExpiryDate}
                        id='expirationDate'
                        label={getPhrase(SitecoreDictionary.PaymentLabelsExpirationDate)}
                        value={cardInfo.expirationDate}
                        fieldClass={styles.fieldError}
                        inputContainerClass={classNames(
                            'col-md-3 col-7 form-control__label--focused form-field__small-container',
                            styles.inputContainerRelative,
                        )}
                        removeDefaultInputContainerClass
                        watermark={expirationDateWaterMask}
                        autoComplete={false}
                        errors={validationService.validateField(cardInfo, 'expirationDate')}
                        hasGroup={false}
                        forceError={forceCardPaymentErrors}
                        highlighted={highlightFields}
                        blockChange={(value: string): boolean => blockInput(value, () => LENGTH_CARD_EXPIRATION_DATE)}
                        inputFilter={DIGIT_ONLY_REGEX}
                        disabled={isAtcomError || isDisabled}
                        shouldMoveCursor
                        inputMode='numeric'
                        hideErrorDetails={selectedPaymentType !== PaymentType.Card}
                        isVertical
                    />

                    <ValidatableField
                        onChange={onChangeCvv}
                        id='cvv'
                        label={getPhrase(SitecoreDictionary.PaymentLabelsCVV)}
                        value={cardInfo.cvv}
                        fieldClass={styles.fieldError}
                        inputContainerClass={classNames(
                            'col-md-3 col-7 form-field__small-container',
                            styles.inputContainerRelative,
                        )}
                        removeDefaultInputContainerClass
                        autoComplete={false}
                        errors={validationService.validateField(cardInfo, 'cvv')}
                        hasGroup={false}
                        forceError={forceCardPaymentErrors}
                        highlighted={highlightFields}
                        blockChange={(value: string): boolean =>
                            blockInput(value, () =>
                                cardInfo.cardType === CardType.InvalidType ||
                                cardInfo.cardType === CardType.AmericanExpress
                                    ? AMERICAN_EXPRESS_CVV_LENGTH
                                    : REST_CARD_CVV_LENGTH,
                            )
                        }
                        inputFilter={DIGIT_ONLY_REGEX}
                        disabled={isAtcomError || isDisabled}
                        shouldMoveCursor
                        inputMode='numeric'
                        hideErrorDetails={selectedPaymentType !== PaymentType.Card}
                        isVertical
                    >
                        <div className={styles.calloutAnchor} style={{ left: cvvCalloutOffset }}>
                            <Callout
                                content={
                                    <>
                                        <div
                                            style={{
                                                backgroundImage: `url(${
                                                    cardInfo.cardType === CardType.AmericanExpress
                                                        ? cmsUrls.media(fields?.CvvInfoAMEX?.value?.src || '')
                                                        : cmsUrls.media(fields?.CvvInfo?.value?.src || '')
                                                })`,
                                            }}
                                            className='callout__card-info'
                                        />
                                        <div className='callout__card-title'>
                                            {cardInfo.cardType === CardType.AmericanExpress
                                                ? getPhrase(SitecoreDictionary.PaymentLabelsCvvInfoAMEX)
                                                : getPhrase(SitecoreDictionary.PaymentLabelsCvvInfo)}
                                        </div>
                                    </>
                                }
                                orientation={CalloutOrientation.Top}
                                position={CalloutPosition.Center}
                            />
                        </div>
                    </ValidatableField>
                </form>
            </div>
            <div>
                <div className={styles.cardLogos} data-tid='card-logos'>
                    <SvgVisaLogo />
                    <SvgMastercardLogo />
                    <SvgAmericanExpressLogo />
                    <SvgMaestroLogo />
                </div>
            </div>
        </PaymentOptionWrapper>
    );
};

export default observer(CreditDebitCardPaymentOption);
