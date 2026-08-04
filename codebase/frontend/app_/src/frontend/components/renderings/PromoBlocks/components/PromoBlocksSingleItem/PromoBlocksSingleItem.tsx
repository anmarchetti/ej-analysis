import { FC } from 'react';
import classNames from 'classnames';

import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';
import { FeaturedFacility } from 'frontend/components/renderings/PromoBlocks/components/FeaturedFacility';
import PromoBlockItemBig, {
    IPromoBlockItemBigSpecificProps,
} from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksSingleItem/components/PromoBlockItemBig/PromoBlockItemBig';
import { TitleUnderImageBlock } from 'frontend/components/renderings/PromoBlocks/components/TitleUnderImageBlock';
import { IPromoBlocksParams } from 'frontend/components/renderings/PromoBlocks/PromoBlocks';
import {
    generateImageSizes,
    PROMO_BLOCK_DEFAULT_RESPONSIVE,
} from 'frontend/components/renderings/PromoBlocks/PromoBlocks.utils';

import PromoBlockItemSmall from './components/PromoBlockItemSmall/PromoBlockItemSmall';

export interface IPromoBlockSingleItemProps extends IPromoBlockItemBigSpecificProps {
    fields: IPromoBlockFields;
    onClick: () => void;
    theme: IPromoBlocksParams['Theme'] | undefined;
    titleClassName: string;
    className?: string;
    shouldShowShard?: boolean;
    withDarkOverlay?: boolean;
}

export const PromoBlocksSingleItem: FC<IPromoBlockSingleItemProps> = ({
    theme,
    fields,
    shouldShowShard,
    onClick,
    withDarkOverlay,
    pillAlignment,
    titlePlacement,
    titleClassName,
    className,
}) => {
    if (theme === PromoBlocksThemes.Big) {
        return (
            <PromoBlockItemBig
                item={fields}
                withDarkOverlay={withDarkOverlay}
                shouldShowShard={shouldShowShard}
                itemClass={className}
                //  EJH-14411: pill available only for 'Big Variant' Promo Blocks
                showPillLabel
                onClick={onClick}
                imageSizes={generateImageSizes(PROMO_BLOCK_DEFAULT_RESPONSIVE)}
                pillAlignment={pillAlignment}
                titlePlacement={titlePlacement}
                titleClassName={titleClassName}
            />
        );
    }

    if (theme === PromoBlocksThemes.Small) {
        return (
            <PromoBlockItemSmall
                item={fields}
                withDarkOverlay={withDarkOverlay}
                shouldShowShard={shouldShowShard}
                itemClass={className}
                onClick={onClick}
                imageSizes={generateImageSizes(PROMO_BLOCK_DEFAULT_RESPONSIVE)}
                titleClassName={titleClassName}
            />
        );
    }

    if (theme === PromoBlocksThemes.FeaturedFacilities) {
        return (
            <FeaturedFacility
                item={fields}
                itemClass={classNames(
                    'promo-block-card',
                    'title-under-image-block',
                    'promo-block--featured-facilities',
                    {
                        ['promo-block--dark-overlay']: withDarkOverlay,
                    },
                )}
                titleClassName={titleClassName}
            />
        );
    }

    return (
        <TitleUnderImageBlock
            item={fields}
            itemClass='promo-block-card title-under-image-block'
            titleClassName={titleClassName}
        />
    );
};
