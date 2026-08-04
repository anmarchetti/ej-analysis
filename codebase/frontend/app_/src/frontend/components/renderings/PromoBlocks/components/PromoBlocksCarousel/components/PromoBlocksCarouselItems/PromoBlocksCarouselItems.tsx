import React, { FC } from 'react';

import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { IPromoBlockItemBigSpecificProps } from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksSingleItem/components/PromoBlockItemBig/PromoBlockItemBig';
import { PromoBlocksSingleItem } from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksSingleItem/PromoBlocksSingleItem';
import { IPromoBlocksParams } from 'frontend/components/renderings/PromoBlocks/PromoBlocks';

import styles from './PromoBlocksCarouselItems.module.scss';

export interface IPromoBlocksCarouselItemsProps extends IPromoBlockItemBigSpecificProps {
    baseIndex: number;
    handleClickItem: (item: IPromoBlockFields) => void;
    items: IPromoBlockFields | IPromoBlockFields[];
    shouldShowShard: boolean;
    theme: IPromoBlocksParams['Theme'] | undefined;
    titleClassName: string;
    withDarkOverlay?: boolean;
}

export const PromoBlocksCarouselItems: FC<IPromoBlocksCarouselItemsProps> = ({
    items,
    baseIndex,
    handleClickItem,
    theme,
    shouldShowShard,
    withDarkOverlay,
    pillAlignment,
    titlePlacement,
    titleClassName,
}) => {
    const isArrayItems = Array.isArray(items);
    const convertedItems = isArrayItems ? items : [items];

    return (
        <>
            {convertedItems.map((item, index) => {
                const itemIndex = isArrayItems ? index : baseIndex;

                return (
                    <PromoBlocksSingleItem
                        key={item.id + itemIndex}
                        fields={item}
                        onClick={(): void => handleClickItem(item)}
                        theme={theme}
                        shouldShowShard={shouldShowShard}
                        withDarkOverlay={withDarkOverlay}
                        pillAlignment={pillAlignment}
                        titlePlacement={titlePlacement}
                        titleClassName={titleClassName}
                        className={styles.item}
                    />
                );
            })}
        </>
    );
};
