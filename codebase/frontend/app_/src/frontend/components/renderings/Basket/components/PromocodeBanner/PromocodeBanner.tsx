import React, { FC, FormEvent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { Tokens } from 'code/tokens';
import usePriceLabels from 'frontend/hooks/usePriceLabels';
import useStore from 'frontend/hooks/useStore';
import creditManagementService from 'frontend/services/creditManagement.service';
import { isHolidayStore } from 'frontend/store/holidays';
import { getDiscount, getDiscountPerPerson } from 'frontend/utils/discount.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ApiError } from 'models/data/ApiError';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { VoucherTypes } from 'models/enum/VoucherTypes';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import styles from './PromocodeBanner.module.scss';

export interface IPromocodeBannerProps {
    buttonLabel?: ISitecoreField<string>;
    text?: ISitecoreField<string>;
}

const PromocodeBanner: FC<IPromocodeBannerProps> = ({ buttonLabel, text }) => {
    const {
        isExtrasPage,
        promoCode,
        merchandisedPromotion,
        isPromocodeApplying,
        clearPromocodeError,
        setIsPromocodeApplying,
        onPromocodeErrorCallback,
        onApply,
        cleanupRedeemStore,
        initiateVoucherExtrasFlow,
        formatMoney,
        currency,
    } = useStore(stores => ({
        isExtrasPage: stores.layoutStore.isExtrasPage,
        promoCode: stores.bookingStore.promoCode?.value,
        merchandisedPromotion: stores.bookingStore.merchandisedPromotion,
        isPromocodeApplying: stores.bookingStore.promoCode.isPromocodeApplying,
        clearPromocodeError: stores.bookingStore.promoCode.clearPromocodeError,
        setIsPromocodeApplying: stores.bookingStore.promoCode.setIsPromocodeApplying,
        onPromocodeErrorCallback: stores.bookingStore.promoCode.onPromocodeErrorCallback,
        onApply: stores.bookingStore.onApplyPromoCode,
        cleanupRedeemStore: isHolidayStore(stores) && stores.redeemVoucherStore.cleanupRedeemStore,
        initiateVoucherExtrasFlow: isHolidayStore(stores) && stores.redeemVoucherStore.initiateVoucherExtrasFlow,
        formatMoney: stores.marketStore.formatMoney,
        currency: stores.marketStore.currency,
    }));
    const { labelBeforePrice, labelAfterPrice } = usePriceLabels(SitecoreDictionary.GlobalsPriceLabelsPerPerson);
    const isMerchandisedApplied = promoCode && promoCode === merchandisedPromotion?.title && !isPromocodeApplying;

    if (
        !isExtrasPage ||
        !text?.value ||
        !buttonLabel?.value ||
        !merchandisedPromotion?.title ||
        !merchandisedPromotion?.displayOnExtrasPage ||
        isMerchandisedApplied
    ) {
        return null;
    }

    const onApplyPromo = async (event?: MouseEvent | FormEvent): Promise<void> => {
        event?.preventDefault();

        if (isPromocodeApplying || !merchandisedPromotion.title) {
            return;
        }

        const onError = (e: ApiError): void => {
            onPromocodeErrorCallback(e);
            cleanupRedeemStore && cleanupRedeemStore();
            setIsPromocodeApplying(false);
        };

        try {
            setIsPromocodeApplying(true);

            const res = await creditManagementService.validateVoucherCode(merchandisedPromotion?.title);
            const onFinishApply = (): void => {
                setIsPromocodeApplying(false);
            };

            if (res.voucherType === VoucherTypes.PromoVoucher) {
                onApply(merchandisedPromotion?.title, onFinishApply, onPromocodeErrorCallback);
            } else if (res.voucherType === VoucherTypes.GiftVoucher && initiateVoucherExtrasFlow) {
                clearPromocodeError();
                await initiateVoucherExtrasFlow(res);
                onFinishApply();
            }
        } catch (e) {
            onError(e);
        }
    };

    const preferredDiscountValue =
        getDiscountPerPerson(merchandisedPromotion, currency, formatMoney, labelBeforePrice, labelAfterPrice) ||
        getDiscount(merchandisedPromotion, currency, formatMoney);
    const tokenizedTitleText = Tokenizer.replaceTokens(text.value, {
        [Tokens.Discount]: preferredDiscountValue,
        [Tokens.DiscountPerPerson]: preferredDiscountValue,
    });

    return (
        <div className={styles.container}>
            <span className={styles.text}>{tokenizedTitleText}</span>
            <button className={styles.button} type='button' aria-label={buttonLabel.value} onClick={onApplyPromo}>
                <Text field={buttonLabel} tag='span' />
            </button>
        </div>
    );
};

export default PromocodeBanner;
