import { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { isLabelHidden } from 'frontend/utils/filter.utils';
import { IFilterOption } from 'models/data/IFilters';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import styles from 'frontend/components/common/LeftHandFilter/FilterContent/GroupContent/GroupContent.module.scss';
import { TLeftHandFilterStoreInstance } from 'frontend/components/common/LeftHandFilter/FilterContent/models';

import FilterCheckControl from './FilterCheckControl';

interface IBaseCheckboxGroup {
    code: FilterGroupCodes;
    storeInstance: TLeftHandFilterStoreInstance;
}

const BaseCheckboxGroup: FC<IBaseCheckboxGroup> = ({ code, storeInstance }) => {
    const { getSetting } = useStore((stores: IHolidaysStores) => ({
        getSetting: stores.layoutStore.getSetting,
    }));

    const {
        onChange,
        isOptionDisabled,
        isFilterGroupSelected,
        getPreparedGroupContent,
        isCountHidden: isCountHiddenByStore,
    } = storeInstance;

    const content = getPreparedGroupContent(code);
    const isCountHidden = isCountHiddenByStore || isLabelHidden(code, getSetting);

    return (
        <div className={classNames(styles.checkboxGroup, { 'duration-filter': code === FilterGroupCodes.Duration })}>
            {content.map((option: IFilterOption) => (
                <FilterCheckControl
                    key={option.code}
                    option={option}
                    checked={isFilterGroupSelected(option)}
                    onChange={(): void => onChange(option)}
                    disabled={isOptionDisabled(option.count, code, option)}
                    isRadioButton={code === FilterGroupCodes.Duration}
                    hideLabelCount={isCountHidden}
                />
            ))}
        </div>
    );
};

export default observer(BaseCheckboxGroup);
