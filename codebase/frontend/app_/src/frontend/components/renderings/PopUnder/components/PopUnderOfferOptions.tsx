import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { partition } from 'frontend/utils/array.utils';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';

import styles from './PopUnderOfferOptions.module.scss';

export interface IPopUnderOfferFields {
    Icon: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
}

interface IPopUnderOfferOptionsProps {
    items: ISitecoreChildren<IPopUnderOfferFields>[];
    className?: string;
}

export const PopUnderOfferOptions: FC<IPopUnderOfferOptionsProps> = ({ items, className }) => {
    const [row1, row2] = partition<ISitecoreChildren<IPopUnderOfferFields>>(items, (el, index) =>
        items.length > 3 ? index % 2 === 0 : false,
    );

    const renderRow = (row: ISitecoreChildren<IPopUnderOfferFields>[]) =>
        row.map(item => {
            const isLastInRow = row.lastIndexOf(item) === row.length - 1;
            const containerClassName = classNames(
                styles.popUnderOffer,
                !isLastInRow && styles.popUnderOfferRightSeparator,
            );

            return (
                <div className={containerClassName} key={item.id} data-tid='popunder-option'>
                    {!!item.fields?.Icon?.value?.src && (
                        <JSSImage
                            field={item.fields.Icon}
                            className={styles.popUnderOfferIcon}
                            data-tid='popunder-option-icon'
                        />
                    )}
                    {!!item.fields?.Title?.value && (
                        <Text
                            field={item.fields.Title}
                            tag='p'
                            className={styles.popUnderOfferTitle}
                            data-tid='popunder-option-title'
                        />
                    )}
                </div>
            );
        });

    return (
        <div className={className}>
            <div className={styles.popUnderOffersRow} data-tid='popunder-options-row'>
                {renderRow(row1)}
            </div>
            {!!row1?.length && <div className={styles.popUnderLineSeparator} data-tid='popunder-options-separator' />}
            <div className={styles.popUnderOffersRow} data-tid='popunder-options-row'>
                {renderRow(row2)}
            </div>
        </div>
    );
};

export default PopUnderOfferOptions;
