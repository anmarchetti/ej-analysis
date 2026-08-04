import { FC } from 'react';
import { observer } from 'mobx-react';

import { IFilterOption } from 'models/data/IFilters';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import FilterCheckControl from 'frontend/components/common/LeftHandFilter/FilterContent/GroupContent/BaseCheckboxGroup/FilterCheckControl';
import { TLeftHandFilterStoreInstance } from 'frontend/components/common/LeftHandFilter/FilterContent/models';

import styles from './Facilities.module.scss';

interface IFacilitiesProps {
    storeInstance: TLeftHandFilterStoreInstance;
}

const Facilities: FC<IFacilitiesProps> = ({ storeInstance }) => {
    const { onChange, isOptionDisabled, isFilterGroupSelected, getPreparedGroupContent, isCountHidden } = storeInstance;
    const content = getPreparedGroupContent(FilterGroupCodes.Facilities);

    return (
        <div>
            {content.map((option: IFilterOption) => (
                <div key={option.name}>
                    <div className={styles.treeGroupHeader} data-tid='facilities-group-header'>
                        {option.name}
                    </div>

                    <div className={styles.treeGroupItems}>
                        {(option.children || []).map((ch: IFilterOption) => (
                            <FilterCheckControl
                                key={ch.code}
                                option={ch}
                                checked={isFilterGroupSelected(ch)}
                                onChange={() => onChange(ch)}
                                disabled={isOptionDisabled(ch.count, FilterGroupCodes.Facilities)}
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

export default observer(Facilities);
