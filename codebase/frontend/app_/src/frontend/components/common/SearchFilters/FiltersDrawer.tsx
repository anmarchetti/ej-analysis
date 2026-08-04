import React, { FC } from 'react';
import { inject } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { IFilterOption, IFilters, ISelectedFilter } from 'models/data/IFilters';
import { DataStatus } from 'models/enum/DataStatus';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';

import FilterContent from './FilterContent';

export interface IFiltersContainerProps extends IComponentWithDictionary {
    activeFilterCode: FilterGroupCodes;
    availableFilters: IFilters[];
    checkIsFilterSelected: (filter: IFilterOption) => boolean;
    isPromoPage: boolean;
    onApplyFilters: () => void;
    onCancel: () => void;
    onCloseFilters: () => void;
    onSelectFilters: (filters?: IFilterOption) => void;
    selectedDestinationCodesQuery: Nullable<string>;
    selectedFilters: ISelectedFilter[];
    status: DataStatus;
    onApply?: () => void;
}

const FiltersDrawer: FC<IFiltersContainerProps> = ({
    activeFilterCode,
    onSelectFilters,
    availableFilters,
    selectedFilters,
    status,
    checkIsFilterSelected,
    selectedDestinationCodesQuery,
    isPromoPage,
    getPhrase,
    onApply,
    onCancel,
    onCloseFilters,
}) => (
    <Drawer open={activeFilterCode !== FilterGroupCodes.NoFilter} isInDrawer>
        <div>
            <div className='drawer__content'>
                <FilterContent
                    codeFilters={activeFilterCode}
                    onSelectFilters={onSelectFilters}
                    availableFilters={availableFilters}
                    selectedFilters={selectedFilters}
                    status={status}
                    checkIsFilterSelected={checkIsFilterSelected}
                    selectedDestinationCodesQuery={selectedDestinationCodesQuery}
                    isPromoPage={isPromoPage}
                />
                {activeFilterCode === FilterGroupCodes.Duration && (
                    <div className='drawer__additional-text'>
                        {getPhrase(SitecoreDictionary.FilterTypesTextDurationFilterText)}
                    </div>
                )}
            </div>
            <div className='drawer__actions'>
                <Button isTransparent isFullWidth onClick={onCancel} dataTid='cancel-filter-btn'>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>
                <Button isFullWidth onClick={onApply || onCloseFilters} dataTid='apply-filter-btn'>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
                </Button>
            </div>
        </div>
    </Drawer>
);

const ConnectedFiltersDrawer = inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    isPromoPage: stores.layoutStore.isPromoPage,
}))(FiltersDrawer);

export default ConnectedFiltersDrawer;
