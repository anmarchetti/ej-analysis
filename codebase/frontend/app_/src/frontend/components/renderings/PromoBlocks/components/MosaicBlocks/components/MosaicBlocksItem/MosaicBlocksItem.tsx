import * as React from 'react';
import { FunctionComponent, useContext } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { formatMoneyWithTouristTax } from 'frontend/utils/touristTax.utils';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { MediaSize } from 'models/data/MediaSizeParams';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import JSSImage from 'frontend/components/common/JSSImage';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import RouterLink from 'frontend/components/common/RouterLink';
import { TrackingContext } from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksTrackingWrapper/PromoBlocksTrackingWrapper';

import styles from './MosaicBlocksItem.module.scss';

export interface IMosaicBlocksItemProps {
    displayNumberOfNights: boolean;
    item: IPromoBlockFields;
    onClick: () => void;
    titleClassName: string;
    className?: string;
}

export const MosaicBlocksItem: FunctionComponent<IMosaicBlocksItemProps> = ({
    item,
    onClick,
    displayNumberOfNights,
    titleClassName,
    className,
}) => {
    const { isEditMode, formatMoney, isTouristTaxEnabled } = useStore((stores: TStores) => ({
        isEditMode: stores.layoutStore.isEditMode,
        formatMoney: stores.marketStore.formatMoney,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
    }));
    const { trackItemClick } = useContext(TrackingContext);
    const pricePP = item.livePrice?.pricePP || 0;
    const pricePPExcludingTouristTax = item.livePrice?.pricePPExcludingTouristTax || 0;
    const hasTitle = item?.fields?.Title?.value?.trim();

    const renderPriceItem = (label: React.ReactNode, className?: string): React.JSX.Element => (
        <span className={className}>{label}</span>
    );

    if (isEditMode) {
        return (
            <div className={classNames(styles.item, className)}>
                <div className='exp-editor-bg-image'>
                    <JSSImage field={item.fields.Image} />
                </div>
                <Text field={item.fields.Title} tag='div' className='promo-slide__title' />
                <RouterLink link={item.fields.Link} className='link-overlay' />
            </div>
        );
    }

    return (
        <button className={classNames(styles.item, className)} onClick={onClick}>
            <JSSImageNext fill field={item.fields.Image} mediaSize={{ desktop: MediaSize.Big }} />

            {hasTitle && (
                <Text
                    field={item.fields.Title}
                    tag='div'
                    className={classNames(styles.title, titleClassName)}
                    data-tid='item-title'
                />
            )}

            <RouterLink link={item.fields.Link} className='link-overlay' onClick={(): void => trackItemClick?.(item)} />

            {pricePP > 0 && item.isLivePriceValid && (
                <PriceLabel
                    dataTid='item-price'
                    tag='div'
                    className={styles.price}
                    priceDictionary={SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom}
                    price={
                        <span className={styles.priceLabel}>
                            {formatMoneyWithTouristTax(
                                pricePP,
                                pricePPExcludingTouristTax,
                                isTouristTaxEnabled,
                                formatMoney,
                                {
                                    currency: item.livePrice?.currency,
                                    maximumFractionDigits: 0,
                                },
                            )}
                        </span>
                    }
                    numberOfNights={displayNumberOfNights ? item.livePrice?.searchCriteria.duration : 0}
                    wrapPrice={(block): JSX.Element => renderPriceItem(block)}
                    wrapLabelBeforePrice={(block): JSX.Element => renderPriceItem(block, styles.pricePrefix)}
                    wrapLabelAfterPrice={(block): JSX.Element => renderPriceItem(block, styles.priceSuffix)}
                />
            )}
        </button>
    );
};

export default MosaicBlocksItem;
