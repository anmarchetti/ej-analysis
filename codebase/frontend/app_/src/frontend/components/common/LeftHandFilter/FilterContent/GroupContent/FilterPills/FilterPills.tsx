import { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SearchFilterStore from 'frontend/store/holidays/search/SearchFiltersStore';
import { TStores } from 'frontend/store/IStores';
import TradePortalSearchFilterStore from 'frontend/store/tradePortal/search/TradePortalSearchFiltersStore';
import { getFilterOptionByCode } from 'frontend/utils/filter.utils';
import { IFilterOption } from 'models/data/IFilters';
import { FilterGroupCodes, RADIO_FILTER_CODES } from 'models/enum/FilterGroupCodes';
import Checkbox from 'frontend/components/common/Checkbox';

import styles from './FilterPills.module.scss';

export interface IFilterPillsProps {
    code: FilterGroupCodes.RecentlyUsed | FilterGroupCodes.Recommended;
    getLabel: (option: IFilterOption) => string;
    storeInstance: SearchFilterStore | TradePortalSearchFilterStore;
}
export const FilterPills: FC<IFilterPillsProps> = ({ storeInstance, code, getLabel }) => {
    const { trackSearchFiltersUpdate } = useStore((stores: TStores) => ({
        trackSearchFiltersUpdate: stores.trackingStore.trackSearchFiltersUpdate,
    }));
    const { onChange, isOptionDisabled, isFilterGroupSelected, getPreparedGroupContent, onClear, filters } =
        storeInstance;
    const content = getPreparedGroupContent(code);

    const handleChange = (option: IFilterOption): void => {
        if (RADIO_FILTER_CODES.includes(option.groupCode) && isFilterGroupSelected(option)) {
            onClear(option.groupCode);
            trackSearchFiltersUpdate(false, option, code);

            return;
        }

        onChange(option, code);
    };

    return (
        <div className={classNames(styles.wrapper)}>
            {content.map(option => {
                // Recommended filters don’t need to be filtered against actual options, since they are provided by the backend.
                const optionToProcess =
                    code === FilterGroupCodes.RecentlyUsed
                        ? getFilterOptionByCode(filters, option.groupCode, option)
                        : option;

                if (!optionToProcess) {
                    return null;
                }

                const isDisabled = isOptionDisabled(optionToProcess.count, optionToProcess.groupCode, optionToProcess);

                return (
                    <Checkbox
                        key={option.code}
                        className={classNames(styles.option, isDisabled && styles.disabled)}
                        checkedClassName={styles.checked}
                        disabled={isDisabled}
                        checked={isFilterGroupSelected(option)}
                        onChange={(): void => handleChange(option)}
                        isPillStyle
                        medium
                        dataTid={`${option.groupCode}-${code}-option`}
                    >
                        {getLabel(option)}
                    </Checkbox>
                );
            })}
        </div>
    );
};

export default observer(FilterPills);
