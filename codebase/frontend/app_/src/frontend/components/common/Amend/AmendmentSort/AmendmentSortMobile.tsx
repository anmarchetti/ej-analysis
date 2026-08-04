import { FC, useEffect, useState } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { ISelectOption } from 'models/data/ISelectOption';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import { AlternativeHotelsSortingOptions } from 'models/enum/AlternativeHotelsSortingOptions';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import SvgSortBy from 'frontend/components/icons/SortBy';
import SvgTick from 'frontend/components/icons-new/Tick';

import styles from './AmendmentSort.module.scss';

type TSortBy = AlternativeFlightsSortBy | AlternativeHotelsSortingOptions;
interface IAmendmentSortMobileProps {
    onApplySortBy: (sortBy: TSortBy) => void;
    options: ISelectOption[];
    sortBy: TSortBy;
    isDisabled?: boolean;
    isHotelChangeFlow?: boolean;
    wrapperClassName?: string;
}

export const AmendmentSortMobile: FC<IAmendmentSortMobileProps> = ({
    options,
    sortBy,
    onApplySortBy,
    wrapperClassName,
    isDisabled,
    isHotelChangeFlow,
}) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<ISelectOption>();

    const isSelectedOption = (option: ISelectOption) => selectedOption?.value === option.value;
    const ApplyCTAText = getPhrase(
        isHotelChangeFlow
            ? SitecoreDictionary.GlobalsButtonsApply
            : SitecoreDictionary.SearchPodFiltersButtonsApplyAndSeeResults,
    );

    const onApplyClick = () => {
        // Apply changes if drawer selected option is different from already applied sortBy
        if (selectedOption && selectedOption.value !== sortBy) {
            onApplySortBy(selectedOption.value as TSortBy);
        }

        setIsDrawerOpen(false);
    };

    const onCancelClick = () => {
        setIsDrawerOpen(false);
    };

    useEffect(() => {
        // Select applied sortBy when drawer opens
        if (isDrawerOpen && sortBy !== selectedOption?.value) {
            const opt = options.find(o => o.value === sortBy);
            setSelectedOption(opt);
        }
    }, [isDrawerOpen, sortBy, options]);

    return (
        <div className={wrapperClassName}>
            <Button
                isText
                onClick={() => setIsDrawerOpen(true)}
                className='search-pod-filter__button'
                disabled={isDisabled}
                dataTid='sort-by-cta'
            >
                <i>
                    <SvgSortBy />
                </i>
                {getPhrase(SitecoreDictionary.SearchResultsLabelsSortBy)}
            </Button>
            <Drawer
                className={
                    (classNames(styles.drawerWrap),
                    {
                        [styles.drawerChangeHotel]: isHotelChangeFlow,
                    })
                }
                open={isDrawerOpen}
                isInDrawer
            >
                <div className={classNames(styles.drawerContent)}>
                    <h4 className={styles.drawerContentTitle}>
                        {getPhrase(SitecoreDictionary.SearchResultsLabelsSortBy)}
                    </h4>
                    <div className={styles.drawerContentList}>
                        {options.map((option: ISelectOption) => (
                            <button
                                data-tid={`amend-sort-mobile-item-${option.value?.toString().toLowerCase()}`}
                                key={option.value}
                                className={classNames(
                                    styles.drawerContentListItem,
                                    isSelectedOption(option) && styles.active,
                                )}
                                onClick={() => setSelectedOption(option)}
                            >
                                {option.label}
                                {isSelectedOption(option) && (
                                    <i className={styles.activeIcon}>
                                        <SvgTick />
                                    </i>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
                {isDrawerOpen && (
                    <div className='drawer__actions'>
                        <Button
                            isTransparent
                            isFullWidth
                            onClick={onCancelClick}
                            className={styles.sortByCancelButton}
                            dataTid='amend-sort-mobile-cancel-btn'
                        >
                            {getPhrase(SitecoreDictionary.GlobalsButtonsCancel)}
                        </Button>
                        <Button
                            isFullWidth
                            onClick={onApplyClick}
                            className={styles.sortByApplyButton}
                            dataTid='amend-sort-mobile-apply-btn'
                        >
                            {ApplyCTAText}
                        </Button>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default AmendmentSortMobile;
