import React, { FC } from 'react';
import classNames from 'classnames';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IDestinationWithPrice } from 'frontend/components/renderings/MasonryCarousel/MasonryCarousel';

import styles from './MasonryItemName.module.scss';

export interface IMasonryItemNameProps {
    item: IDestinationWithPrice;
    isFeaturedHotelVariant?: boolean;
}

export const MasonryItemName: FC<IMasonryItemNameProps> = ({ item, isFeaturedHotelVariant }) => {
    const { Name } = item.fields;
    const titleClassName = classNames(isFeaturedHotelVariant ? styles.title : 'masonry-item__title');
    const { getPhrase } = useStore(({ layoutStore }) => ({
        getPhrase: layoutStore.getPhrase,
    }));

    return (
        <h3 className={titleClassName} data-tid='masonry-item-name-title'>
            {isFeaturedHotelVariant
                ? Tokenizer.replaceTokens(getPhrase(SitecoreDictionary.GlobalsTitlesRegionHolidays), {
                      [Tokens.Region]: Name?.value,
                  })
                : Name?.value}
        </h3>
    );
};

export default MasonryItemName;
