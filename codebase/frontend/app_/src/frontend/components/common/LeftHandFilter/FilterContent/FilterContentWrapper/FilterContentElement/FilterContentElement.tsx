import React, { FC } from 'react';
import { observer } from 'mobx-react';

import { IFilters } from 'models/data/IFilters';
import AnimatedWrapper from 'frontend/components/common/AnimatedWrapper/AnimatedWrapper';
import GroupContent from 'frontend/components/common/LeftHandFilter/FilterContent/GroupContent';
import GroupContentStyles from 'frontend/components/common/LeftHandFilter/FilterContent/GroupContent/GroupContent.module.scss';
import GroupTitle from 'frontend/components/common/LeftHandFilter/FilterContent/GroupTitle';
import { TLeftHandFilterStoreInstance } from 'frontend/components/common/LeftHandFilter/FilterContent/models';

interface IFilterContentElementProps {
    group: IFilters;
    storeInstance: TLeftHandFilterStoreInstance;
}

const FilterContentElement: FC<IFilterContentElementProps> = ({ storeInstance, group }) => {
    const { onClear, onTitleClick, isFilterGroupActive, isFilterGroupDisabled, countableFilters } = storeInstance;

    const isDisabled = isFilterGroupDisabled(group);
    const isActive = !isDisabled && isFilterGroupActive(group);

    return (
        <React.Fragment key={group.code}>
            <GroupTitle
                countableFilters={countableFilters}
                code={group.code}
                isActive={isActive}
                isDisabled={isDisabled}
                onClick={onTitleClick}
                onRemoveAllFilterGroup={onClear}
                name={group.name}
            />

            <AnimatedWrapper
                isShown={isActive}
                entranceClass={GroupContentStyles.isOpen}
                exitClass={GroupContentStyles.isClosed}
            >
                <GroupContent storeInstance={storeInstance} code={group.code} />
            </AnimatedWrapper>
        </React.Fragment>
    );
};

export default observer(FilterContentElement);
