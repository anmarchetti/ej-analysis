import React, { FC } from 'react';
import { RichText } from '@sitecore-jss/sitecore-jss-react';
import classNames from 'classnames';
import sanitize from 'sanitize-html';

import { TrailingZeroDisplay } from 'code/currency';
import { cmsUrls } from 'code/endpoints';
import { Tokens } from 'code/tokens';
import usePriceLabels from 'frontend/hooks/usePriceLabels';
import useStore from 'frontend/hooks/useStore';
import { getDiscount, getDiscountPerPerson } from 'frontend/utils/discount.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ISinglePromotionInfo } from 'models/data/IPromocode';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import JSSResponsiveImage from 'frontend/components/common/JSSResponsiveImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './PromotionBanner.module.scss';

interface IPromotionBannerProps {
    promo: Nullable<ISinglePromotionInfo>;
}

const PromotionBanner: FC<IPromotionBannerProps> = ({ promo }) => {
    const { currency, formatMoney, getPhrase } = useStore(stores => ({
        currency: stores.marketStore.currency,
        formatMoney: stores.marketStore.formatMoney,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const { labelBeforePrice, labelAfterPrice } = usePriceLabels(SitecoreDictionary.GlobalsPriceLabelsPerPerson);

    // Check to see if promoCode is empty HTML tags - EJH-17555
    const isPromocodeEmpty = !sanitize(promo?.promoCode, { allowedTags: [] }).trim().length;

    const shouldRenderComponent = (): boolean =>
        !!promo?.icon ||
        !!promo?.bannerTitle ||
        !!promo?.minimumSpendText ||
        !isPromocodeEmpty ||
        !!promo?.date ||
        !!promo?.tandCs;

    if (!promo || !shouldRenderComponent()) {
        return null;
    }

    const { icon, bannerTitle, promoCode, date, tandCs, promotionCodeTiers, minimumSpendText, showTaxesNote } = promo;

    const getTokenizedMinimumSpendPerTier = (): string[] => {
        if (!promotionCodeTiers?.length) return [];

        const tokens: { [key: string]: string } = {};

        return promotionCodeTiers.map(promotionTier => {
            const discount = getDiscount(promotionTier, currency, formatMoney);
            const discountPerPerson = getDiscountPerPerson(
                promotionTier,
                currency,
                formatMoney,
                labelBeforePrice,
                labelAfterPrice,
            );

            const {
                discountAmountPerBooking,
                percentageDiscountPerBooking,
                minimumSpend,
                minimumSpendPerPerson,
                discountAmountPerPerson,
                discountPercentagePerPerson,
            } = promotionTier;

            if (discount && (discountAmountPerBooking || percentageDiscountPerBooking)) {
                tokens[Tokens.Discount] = discount;
            }

            if (discountPerPerson && (discountAmountPerPerson || discountPercentagePerPerson)) {
                tokens[Tokens.DiscountPerPerson] = discountPerPerson;
            }

            if (minimumSpendPerPerson) {
                tokens[Tokens.MinimumSpendPerPerson] = formatMoney(minimumSpendPerPerson, {
                    currency,
                    trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                });
            }

            if (minimumSpend) {
                tokens[Tokens.MinimumSpend] = formatMoney(minimumSpend, {
                    currency,
                    trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                });
            }

            let processedText = minimumSpendText || '';

            if (minimumSpend === 0) {
                processedText = processedText.replaceAll('{minimumSpend}', '');
            }

            if (minimumSpendPerPerson === 0) {
                processedText = processedText.replaceAll('{minimumSpendPerPerson}', '');
            }

            if (discountAmountPerBooking === 0) {
                processedText = processedText.replaceAll('{discount}', '');
            }

            if (!discountPerPerson) {
                processedText = processedText.replaceAll('{discountPerPerson}', '');
            }

            processedText = processedText.replaceAll(/\s+/g, ' ').trim();

            return Tokenizer.replaceTokens(processedText, tokens);
        });
    };

    const minimumSpendPerTier = getTokenizedMinimumSpendPerTier();

    const hasMinimumSpendPerTier = minimumSpendPerTier && minimumSpendPerTier.length > 0;

    return (
        <div data-tid='promotion-banner' className={styles.promotionBanner}>
            <div className='wrapper-container'>
                {icon && (
                    <div className={styles.imageBlock}>
                        <JSSResponsiveImage
                            className='icon--bg-image'
                            field={{ value: { src: cmsUrls.media(icon) } }}
                        />
                    </div>
                )}
                <div className={styles.wrapper}>
                    {bannerTitle && (
                        <p data-tid='promotion-banner-title' className={styles.title}>
                            {bannerTitle}
                        </p>
                    )}
                    <div className={styles.codeAndDiscount}>
                        {!isPromocodeEmpty && promoCode && (
                            <div
                                className={classNames(styles.promocode, hasMinimumSpendPerTier && styles.lineSeparator)}
                                data-tid='promotion-banner-promocode'
                            >
                                <RichText field={{ value: promoCode }} tag='span' />
                            </div>
                        )}
                        {hasMinimumSpendPerTier && (
                            <>
                                <div data-tid='promotion-banner-discounts' className={styles.discounts}>
                                    {minimumSpendPerTier.map(minimumSpend => (
                                        <p key={minimumSpend}>{minimumSpend}</p>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    {date || tandCs || showTaxesNote ? (
                        <>
                            <hr className={styles.divider} />
                            <div className={styles.footer}>
                                {date && (
                                    <div data-tid='promotion-banner-date' className={styles.dates}>
                                        {date}
                                    </div>
                                )}
                                {tandCs && (
                                    <RichTextWithLinks
                                        field={{ value: tandCs }}
                                        dataId='promotion-banner-link'
                                        className={styles.link}
                                    />
                                )}
                                {showTaxesNote && (
                                    <RichTextWithLinks
                                        field={{
                                            value: getPhrase(SitecoreDictionary.TouristTaxLabelsPromoBannerTaxNote),
                                        }}
                                        dataId='promotion-banner-tax-note'
                                    />
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default PromotionBanner;
