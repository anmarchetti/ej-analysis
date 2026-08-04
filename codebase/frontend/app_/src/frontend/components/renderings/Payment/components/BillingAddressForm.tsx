import React, { useEffect, useMemo, useRef, useState } from 'react';
import equal from 'fast-deep-equal';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import validationService from 'frontend/services/validation.service';
import { BillingInfo } from 'models/data/payment/BillingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import SVGTick from 'frontend/components/icons-new/Tick';
import {
    gaClickEditBillingAddress,
    gaUpdatedEditBillingAddress,
} from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { usePaymentTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';

import styles from './BillingAddressForm.module.scss';

export interface IBillingAddressFormProps {
    isDisabled?: boolean;
    isOpen?: boolean;
}

const BillingAddressForm = (props: IBillingAddressFormProps) => {
    const {
        getPhrase,
        billingInfo,
        forceErrors,
        billingAddressBlokInFocus,
        toggleFocusBillingAddressBlock,
        highlightFields,
    } = useStore(stores => ({
        billingInfo: stores.payStore.billingInfo,
        forceErrors: stores.payStore.forceFieldErrors,
        billingAddressBlokInFocus: stores.payStore.billingAddressBlokInFocus,
        toggleFocusBillingAddressBlock: stores.payStore.toggleFocusBillingAddressBlock,
        highlightFields: stores.payStore.highlightFields,
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const initialStateRef = useRef<BillingInfo | null>(null);
    const billingAddressBlock = useRef<HTMLDivElement | null>(null);
    const { isDisabled, isOpen } = props;

    const [isEdit, setIsEdit] = useState(false);

    const { pushTrackingEvent } = usePaymentTracking();

    const editInfo = (e: React.SyntheticEvent) => {
        e.preventDefault();
        toggleEditMode(true);
        pushTrackingEvent(gaClickEditBillingAddress);
    };

    const toggleEditMode = (state: boolean) => {
        setIsEdit(state);

        if (state && !initialStateRef.current) {
            initialStateRef.current = new BillingInfo(
                billingInfo.fullName,
                billingInfo.address,
                billingInfo.city,
                billingInfo.postCode,
                billingInfo.address2,
            );
        }
    };

    const hasFormChanged = useMemo(() => {
        if (!initialStateRef.current) {
            return false;
        }

        const isChanged = !equal(initialStateRef.current, billingInfo);

        return isChanged;
    }, [billingInfo.fullName, billingInfo.address, billingInfo.city, billingInfo.postCode, billingInfo.address2]);

    useEffect(() => {
        if (isEdit && hasFormChanged) {
            pushTrackingEvent(gaUpdatedEditBillingAddress);
        }
    }, [isEdit, hasFormChanged]);

    useEffect(() => {
        if (isOpen) {
            toggleEditMode(true);
        }

        if (billingAddressBlokInFocus) {
            billingAddressBlock.current?.scrollIntoView({ behavior: 'smooth' });
        }

        toggleFocusBillingAddressBlock(false);
    }, [billingAddressBlokInFocus, isOpen]);

    return (
        <div ref={billingAddressBlock}>
            <h2 className='payment-subtitle'>{getPhrase(SitecoreDictionary.PaymentTitlesBillingAddress)}</h2>

            {(isEdit || isOpen || !billingInfo.isInfoPopulated) && !isDisabled ? (
                <div className='billing-address-fields d-block'>
                    <ValidatableField
                        onChange={value => billingInfo.onChange('fullName', value)}
                        id={'fullName'}
                        label={getPhrase(SitecoreDictionary.PaymentLabelsFullName)}
                        value={billingInfo.fullName}
                        errors={validationService.validateField(billingInfo, 'fullName')}
                        hasGroup={false}
                        fieldClass={styles.fieldError}
                        inputContainerClass='form-field__big-container'
                        autoComplete={false}
                        forceError={forceErrors}
                        highlighted={highlightFields}
                        shouldTrimOnBlur
                        isVertical
                    />
                    <ValidatableField
                        onChange={value => billingInfo.onChange('address', value)}
                        id={'address'}
                        label={getPhrase(SitecoreDictionary.PaymentLabelsAddress)}
                        value={billingInfo.address}
                        errors={validationService.validateField(billingInfo, 'address')}
                        hasGroup={false}
                        fieldClass={styles.fieldError}
                        inputContainerClass='form-field__big-container'
                        autoComplete={false}
                        forceError={forceErrors}
                        highlighted={highlightFields}
                        shouldTrimOnBlur
                        isVertical
                    />
                    <ValidatableField
                        onChange={value => billingInfo.onChange('address2', value)}
                        id={'address2'}
                        label={getPhrase(SitecoreDictionary.PaymentLabelsAddress2)}
                        value={billingInfo.address2}
                        errors={validationService.validateField(billingInfo, 'address2')}
                        hasGroup={false}
                        fieldClass={styles.fieldError}
                        inputContainerClass='form-field__big-container'
                        autoComplete={false}
                        forceError={forceErrors}
                        highlighted={highlightFields}
                        shouldTrimOnBlur
                        isVertical
                    />
                    <ValidatableField
                        onChange={value => billingInfo.onChange('city', value)}
                        id={'city'}
                        label={getPhrase(SitecoreDictionary.PaymentLabelsCity)}
                        value={billingInfo.city}
                        errors={validationService.validateField(billingInfo, 'city')}
                        hasGroup={false}
                        fieldClass={styles.fieldError}
                        inputContainerClass='form-field__big-container'
                        autoComplete={false}
                        forceError={forceErrors}
                        highlighted={highlightFields}
                        shouldTrimOnBlur
                        isVertical
                    />
                    <ValidatableField
                        onChange={value => billingInfo.onChange('postCode', value)}
                        id={'postCode'}
                        label={getPhrase(SitecoreDictionary.PaymentLabelsPostcode)}
                        value={billingInfo.postCode}
                        errors={validationService.validateField(billingInfo, 'postCode')}
                        hasGroup={false}
                        fieldClass={styles.fieldError}
                        inputContainerClass='form-field__big-container'
                        autoComplete={false}
                        forceError={forceErrors}
                        highlighted={highlightFields}
                        shouldTrimOnBlur
                        isVertical
                    />
                </div>
            ) : (
                <div className='row'>
                    <div className='col-md-6 col-lg-4'>
                        <div className='billing-address-box payment-rounded-block'>
                            <SVGTick />
                            <div data-tid='billing-address' className='flex-column'>
                                <div>{billingInfo.fullName}</div>
                                <div>{billingInfo.address}</div>
                                <div>{billingInfo.address2 && <>{billingInfo.address2}</>}</div>
                                <div>{billingInfo.city}</div>
                                <div>{billingInfo.postCode}</div>
                            </div>
                            {!isDisabled && (
                                <a href='#' onClick={editInfo} data-tid='edit-address-link'>
                                    {getPhrase(SitecoreDictionary.PaymentButtonsEditAddress)}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default observer(BillingAddressForm);
