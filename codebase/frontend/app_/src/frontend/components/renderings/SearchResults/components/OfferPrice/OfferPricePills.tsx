import React from 'react';
import classNames from 'classnames';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getFreeNightsIncludedInOffer } from 'frontend/utils/freeNights.utils';
import { getIsShowGreatDealPill, getTotalDiscount, isFreeForKids } from 'frontend/utils/offer.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import EcoCertifiedPill from 'frontend/components/common/EcoCertifiedPill';
import DiscountedBoardPill from 'frontend/components/common/Pills/DiscountedBoardPill/DiscountedBoardPill';
import DiscountPercentagePill from 'frontend/components/common/Pills/DiscountPercentagePill/DiscountPercentagePill';
import FreeBoardUpgradePill from 'frontend/components/common/Pills/FreeBoardUpgradePill/FreeBoardUpgradePill';
import Pill from 'frontend/components/common/Pills/Pill/Pill';
import Child from 'frontend/components/icons-new/Child';
import LocalHotel from 'frontend/components/icons-new/LocalHotel';
import Savings from 'frontend/components/icons-new/Savings';

import styles from './OfferPricePills.module.scss';

export interface IOfferPricePillsProps {
    offer: IOffer;
    isEcoCertifiedPill?: boolean;
}

const OfferPricePills = ({ offer, isEcoCertifiedPill = false }: IOfferPricePillsProps): JSX.Element | null => {
    const countryCode = offer.hotel?.country?.code;

    const {
        getPhrase,
        isPromoPage,
        shouldDisplayStrikethroughPrices,
        isPillVisible,
        isFreeNightsEnabled,
        formatMoney,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isPromoPage: stores.layoutStore.isPromoPage,
        shouldDisplayStrikethroughPrices: stores.layoutStore.shouldDisplayStrikethroughPrices,
        isPillVisible: stores.layoutStore.isPillVisible,
        isFreeNightsEnabled: stores.layoutStore.isFreeNightsEnabled,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const isFreeForKidsPill =
        isFreeForKids(offer) && isPillVisible(SiteSettings.FreeForKidsPill, countryCode as string);

    const discount = getTotalDiscount(offer);
    const isDiscountPill =
        !!discount &&
        !shouldDisplayStrikethroughPrices(offer) &&
        isPillVisible(SiteSettings.DiscountPill, countryCode as string);

    const nights = getFreeNightsIncludedInOffer(offer);
    const isFreeNightsPill = isFreeNightsEnabled && nights > 0;

    const isGreatDealPill = getIsShowGreatDealPill(offer);

    const { hotel } = offer;
    const isEcoPill = isEcoCertifiedPill && hotel?.ecoFacility?.name && hotel?.ecoFacility?.tooltip;

    const isDiscountedBoardPill = offer.hasDiscountedBoardUpgrade && !offer.hasFreeBoardUpdate;

    return (
        <div
            className={classNames('hotel-price__pills', {
                'hotel-price__pills--promo': isPromoPage,
            })}
        >
            {isFreeForKidsPill && (
                <Pill
                    ellipsis
                    contentClass={styles.freeKidsPill}
                    icon={<Child />}
                    title={getPhrase(SitecoreDictionary.BasketLabelFreeForKids)}
                    text={getPhrase(SitecoreDictionary.HolidayCardPromotionPillTooltipsFreeForKids)}
                    dataTid='free-for-kids-pill'
                />
            )}

            {isDiscountPill && (
                <Pill
                    ellipsis
                    contentClass={classNames(styles.discountPill, styles.priority)}
                    icon={<Savings />}
                    title={Tokenizer.replaceTokens(getPhrase(SitecoreDictionary.BasketLabelDiscount), {
                        [Tokens.Amount]: formatMoney(discount, {
                            currency: offer.currency?.code,
                            maximumFractionDigits: 0,
                        }),
                    })}
                    text={getPhrase(SitecoreDictionary.HolidayCardPromotionPillTooltipsDiscount)}
                    dataTid='discount-pill'
                />
            )}

            <DiscountPercentagePill discountPercentage={offer.discountPercentage} icon={<Savings />} />

            {isFreeNightsPill && (
                <Pill
                    ellipsis
                    contentClass={styles.freeNightsPill}
                    icon={<LocalHotel />}
                    title={Tokenizer.replaceToken(
                        getPhrase(
                            nights > 1
                                ? SitecoreDictionary.FreeUpgradesLabelsFreeNightsIncludedPlural
                                : SitecoreDictionary.FreeUpgradesLabelsFreeNightIncludedSingular,
                        ),
                        Tokens.Number,
                        `${nights}`,
                    )}
                    text={getPhrase(SitecoreDictionary.FreeUpgradesLabelsFreeNightsIncludedTooltip)}
                    dataTid='free-nights-pill'
                />
            )}

            {isGreatDealPill && (
                <Pill
                    ellipsis
                    contentClass={classNames(styles.greatDealPill, styles.priority)}
                    icon={<Savings />}
                    title={getPhrase(SitecoreDictionary.HolidayCardLabelsGreatDealPill)}
                    text={getPhrase(SitecoreDictionary.HolidayCardLabelsGreatDealPillTooltip)}
                    dataTid='great-deal-pill'
                />
            )}

            {isEcoPill && (
                <EcoCertifiedPill title={hotel.ecoFacility.name} tooltip={hotel.ecoFacility.tooltip} isNewPill />
            )}

            <FreeBoardUpgradePill isFreeBoardUpgrade={!!offer.hasFreeBoardUpdate} />

            {isDiscountedBoardPill && <DiscountedBoardPill className={styles.discountedBoardPill} />}
        </div>
    );
};

export default OfferPricePills;
