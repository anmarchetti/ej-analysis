import React, { FC, useEffect, useRef, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores, isHolidayStore } from 'frontend/store/holidays';
import isBackend from 'frontend/utils/isBackend';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { PriceBreakdownCode } from 'models/enum/PriceBreakdownCode';
import { PromoCodeVariant } from 'models/enum/PromoCodeVariant';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import Button from 'frontend/components/common/Button';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import IconChevronDown from 'frontend/components/icons/ChevronDown';
import IconChevronUp from 'frontend/components/icons/ChevronUp';
import SvgSuccessFilled from 'frontend/components/icons-new/SuccessFilled';
import { IPromocodeInputPlaceholder } from 'frontend/components/renderings/PriceSummary/data/models';
import GreatNewsBanner from 'frontend/components/renderings/PromocodeInput/components/GreatNewsBanner/GreatNewsBanner';

import PromocodeForm, { PROMOCODE_FORM_ID } from './components/PromocodeForm/PromocodeForm';

import styles from './PromocodeInput.module.scss';

const PromoCodeInput: FC<IPromocodeInputPlaceholder> = ({ fields, params }) => {
    const {
        priceBreakdown,
        promoCode,
        isPromoCodeEnabled,
        isExtrasPage,
        isPromocodeApplying,
        promocodeValidationErrors,
        setPromocodeError,
        clearPromocodeError,
        isCreditRedeemedOnExtrasPage,
        redeemError,
        setIsCreditRedeemedOnExtrasPage,
        merchandisedPromotion,
    } = useStore((stores: IHolidaysStores) => ({
        priceBreakdown: stores.bookingStore.priceBreakdown,
        promoCode: stores.bookingStore.promoCode?.value,
        isPromoCodeEnabled: stores.layoutStore.isPromoCodeEnabled,
        isExtrasPage: stores.layoutStore.isExtrasPage,
        isPromocodeApplying: stores.bookingStore.promoCode.isPromocodeApplying,
        promocodeValidationErrors: stores.bookingStore.promoCode.promocodeValidationErrors,
        clearPromocodeError: stores.bookingStore.promoCode.clearPromocodeError,
        setPromocodeError: stores.bookingStore.promoCode.setPromocodeError,
        isCreditRedeemedOnExtrasPage: isHolidayStore(stores) && stores.redeemVoucherStore.isCreditRedeemedOnExtrasPage,
        redeemError: isHolidayStore(stores) && stores.redeemVoucherStore.error,
        setIsCreditRedeemedOnExtrasPage:
            isHolidayStore(stores) && stores.redeemVoucherStore.setIsCreditRedeemedOnExtrasPage,
        merchandisedPromotion: stores.bookingStore.merchandisedPromotion,
    }));

    const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
    const [codeFromInput, setCodeFromInput] = useState<string>(promoCode ?? '');

    const clearPromo = (): void => {
        clearPromocodeError();
        setCodeFromInput('');
    };

    const refPromoCode = useRef(promoCode);
    useEffect(() => {
        // clear input value, after promocode is removed
        if (!!refPromoCode.current && !promoCode && !!codeFromInput && promocodeValidationErrors.length === 0) {
            clearPromo();
        }

        refPromoCode.current = promoCode;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [promoCode, codeFromInput, promocodeValidationErrors.length, refPromoCode]);

    const refRedeemError = useRef(redeemError);
    useEffect(() => {
        if (redeemError && !refRedeemError.current) {
            redeemError && setPromocodeError(redeemError);
        }

        refRedeemError.current = redeemError;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [redeemError, refRedeemError]);

    const refIsCreditRedeemed = useRef(isCreditRedeemedOnExtrasPage);
    useEffect(() => {
        if (isCreditRedeemedOnExtrasPage && !refIsCreditRedeemed.current) {
            clearPromo();
            setIsCreditRedeemedOnExtrasPage && setIsCreditRedeemedOnExtrasPage(false);
        }

        refIsCreditRedeemed.current = isCreditRedeemedOnExtrasPage;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCreditRedeemedOnExtrasPage, refIsCreditRedeemed]);

    useEffect(() => {
        const hasMerchandisedPromotion = isExtrasPage && merchandisedPromotion?.title;

        if (!codeFromInput && promocodeValidationErrors.length > 0 && !hasMerchandisedPromotion) {
            clearPromocodeError();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [codeFromInput, promocodeValidationErrors.length, isExtrasPage, merchandisedPromotion]);

    const shouldShow = (): boolean => {
        if (!isPromoCodeEnabled) {
            return false;
        }

        if (promoCode) {
            return true;
        }

        /** Block should be hidden if there is specific promo code.
         * Because specific promo code is applied automatically and user can't apply another (EJH-7784) */
        const specificPromoCode = priceBreakdown?.find(p => p.code === PriceBreakdownCode.Promotions);

        return !specificPromoCode;
    };

    if (!shouldShow()) {
        return null;
    }

    const isVoucherRedeemedBookingFlow = sessionStorage.getItem(WebStorageKeys.IsVoucherRedeemedBookingFlow);
    const isDropDown = params?.Variant === PromoCodeVariant.DropDown;

    const toggleCollapsed = (): void => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className={styles.container} data-tid='promocode-input-container'>
            {!promoCode || isPromocodeApplying ? (
                <>
                    {isDropDown ? (
                        <Button
                            isText
                            isLink
                            className={styles.button}
                            onClick={toggleCollapsed}
                            aria-expanded={!isCollapsed}
                            aria-controls={PROMOCODE_FORM_ID}
                        >
                            <Text field={fields.Subtitle} />
                            {isCollapsed ? <IconChevronDown /> : <IconChevronUp />}
                        </Button>
                    ) : (
                        <Text tag='span' field={fields.Subtitle} />
                    )}
                    {(!isCollapsed || !isDropDown) && (
                        <PromocodeForm
                            codeFromInput={codeFromInput}
                            clearPromo={clearPromo}
                            setCodeFromInput={setCodeFromInput}
                            label={fields.Placeholder?.value}
                            tooltipText={fields.TooltipText?.value}
                        />
                    )}
                </>
            ) : (
                <ErrorMessage
                    errorMessageClass={styles.successLabel}
                    message={Tokenizer.replaceToken(fields.AppliedLabel?.value, Tokens.Content, promoCode)}
                    dataTid='promocode-applied-success-message'
                    icon={<SvgSuccessFilled />}
                    IsSuccess
                />
            )}
            {isExtrasPage && isVoucherRedeemedBookingFlow && !isBackend() && fields && (
                <GreatNewsBanner fields={fields} />
            )}
        </div>
    );
};

export default observer(PromoCodeInput);
