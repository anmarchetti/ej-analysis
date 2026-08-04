import React, { FormEvent, FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import usePriceLabels from 'frontend/hooks/usePriceLabels';
import useStore from 'frontend/hooks/useStore';
import creditManagementService from 'frontend/services/creditManagement.service';
import { isHolidayStore } from 'frontend/store/holidays';
import { getDiscount, getDiscountPerPerson } from 'frontend/utils/discount.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import ColorScheme from 'models/enum/banners/ColorScheme';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { VoucherTypes } from 'models/enum/VoucherTypes';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgCopy from 'frontend/components/icons-new/Copy';
import { IPromocodeInputFields } from 'frontend/components/renderings/PriceSummary/data/models';

import styles from './MerchandisedBanner.module.scss';

export interface IMerchandisedBannerProps {
    className: string;
    fields: IPromocodeInputFields;
}

export const BannerColorScheme: Record<keyof typeof ColorScheme, string> = {
    [ColorScheme.Blue]: styles.blueTheme,
    [ColorScheme.Black]: styles.blackTheme,
    [ColorScheme.Orange]: styles.orangeTheme,
};

export const MerchandisedBanner: FunctionComponent<IMerchandisedBannerProps> = ({ fields, className }) => {
    const {
        promoCode,
        merchandisedPromotion,
        isPromocodeApplying,
        clearPromocodeError,
        setIsPromocodeApplying,
        onPromocodeErrorCallback,
        onApplyPromoCode,
        onErrorPromoCode,
        initiateVoucherExtrasFlow,
        formatMoney,
        currency,
    } = useStore(stores => ({
        promoCode: stores.bookingStore.promoCode?.value,
        merchandisedPromotion: stores.bookingStore.merchandisedPromotion,
        isPromocodeApplying: stores.bookingStore.promoCode.isPromocodeApplying,
        clearPromocodeError: stores.bookingStore.promoCode.clearPromocodeError,
        setIsPromocodeApplying: stores.bookingStore.promoCode.setIsPromocodeApplying,
        onPromocodeErrorCallback: stores.bookingStore.promoCode.onPromocodeErrorCallback,
        onApplyPromoCode: stores.bookingStore.onApplyPromoCode,
        onErrorPromoCode: stores.bookingStore.onErrorPromoCode,
        initiateVoucherExtrasFlow: isHolidayStore(stores) && stores.redeemVoucherStore.initiateVoucherExtrasFlow,
        formatMoney: stores.marketStore.formatMoney,
        currency: stores.marketStore.currency,
    }));

    const { labelBeforePrice, labelAfterPrice } = usePriceLabels(SitecoreDictionary.GlobalsPriceLabelsPerPerson);

    if (!merchandisedPromotion?.title) {
        return null;
    }

    const discountPerPersonValue = getDiscountPerPerson(
        merchandisedPromotion,
        currency,
        formatMoney,
        labelBeforePrice,
        labelAfterPrice,
    );

    const onApplyPromo = async (event?: MouseEvent | FormEvent): Promise<void> => {
        event?.preventDefault();

        if (isPromocodeApplying || !merchandisedPromotion?.title) {
            return;
        }

        try {
            setIsPromocodeApplying(true);

            const res = await creditManagementService.validateVoucherCode(merchandisedPromotion?.title);
            const onFinishApply = (): void => {
                setIsPromocodeApplying(false);
            };

            if (res.voucherType === VoucherTypes.PromoVoucher) {
                onApplyPromoCode(merchandisedPromotion?.title, onFinishApply, onPromocodeErrorCallback);
            } else if (res.voucherType === VoucherTypes.GiftVoucher && initiateVoucherExtrasFlow) {
                clearPromocodeError();
                await initiateVoucherExtrasFlow(res);
                onFinishApply();
            }
        } catch (e) {
            onErrorPromoCode(e);
        }
    };

    const { OfferText, AppliedOfferText, UseCodeText, ApplyCodeText, TermsAndConditions, ColourScheme, SalesText } =
        fields;

    const isMerchandisedApplied = promoCode && promoCode === merchandisedPromotion.title && !isPromocodeApplying;
    const promotionExpiring = Tokenizer.replaceToken(SalesText?.value, Tokens.Date, merchandisedPromotion.date);
    const titleText = isMerchandisedApplied ? AppliedOfferText?.value : OfferText?.value;

    const discountValue = getDiscount(merchandisedPromotion, currency, formatMoney);

    const preferredDiscountValue = discountPerPersonValue || discountValue;

    const tokenizedTitleText = Tokenizer.replaceTokens(titleText, {
        [Tokens.Discount]: preferredDiscountValue,
        [Tokens.DiscountPerPerson]: preferredDiscountValue,
    });

    return (
        <div className={classNames(className, styles.wrapper)} data-tid='price-summary-merchandised-banner'>
            <div>
                {!!tokenizedTitleText && (
                    <h3 className={styles.title} data-tid='merchandised-banner-title'>
                        {tokenizedTitleText}
                    </h3>
                )}
                {!isMerchandisedApplied && (
                    <div>
                        <Text
                            tag='div'
                            className={classNames(styles.description, BannerColorScheme[ColourScheme.value])}
                            field={UseCodeText}
                            data-tid='merchandised-banner-description'
                        />
                        <div
                            className={classNames(styles.promo, BannerColorScheme[ColourScheme.value])}
                            data-tid='merchandised-banner-promo'
                        >
                            <span
                                className={classNames(styles.promoCode, BannerColorScheme[ColourScheme.value])}
                                data-tid='merchandised-banner-promo-code'
                            >
                                {merchandisedPromotion.title}
                            </span>
                            <button
                                className={styles.applyButton}
                                type='button'
                                aria-label={ApplyCodeText.value}
                                onClick={onApplyPromo}
                                data-tid='merchandised-banner-apply-button'
                            >
                                <SvgCopy className={styles.copyIcon} />
                                <Text field={ApplyCodeText} tag='span' />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {!!TermsAndConditions?.value && (
                <div className={styles.terms}>
                    <span className={styles.termsDate}>{promotionExpiring}</span>
                    <RichTextWithLinks tag='span' field={TermsAndConditions} data-tid='merchandised-banner-terms' />
                </div>
            )}
        </div>
    );
};

export default observer(MerchandisedBanner);
