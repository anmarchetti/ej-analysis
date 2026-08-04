import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ICabinBagsFields } from 'models/data/ICabinBagsFields';
import JSSImage from 'frontend/components/common/JSSImage';

import styles from './IncludedBagsRow.module.scss';

export interface IIncludedBagsRowProps {
    fields: ICabinBagsFields;
    withInfant: boolean;
}

export const IncludedBagsRow: FC<IIncludedBagsRowProps> = ({ fields, withInfant }) => {
    const { IncludedIcon, SmallBagDropdownLabel, SmallBagDropdownWithInfantLabel } = fields;

    return (
        <div className={styles.includedBag} data-tid='lcb-price-panel-included-bags'>
            <span className={styles.extraBag}>
                <JSSImage data-tid='included-bag-icon' field={IncludedIcon} className={styles.icon} />
                <div>
                    <Text
                        field={withInfant ? SmallBagDropdownWithInfantLabel : SmallBagDropdownLabel}
                        tag='span'
                        data-tid='small-bag-dropdown-label'
                    />
                </div>
            </span>
        </div>
    );
};

export default IncludedBagsRow;
