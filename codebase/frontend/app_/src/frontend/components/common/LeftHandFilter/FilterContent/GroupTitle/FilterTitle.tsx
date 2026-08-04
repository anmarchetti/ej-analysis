import { FC } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays/create-stores';
import { getFilterTitle } from 'frontend/utils/filter.utils';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import IconChevronDown from 'frontend/components/icons/ChevronDown';
import IconChevronUp from 'frontend/components/icons/ChevronUp';

import FilterTitleClear from './FilterTitleClear';

import styles from './GroupTitle.module.scss';

export interface IFilterTitleProps {
    code: FilterGroupCodes;
    countableFilters: any;
    isActive: boolean;
    isDisabled: boolean;
    name: FilterGroupCodes;
    onClick: (code: FilterGroupCodes) => void;
    onRemoveAllFilterGroup: (filterGroupCode: string) => void;
}

const FilterTitle: FC<IFilterTitleProps> = ({
    code,
    onClick,
    isActive,
    isDisabled,
    countableFilters,
    onRemoveAllFilterGroup,
    name,
}) => {
    const { getPhrase } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const tileClassName = classNames('btn', {
        [styles.filterTitleButton]: true,
        [styles.disabled]: isDisabled,
        [styles.active]: isActive,
    });

    const titlePhrase = getFilterTitle(name);
    const title = titlePhrase.length ? getPhrase(titlePhrase) : '';

    const iconClassName = classNames('icon', isActive && 'icon--active');

    const onClickMethod = () => !isDisabled && onClick(code);

    return (
        <button className={tileClassName} onClick={onClickMethod} data-tid={code}>
            <div className={styles.left}>
                <span className={styles.title}>{title}</span>
            </div>

            <div className={styles.right}>
                <FilterTitleClear
                    countableFilters={countableFilters}
                    code={code}
                    onRemoveAllFilterGroup={onRemoveAllFilterGroup}
                />

                <i className={iconClassName} data-tid='filter-title-icon'>
                    {isActive ? <IconChevronUp /> : <IconChevronDown />}
                </i>
            </div>
        </button>
    );
};

export default FilterTitle;
