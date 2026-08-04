import { FC, useContext } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getFieldValue } from 'frontend/utils/sitecore.utils';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { MediaSize } from 'models/data/MediaSizeParams';
import { BigVariantPillAlignment, BigVariantTitlePlacementOptions } from 'models/enum/PromoBlocksBigVariantParams';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import { TrackingContext } from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksTrackingWrapper/PromoBlocksTrackingWrapper';

import PromoBlockItemBigPill from './components/PromoBlockItemBigPill';

import styles from './PromoBlockItemBig.module.scss';

export interface IPromoBlockItemBigSpecificProps {
    pillAlignment?: BigVariantPillAlignment;
    titlePlacement?: BigVariantTitlePlacementOptions;
}

export interface IPromoBlockItemBigProps extends IPromoBlockItemBigSpecificProps {
    item: IPromoBlockFields;
    onClick: () => void;
    imageSizes?: string;
    itemClass?: string;
    shouldShowShard?: boolean;
    showPillLabel?: boolean;
    titleClassName?: string;
    withDarkOverlay?: boolean;
}

export const PromoBlockItemBig: FC<IPromoBlockItemBigProps> = ({
    item,
    onClick,
    itemClass,
    showPillLabel,
    imageSizes,
    withDarkOverlay,
    shouldShowShard,
    titlePlacement,
    pillAlignment,
    titleClassName,
}) => {
    const { isEditMode } = useStore((stores: TStores) => ({
        isEditMode: stores.layoutStore.isEditMode,
    }));
    const { trackItemClick } = useContext(TrackingContext);

    const { Link, Title, Description, Image, PillText, PillPrice, CTAText } = item.fields || {};
    const hasLink = !!Link?.value?.href;
    const hasTitle = !!Title?.value?.trim();
    const hasDescription = !!Description?.value?.trim();
    const shouldShowButton = !!CTAText?.value && hasLink && !hasDescription;

    const shouldShowTitleText = isEditMode || hasTitle;
    const hasTitleOverImage = shouldShowTitleText && titlePlacement === BigVariantTitlePlacementOptions.TitleOverImage;
    const hasTitleBelowImage =
        shouldShowTitleText && (titlePlacement === BigVariantTitlePlacementOptions.TitleBelowImage || !titlePlacement);

    const linkAriaLabel = Link.value.text || Link.value.href;
    const wrapperDataTid = 'promo-block';
    const cardClassName = classNames(styles.card, {
        [styles.shard]: shouldShowShard,
        [styles.fullHeight]: !hasDescription && !hasTitleBelowImage,
    });
    const wrapperClassName = classNames(styles.wrapper, itemClass);
    const titleDataTid = 'promo-block-title';

    const handleClick = (ctaText?: string): void => {
        onClick();
        trackItemClick?.(item, ctaText);
    };

    const cardContent = (
        <>
            <div
                className={classNames(styles.background, {
                    [styles.overlay]: withDarkOverlay,
                })}
                data-tid='promo-block-image'
            >
                <div className={styles.mediaContent}>
                    <JSSImageNext
                        field={Image}
                        fill
                        className={styles.image}
                        mediaSize={{ desktop: MediaSize.Big }}
                        sizes={imageSizes}
                    />
                </div>

                {hasTitleOverImage && (
                    <Text
                        field={Title}
                        tag='h3'
                        className={classNames(styles.title, titleClassName)}
                        data-tid={titleDataTid}
                    />
                )}
            </div>

            {(hasDescription || hasTitleBelowImage || shouldShowButton) && (
                <div className={styles.description} data-tid='promo-block-description'>
                    {hasTitleBelowImage && (
                        <Text
                            field={Title}
                            tag='h3'
                            className={classNames(styles.title, styles.titleUnderImage, titleClassName)}
                            data-tid={titleDataTid}
                        />
                    )}

                    <RichTextWithLinks field={Description} />

                    {shouldShowButton && (
                        <RouterLink
                            className='btn btn--full-width'
                            link={Link}
                            onClick={(): void => handleClick(CTAText.value)}
                            dataId='promo-block-cta'
                        >
                            {CTAText.value}
                        </RouterLink>
                    )}
                </div>
            )}
        </>
    );

    const renderPill = (): JSX.Element | null => {
        const shouldShowPill = isEditMode || showPillLabel;

        if (!shouldShowPill) {
            return null;
        }

        return (
            <PromoBlockItemBigPill
                pillText={getFieldValue(PillText)}
                pillPrice={getFieldValue(PillPrice)}
                alignment={pillAlignment}
            />
        );
    };

    if (!hasLink) {
        return (
            <div className={wrapperClassName} data-tid={wrapperDataTid}>
                <button className={cardClassName} onClick={(): void => handleClick()}>
                    {cardContent}
                </button>
                {renderPill()}
            </div>
        );
    }

    if (hasLink && !shouldShowButton) {
        return (
            <div className={wrapperClassName} data-tid={wrapperDataTid}>
                <RouterLink
                    link={Link}
                    ariaLabel={linkAriaLabel}
                    className={cardClassName}
                    onClick={(): void => handleClick()}
                >
                    {cardContent}
                </RouterLink>
                {renderPill()}
            </div>
        );
    }

    return (
        <div className={wrapperClassName} data-tid={wrapperDataTid}>
            <div className={cardClassName}>{cardContent}</div>
            {renderPill()}
        </div>
    );
};

export default observer(PromoBlockItemBig);
