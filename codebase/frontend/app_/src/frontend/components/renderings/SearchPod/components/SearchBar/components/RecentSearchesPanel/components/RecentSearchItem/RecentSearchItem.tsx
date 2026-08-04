import * as React from 'react';
import { FC } from 'react';
import classNames from 'classnames';

import { IPrettyRecentSearch } from 'models/data/IPrettyRecentSearch';
import Button from 'frontend/components/common/Button';
import IconChevronRight from 'frontend/components/icons/ChevronRight';
import SvgCross from 'frontend/components/icons-new/Cross';
import styles from 'frontend/components/renderings/SearchPod/components/SearchBar/components/RecentSearchesPanel/components/RecentSearchItem/RecentSearchItem.module.scss';

export interface IRecentSearchItemProps {
    item: IPrettyRecentSearch;
    onClear: () => void;
    onClick: () => void;
    isLoadingDestination?: boolean;
    isSelected?: boolean;
}

const RecentSearchItem: FC<IRecentSearchItemProps> = ({ item, onClear, onClick, isLoadingDestination, isSelected }) => (
    <li className={classNames(styles.itemList, isSelected && styles.selected)} data-tid='recent-search-item'>
        <Button isText isTransparent className={styles.clearBtn} dataTid='clear-search-btn' onClick={onClear}>
            <span className='visually-hidden' />
            <SvgCross />
        </Button>
        <Button isText isTransparent isFullWidth className={styles.item} onClick={onClick}>
            <span className={styles.content} data-tid='recent-search-item-content'>
                <span>{item.from}</span>
                <span>
                    {isLoadingDestination ? (
                        <span className={classNames('placeholder-shimmer', styles.loadingDestination)} />
                    ) : (
                        <b>{item.to}</b>
                    )}
                </span>
                <span>{`${item.when}, ${item.duration}`}</span>
                <span>{item.who}</span>
            </span>
            <IconChevronRight />
        </Button>
    </li>
);

export default RecentSearchItem;
