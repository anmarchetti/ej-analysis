import React, { FC, FormEvent, MouseEvent, useState } from 'react';
import { AxiosError } from 'axios';
import { observer } from 'mobx-react';

import { PROMOCODE_INVALID_CHARS } from 'code/validation.config';
import useStore from 'frontend/hooks/useStore';
import creditManagementService from 'frontend/services/creditManagement.service';
import { IHolidaysStores, isHolidayStore } from 'frontend/store/holidays';
import { ApiError } from 'models/data/ApiError';
import { IApiErrorData } from 'models/data/ApiErrorData';
import { ApiErrors } from 'models/enum/ApiErrors';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { VoucherTypes } from 'models/enum/VoucherTypes';
import Button from 'frontend/components/common/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import SvgCross from 'frontend/components/icons-new/Cross';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import PromocodeErrors from 'frontend/components/renderings/PromocodeInput/components/PromocodeErrors/PromocodeErrors';

import styles from './PromocodeForm.module.scss';

export const PROMOCODE_FORM_ID = 'promoCodeForm';

export interface IPromocodeFormProps {
    clearPromo: () => void;
    codeFromInput: string;
    label: string;
    setCodeFromInput: (code: string) => void;
    tooltipText: string;
}

export const PromocodeForm: FC<IPromocodeFormProps> = ({
    codeFromInput,
    label,
    tooltipText,
    setCodeFromInput,
    clearPromo,
}) => {
    const {
        isPromocodeApplying,
        promocodeForceError,
        promocodeValidationErrors,
        setIsPromocodeApplying,
        clearPromocodeError,
        onPromocodeErrorCallback,
        onApply,
        getPhrase,
        isPromoCodeTemporarilyDisabled,
        cleanupRedeemStore,
        initiateVoucherExtrasFlow,
    } = useStore((stores: IHolidaysStores) => ({
        isPromocodeApplying: stores.bookingStore.promoCode.isPromocodeApplying,
        promocodeForceError: stores.bookingStore.promoCode.promocodeForceError,
        promocodeValidationErrors: stores.bookingStore.promoCode.promocodeValidationErrors,
        setIsPromocodeApplying: stores.bookingStore.promoCode.setIsPromocodeApplying,
        clearPromocodeError: stores.bookingStore.promoCode.clearPromocodeError,
        onPromocodeErrorCallback: stores.bookingStore.promoCode.onPromocodeErrorCallback,
        onApply: stores.bookingStore.onApplyPromoCode,
        getPhrase: stores.layoutStore.getPhrase,
        isPromoCodeTemporarilyDisabled: isHolidayStore(stores) && !stores.holidayCreditStore.isCreditEnabledApiSettings,
        cleanupRedeemStore: isHolidayStore(stores) && stores.redeemVoucherStore.cleanupRedeemStore,
        initiateVoucherExtrasFlow: isHolidayStore(stores) && stores.redeemVoucherStore.initiateVoucherExtrasFlow,
    }));

    const [errorText, setErrorText] = useState<string | undefined>('');

    const onApplyPromo = async (event?: MouseEvent | FormEvent): Promise<void> => {
        event?.preventDefault();

        if (!codeFromInput || isPromocodeApplying) {
            return;
        }

        const onError = (e: ApiError): void => {
            onPromocodeErrorCallback(e);
            cleanupRedeemStore && cleanupRedeemStore();
            setIsPromocodeApplying(false);
        };

        // Throw Not Found error if promocode contains invalid characters (https://jira.build.easyjet.com/browse/EJH-15319)
        if (PROMOCODE_INVALID_CHARS.test(codeFromInput)) {
            onError(
                new ApiError({
                    response: { data: { code: ApiErrors.WrongDiscountNotFound } },
                } as AxiosError<IApiErrorData>),
            );

            return;
        }

        try {
            setIsPromocodeApplying(true);

            const res = await creditManagementService.validateVoucherCode(codeFromInput);
            const onFinishApply = (): void => {
                setIsPromocodeApplying(false);
            };

            if (res.voucherType === VoucherTypes.PromoVoucher) {
                onApply(codeFromInput, onFinishApply, onPromocodeErrorCallback);
            } else if (res.voucherType === VoucherTypes.GiftVoucher && initiateVoucherExtrasFlow) {
                clearPromocodeError();
                await initiateVoucherExtrasFlow(res);
                onFinishApply();
            }
        } catch (e) {
            onError(e);
        }
    };

    const onChange = (value: string): void => {
        if (promocodeForceError || (!value && promocodeValidationErrors.length > 0)) {
            clearPromocodeError();
        }

        setCodeFromInput(value);
    };

    return (
        <form className={styles.form} onSubmit={onApplyPromo} id={PROMOCODE_FORM_ID}>
            <div className={styles.controls}>
                <div className={styles.fieldWrap}>
                    <ValidatableField
                        label={label}
                        value={codeFromInput}
                        onChange={onChange}
                        id='promoCode'
                        name='promoCode'
                        autoComplete={false}
                        isVertical
                        errors={promocodeValidationErrors}
                        notShowValidIcon
                        forceError={promocodeForceError}
                        onError={setErrorText}
                        hideErrorDetails
                        iconToRender={
                            !!promocodeValidationErrors.length && (
                                <Button className='btn-clear-input' isText onClick={clearPromo}>
                                    <SvgCross />
                                </Button>
                            )
                        }
                        disabled={isPromoCodeTemporarilyDisabled}
                    />
                    {tooltipText && (
                        <div className={styles.tooltipWrapper}>
                            <Tooltip>
                                <TooltipTrigger className={styles.icon} />
                                <TooltipContent>
                                    <div>{tooltipText}</div>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    )}
                </div>
                {isPromoCodeTemporarilyDisabled && (
                    <div className={styles.error}>
                        <SvgWarningFilled />
                        <span>{getPhrase(SitecoreDictionary.PaymentErrorMessagesCantUsePromocode)}</span>
                    </div>
                )}
                {!!errorText && <PromocodeErrors errorText={errorText} />}
                <Button
                    isFullWidth
                    isLoading={isPromocodeApplying}
                    className={styles.applyButton}
                    onClick={onApplyPromo}
                    disabled={isPromoCodeTemporarilyDisabled}
                    type='submit'
                >
                    {getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
                </Button>
            </div>
        </form>
    );
};

export default observer(PromocodeForm);
