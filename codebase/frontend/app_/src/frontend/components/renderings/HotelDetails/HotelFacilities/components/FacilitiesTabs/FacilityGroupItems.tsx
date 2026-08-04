import React, { FC } from 'react';
import classNames from 'classnames';

import { cmsUrls } from 'code/endpoints';
import settings from 'code/settings';
import { IFacility } from 'models/data/IHotel';

import styles from './FacilitiesTabPanel.module.scss';

interface IFacilityGroupItemsProps {
    items: IFacility[];
    isMultiColumnList?: boolean;
    isTopFacilitiesList?: boolean;
}

export const FacilityGroupItems: FC<IFacilityGroupItemsProps> = ({ items, isMultiColumnList, isTopFacilitiesList }) => {
    const itemsToShow = isTopFacilitiesList ? items.slice(0, settings.HotelDetails.MaxNumberOfTopFacilities) : items;

    return (
        <ul
            className={classNames({
                [styles.listCols]: isMultiColumnList,
                [styles.listTopFacilities]: isTopFacilitiesList,
            })}
        >
            {itemsToShow.map((item, i) => (
                <li key={item.id || i}>
                    {isTopFacilitiesList && !!item.icon && (
                        <span
                            className={classNames(styles.icon, 'icon--bg-image')}
                            style={{ backgroundImage: `url(${cmsUrls.media(item.icon)})` }}
                        />
                    )}

                    <span className={styles.itemTitle}>{item.name}</span>
                </li>
            ))}
        </ul>
    );
};

export default FacilityGroupItems;
