import React from 'react';

import styles from './BasketCellItem.module.scss';

export interface IAmendSummaryBasketCellItemProps {
    key: string;
    name: React.ReactNode;
    dataTid?: string;
    icon?: React.ReactNode;
}

const AmendSummaryBasketCellItem = ({ name, icon, dataTid }: IAmendSummaryBasketCellItemProps) => (
    <div className={styles.item} data-tid={dataTid}>
        <span className={styles.icon}>{icon}</span>

        <div className={styles.name}>{name}</div>
    </div>
);

export default AmendSummaryBasketCellItem;
