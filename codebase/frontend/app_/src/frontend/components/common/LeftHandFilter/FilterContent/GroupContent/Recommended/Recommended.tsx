import { FC } from 'react';

import SearchFilterStore from 'frontend/store/holidays/search/SearchFiltersStore';
import TradePortalSearchFilterStore from 'frontend/store/tradePortal/search/TradePortalSearchFiltersStore';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import FilterPills from 'frontend/components/common/LeftHandFilter/FilterContent/GroupContent/FilterPills/FilterPills';

interface IRecommendedProps {
    storeInstance: SearchFilterStore | TradePortalSearchFilterStore;
}
const Recommended: FC<IRecommendedProps> = ({ storeInstance }) => (
    <FilterPills
        storeInstance={storeInstance}
        code={FilterGroupCodes.Recommended}
        getLabel={(option): string => option.name || option.code}
    />
);

export default Recommended;
