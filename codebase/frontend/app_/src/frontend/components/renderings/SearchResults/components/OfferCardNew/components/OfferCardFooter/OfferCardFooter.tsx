import React, { FC, useMemo } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useDesktopViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { IOffer } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import OfferPriceButton from 'frontend/components/common/OfferPriceButton/OfferPriceButton';
import PackageIcons from 'frontend/components/common/PackageIcons/PackageIcons';
import CompareCheckbox from 'frontend/components/renderings/SearchResults/components/OfferCardNew/components/CompareCheckbox/CompareCheckbox';
import OfferCardPills from 'frontend/components/renderings/SearchResults/components/OfferCardNew/components/OfferCardPills/OfferCardPills';
import OfferCardPrices from 'frontend/components/renderings/SearchResults/components/OfferCardPrices/OfferCardPrices';
import OfferPricePills from 'frontend/components/renderings/SearchResults/components/OfferPrice/OfferPricePills';
import ShortlistButton from 'frontend/components/renderings/Shortlists/components/ShortlistButton/ShortlistButton';

import styles from './OfferCardFooter.module.scss';

export interface IOfferCardFooterProps {
    hotelLink: string;
    hotelLinkWithPrice: string;
    isLuxury: boolean;
    isShortlistOfferUnavailable: boolean;
    offer: IOffer;
    onClickSelect: () => void;
    rendering: ISitecoreComponent['rendering'];
    routeDep: IRoute;
    hasShortlistBookmark?: boolean;
    isSelectionEditMode?: boolean;
}

const OfferCardFooter: FC<IOfferCardFooterProps> = ({
    offer,
    hotelLink,
    hotelLinkWithPrice,
    isShortlistOfferUnavailable,
    onClickSelect,
    hasShortlistBookmark,
    isSelectionEditMode,
    routeDep,
    rendering,
    isLuxury,
}) => {
    const {
        isEcoCertifiedEnabledOnSearchPage,
        isScreenExtraLarge,
        isPriceVisibleSitecoreSetting,
        isOfferFromAnotherMarket,
        shouldDisplayStrikethroughPrices,
        isTouristTaxEnabled,
    } = useStore((stores: TStores) => ({
        isEcoCertifiedEnabledOnSearchPage: stores.layoutStore.isEcoCertifiedEnabledOnSearchPage,
        isScreenExtraLarge: stores.appStore.isScreenExtraLarge,
        isPriceVisibleSitecoreSetting: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
        isOfferFromAnotherMarket: isHolidayStore(stores)
            ? stores.shortlistStore.isOfferFromAnotherMarket
            : (): boolean => false,
        shouldDisplayStrikethroughPrices: stores.layoutStore.shouldDisplayStrikethroughPrices,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
    }));
    const { hotel, accom, transfers } = offer;

    const hasEcoFacility = !!hotel?.ecoFacility?.name && !!hotel?.ecoFacility?.tooltip;
    const isEcoCertifiedPill = hasEcoFacility && isEcoCertifiedEnabledOnSearchPage;

    const isShortlistButton = hasShortlistBookmark && !isSelectionEditMode && isScreenExtraLarge;

    const isPriceVisible = useMemo(
        () => isPriceVisibleSitecoreSetting && !(isShortlistOfferUnavailable && isOfferFromAnotherMarket(offer)),
        [isPriceVisibleSitecoreSetting, offer, isShortlistOfferUnavailable, isOfferFromAnotherMarket],
    );

    const isDesktopViewport = useDesktopViewport();

    const packageIcons = (
        <div className={styles.packageIconsWrapper}>
            <PackageIcons
                extraLuggage={offer?.extraLuggageInfo as any}
                packageIcons={accom?.theme?.packageIcons || hotel?.theme?.packageIcons || []}
                transfer={transfers?.[0] || null}
                rendering={rendering}
                isLuxury={isLuxury}
            />
        </div>
    );

    return (
        <div
            className={classNames(styles.footer, {
                [styles.footerWithTouristTax]: isTouristTaxEnabled,
            })}
        >
            {isScreenExtraLarge && packageIcons}

            {!isScreenExtraLarge && (
                <OfferCardPills
                    isOfferUnavailableInShortlist={isShortlistOfferUnavailable}
                    rendering={rendering}
                    offer={offer}
                    routeDep={routeDep}
                    isEcoCertifiedPill={isEcoCertifiedPill}
                />
            )}

            {isPriceVisible && <OfferPricePills offer={offer} />}

            {!isScreenExtraLarge && packageIcons}

            <div className={styles.priceWrapper}>
                <div className={styles.priceInfo}>
                    {isDesktopViewport && (
                        <CompareCheckbox
                            offer={{
                                ...offer,
                                link: hotelLinkWithPrice,
                                onClickViewHoliday: onClickSelect,
                                asLink: hotelLinkWithPrice,
                            }}
                        />
                    )}

                    {isPriceVisible && (
                        <OfferCardPrices
                            offer={offer}
                            livePrice={offer.livePrice}
                            shouldDisplayStrikethroughPrices={shouldDisplayStrikethroughPrices(offer)}
                        />
                    )}
                </div>
                <OfferPriceButton
                    offer={offer}
                    link={hotelLinkWithPrice}
                    asLink={hotelLink}
                    isLivePrice={!!offer.livePrice}
                    onClick={onClickSelect}
                    className={isLuxury ? 'btn--black' : undefined}
                />
                {isShortlistButton && <ShortlistButton offer={offer} />}
            </div>
        </div>
    );
};

export default observer(OfferCardFooter);
