import { FC } from 'react';

import SearchFilterStore from 'frontend/store/holidays/search/SearchFiltersStore';
import TradePortalSearchFilterStore from 'frontend/store/tradePortal/search/TradePortalSearchFiltersStore';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import FilterPills from 'frontend/components/common/LeftHandFilter/FilterContent/GroupContent/FilterPills/FilterPills';

interface IRecentlyUsedProps {
    storeInstance: SearchFilterStore | TradePortalSearchFilterStore;
}
const RecentlyUsed: FC<IRecentlyUsedProps> = ({ storeInstance }) => (
    <FilterPills
        storeInstance={storeInstance}
        code={FilterGroupCodes.RecentlyUsed}
        getLabel={(option): string => option.fullName || option.name || option.code}
    />
);

export default RecentlyUsed;
