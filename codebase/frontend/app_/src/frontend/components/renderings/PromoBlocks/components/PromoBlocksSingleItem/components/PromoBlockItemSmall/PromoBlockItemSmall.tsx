import { FC, useContext } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { MediaSize } from 'models/data/MediaSizeParams';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import { TrackingContext } from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksTrackingWrapper/PromoBlocksTrackingWrapper';

import styles from './PromoBlockItemSmall.module.scss';

export interface IPromoBlockItemSmallProps {
    item: IPromoBlockFields;
    onClick: () => void;
    imageSizes?: string;
    itemClass?: string;
    shouldShowShard?: boolean;
    titleClassName?: string;
    withDarkOverlay?: boolean;
}

export const PromoBlockItemSmall: FC<IPromoBlockItemSmallProps> = ({
    item,
    onClick,
    itemClass,
    imageSizes,
    withDarkOverlay,
    shouldShowShard,
    titleClassName,
}) => {
    const { isEditMode } = useStore((stores: TStores) => ({
        isEditMode: stores.layoutStore.isEditMode,
    }));
    const { trackItemClick } = useContext(TrackingContext);

    const { Link, Title, Image, Description } = item.fields || {};
    const hasLink = !!Link?.value?.href;
    const hasTitle = !!Title?.value?.trim();
    const hasDescription = !!Description?.value?.trim();

    const linkAriaLabel = Link.value.text || Link.value.href;
    const containerClassName = classNames(
        styles.card,
        {
            [styles.shard]: shouldShowShard,
        },
        itemClass,
    );

    const handleClick = (): void => {
        onClick();
        trackItemClick?.(item);
    };

    const cardContent = (
        <>
            <div
                className={classNames(styles.background, {
                    [styles.overlay]: withDarkOverlay,
                    [styles.withTitle]: hasTitle,
                })}
                data-tid='promo-block-image'
            >
                <JSSImageNext
                    field={Image}
                    fill
                    className={styles.image}
                    mediaSize={{ desktop: MediaSize.Big }}
                    sizes={imageSizes}
                />

                {(isEditMode || hasTitle) && (
                    <Text
                        field={Title}
                        tag='h3'
                        className={classNames(styles.title, titleClassName)}
                        data-tid='promo-block-title'
                    />
                )}
            </div>

            {hasDescription && (
                <div className={styles.description} data-tid='promo-block-description'>
                    <RichTextWithLinks field={Description} />
                </div>
            )}
        </>
    );

    if (hasLink) {
        return (
            <RouterLink
                link={Link}
                ariaLabel={linkAriaLabel}
                className={containerClassName}
                onClick={handleClick}
                dataId='promo-block'
            >
                {cardContent}
            </RouterLink>
        );
    }

    return (
        <button className={containerClassName} onClick={handleClick} data-tid='promo-block'>
            {cardContent}
        </button>
    );
};

export default observer(PromoBlockItemSmall);
