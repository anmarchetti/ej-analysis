import React, { FC, useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { ISelectOption } from 'models/data/ISelectOption';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import SvgSortBy from 'frontend/components/icons/SortBy';
import SvgTick from 'frontend/components/icons-new/Tick';

import styles from './BookingsSortMobile.module.scss';

type TBookingsSortMobileProps = {
    isSortByDisabled: boolean;
    onApplySortBy: (option: ISelectOption) => void;
    options: ISelectOption[];
    sortBy: ISelectOption;
};

export const BookingsSortMobile: FC<TBookingsSortMobileProps> = ({
    options,
    sortBy,
    onApplySortBy,
    isSortByDisabled,
}) => {
    const { getPhrase } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<ISelectOption>(sortBy);

    useEffect(() => {
        setSelectedOption(sortBy);
    }, [sortBy]);

    const isSelectedOption = (option: ISelectOption): boolean => selectedOption?.value === option.value;

    const onApplyClick = (): void => {
        // Apply changes if drawer selected option is different from already applied sortBy
        if (selectedOption && selectedOption !== sortBy) {
            onApplySortBy(selectedOption);
        }

        setIsDrawerOpen(false);
    };

    const onCancelClick = (): void => {
        setIsDrawerOpen(false);
        setSelectedOption(sortBy);
    };

    return (
        <div data-tid='bookings-sort-mobile' className={classNames('alternative-flights__sort', styles.sortByMobile)}>
            <Button
                isText
                disabled={isSortByDisabled}
                onClick={(): void => setIsDrawerOpen(true)}
                className={classNames(styles.openDrawerButton)}
            >
                <i>
                    <SvgSortBy />
                </i>
                {getPhrase(SitecoreDictionary.SearchResultsLabelsSortBy)}
            </Button>
            <Drawer open={isDrawerOpen}>
                <div className='drawer__content'>
                    <h4 className='drawer__content__title'>
                        {getPhrase(SitecoreDictionary.SearchResultsLabelsSortBy)}
                    </h4>
                    <ul className='drawer__content__list'>
                        {options.map((option: ISelectOption) => (
                            <li
                                key={option.value}
                                className={classNames(
                                    'drawer__content__list__item',
                                    isSelectedOption(option) && 'active',
                                )}
                                onClick={(): void => setSelectedOption(option)}
                            >
                                {option.label}
                                {isSelectedOption(option) && (
                                    <i className='active-icon'>
                                        <SvgTick />
                                    </i>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
                {isDrawerOpen && (
                    <div className='drawer__actions'>
                        <Button isTransparent isFullWidth onClick={onCancelClick}>
                            {getPhrase(SitecoreDictionary.GlobalsButtonsCancel)}
                        </Button>
                        <Button isFullWidth onClick={onApplyClick}>
                            {getPhrase(SitecoreDictionary.SearchPodFiltersButtonsApplyAndSeeResults)}
                        </Button>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default observer(BookingsSortMobile);
