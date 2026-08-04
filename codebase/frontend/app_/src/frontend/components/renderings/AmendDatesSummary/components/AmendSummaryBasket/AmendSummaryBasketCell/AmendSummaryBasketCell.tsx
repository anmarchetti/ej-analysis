import React from 'react';
import classnames from 'classnames';

import {
    default as AmendSummaryBasketCellItem,
    IAmendSummaryBasketCellItemProps,
} from './BasketCellItem/BasketCellItem';

import styles from './AmendSummaryBasketCell.module.scss';

interface IAmendSummaryBasketCellProps {
    items: IAmendSummaryBasketCellItemProps[];
    className?: string;
    withRightSeparator?: boolean;
}

const AmendSummaryBasketCell = ({ items, withRightSeparator, className }: IAmendSummaryBasketCellProps) => (
    <div
        className={classnames(className, {
            [styles.cell]: true,
            [styles.withSeparator]: withRightSeparator,
        })}
    >
        <div className={styles.list}>
            {items.map(item => (
                <AmendSummaryBasketCellItem {...item} key={item.key} />
            ))}
        </div>
        {withRightSeparator && <div className={styles.separator} />}
    </div>
);

export default AmendSummaryBasketCell;
