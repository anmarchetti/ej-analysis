import { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMoreThenMobileViewport, useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import usePriceLabels from 'frontend/hooks/usePriceLabels';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getDurationLabel } from 'frontend/utils/accommodation.utils';
import { formatMoneyWithTouristTax } from 'frontend/utils/touristTax.utils';
import { MediaSize } from 'models/data/MediaSizeParams';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import Callout from 'frontend/components/common/Callout/Callout';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RouterLink from 'frontend/components/common/RouterLink';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import { IHotelLocationLink } from 'frontend/components/renderings/HotelDetails/components/HotelLocation';
import MasonryItemName from 'frontend/components/renderings/MasonryCarousel/components/MasonryItemName/MasonryItemName';
import { IDestinationWithPrice } from 'frontend/components/renderings/MasonryCarousel/MasonryCarousel';

import { createMasonryItemHref } from './MasonryItem.utils';

import styles from './MasonryItem.module.scss';

export interface IMasonryItemProps {
    item: IDestinationWithPrice;
    isFeaturedHotelVariant?: boolean;
    isNumberOfNightsLabel?: boolean;
    isUnavailable?: Nullable<boolean>;
    mediaSize?: MediaSize;
}

export const MasonryItem: FC<IMasonryItemProps> = ({
    item,
    mediaSize,
    isUnavailable,
    isNumberOfNightsLabel,
    isFeaturedHotelVariant,
}) => {
    const {
        currentPath,
        getPhrase,
        isVirtualRegionBrowsePage,
        isVirtualResortBrowsePage,
        isDestinationUnavailableBannerEnabled,
        getCurrencySymbol,
        formatMoney,
        isTouristTaxEnabled,
    } = useStore((stores: TStores) => ({
        currentPath: stores.layoutStore.currentPath,
        getPhrase: stores.layoutStore.getPhrase,
        isVirtualRegionBrowsePage: stores.layoutStore.isVirtualRegionBrowsePage,
        isVirtualResortBrowsePage: stores.layoutStore.isVirtualResortBrowsePage,
        isDestinationUnavailableBannerEnabled: stores.layoutStore.isDestinationUnavailableBannerEnabled,
        getCurrencySymbol: stores.marketStore.getCurrencySymbol,
        formatMoney: stores.marketStore.formatMoney,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
    }));
    const isScreenExtraSmall = useXSMobileViewport();
    const isScreenMedium = useMoreThenMobileViewport();

    const destinationLink: IHotelLocationLink = {
        key: item.fields.Name?.value,
        value: {
            href: createMasonryItemHref(currentPath, item, isVirtualRegionBrowsePage || isVirtualResortBrowsePage),
            text: item.fields.Name?.value,
            linktype: SitecoreLinkType['Internal'],
        },
    };

    const { labelBeforePrice, labelAfterPrice } = usePriceLabels(SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom);
    const currentMediaSize = mediaSize && !isScreenExtraSmall ? mediaSize : MediaSize.Small;
    const isPriceShown = !!(item.pricePP && item.pricePP > 0);
    const hasDuration = isNumberOfNightsLabel || item?.duration;

    return (
        <RouterLink
            link={destinationLink}
            className={classNames('masonry-item', isFeaturedHotelVariant && styles.masonryItemFeaturedHotel)}
            onClick={(e: any): void => {
                if (e.target.closest('.callout__container')) {
                    e.preventDefault();
                }
            }}
        >
            <MasonryItemName item={item} isFeaturedHotelVariant={isFeaturedHotelVariant} />
            <JSSImageNext field={item.fields.Image} mediaSize={currentMediaSize} fill />
            {!hasDuration && isPriceShown && (
                <div data-tid='price-block' className='masonry-item__price-block'>
                    <span className='from-label'>{labelBeforePrice}</span>
                    <div>
                        <span className='price__currency'>{getCurrencySymbol(item.currency)}</span>
                        <span className='price__amount'>
                            {formatMoneyWithTouristTax(
                                item.pricePP ?? 0,
                                item.pricePPExcludingTouristTax ?? 0,
                                isTouristTaxEnabled,
                                formatMoney,
                                { maximumFractionDigits: 0, hideCurrencySymbol: true },
                            )}
                        </span>
                        <span className='price__per-person'>{labelAfterPrice}</span>
                    </div>
                </div>
            )}
            {hasDuration && isPriceShown && (
                <div data-tid='price-block-with-duration' className={styles.priceBlockWithDuration}>
                    <span className={styles.pricePrefix}>
                        {getDurationLabel(getPhrase, item.duration || 1)} {labelBeforePrice}
                    </span>
                    <div>
                        <span className={styles.price}>
                            {formatMoneyWithTouristTax(
                                item.pricePP ?? 0,
                                item.pricePPExcludingTouristTax ?? 0,
                                isTouristTaxEnabled,
                                formatMoney,
                                { maximumFractionDigits: 0 },
                            )}
                        </span>
                        <span className={styles.priceSuffix}>{labelAfterPrice}</span>
                    </div>
                </div>
            )}

            {isUnavailable && isDestinationUnavailableBannerEnabled && !item?.pricePP && (
                <div data-tid='unavailable-banner' className='unavailable-banner'>
                    <Callout
                        content={
                            <div className='unavailable-banner__tooltip'>
                                {getPhrase(SitecoreDictionary.DestinationsLabelsMasonryCarouselUnavailableBanner)}
                            </div>
                        }
                        orientation={CalloutOrientation.Top}
                        position={CalloutPosition.Right}
                        isShownOnHover={isScreenMedium}
                        className={isFeaturedHotelVariant ? styles.callout : ''}
                    >
                        <SvgWarningFilled />
                        <p>{getPhrase(SitecoreDictionary.DestinationsLabelsMasonryCarouselNoAvailability)}</p>
                    </Callout>
                </div>
            )}
        </RouterLink>
    );
};

export default observer(MasonryItem);
