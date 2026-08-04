import React, { FC } from 'react';
import { observer } from 'mobx-react';

import SearchFilterStore from 'frontend/store/holidays/search/SearchFiltersStore';
import { IFilterOption } from 'models/data/IFilters';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import styles from 'frontend/components/common/LeftHandFilter/FilterContent/FilterContent.module.scss';
import FilterCheckControl from 'frontend/components/common/LeftHandFilter/FilterContent/GroupContent/BaseCheckboxGroup/FilterCheckControl/FilterCheckControl';

interface IDestinationContentProps {
    code: FilterGroupCodes.Destination | FilterGroupCodes.PackageTheme;
    storeInstance: SearchFilterStore;
}

const DestinationContent: FC<IDestinationContentProps> = ({ code, storeInstance }) => {
    const { onChange, isOptionDisabled, isFilterGroupSelected, getPreparedGroupContent, isCountHidden } = storeInstance;
    const content = getPreparedGroupContent(code);

    return (
        <div>
            {content.map((option: IFilterOption) => (
                <div key={option.code} className={styles.checkboxTreeGroup}>
                    <FilterCheckControl
                        option={option}
                        checked={isFilterGroupSelected(option)}
                        onChange={() => onChange(option)}
                        disabled={isOptionDisabled(option.count, code)}
                        hiddenZeroCount
                        hideLabelCount={isCountHidden}
                    />

                    <div className={styles.checkboxGroup}>
                        {(option.children || []).map((ch: IFilterOption) => (
                            <FilterCheckControl
                                key={ch.code}
                                option={ch}
                                checked={isFilterGroupSelected(ch)}
                                onChange={() => onChange(ch)}
                                disabled={isOptionDisabled(ch.count, code, ch)}
                                hiddenZeroCount
                                hideLabelCount={isCountHidden}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default observer(DestinationContent);
