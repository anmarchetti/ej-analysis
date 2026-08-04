import SearchFilterStore from 'frontend/store/holidays/search/SearchFiltersStore';
import TradePortalSearchFilterStore from 'frontend/store/tradePortal/search/TradePortalSearchFiltersStore';
import { FILTER_GROUP_CODES, FilterGroupCodes, NO_CHECKBOX_GROUPS } from 'models/enum/FilterGroupCodes';
import { TLeftHandFilterStoreInstance } from 'frontend/components/common/LeftHandFilter/FilterContent/models';

import RecentlyUsed from './RecentlyUsed/RecentlyUsed';
import Recommended from './Recommended/Recommended';
import RatingGroup from './StarRatings/RatingGroup';
import Weather from './Weather/Weather';
import BaseCheckboxGroup from './BaseCheckboxGroup';
import Destination from './Destination';
import Facilities from './Facilities';
import FlightDuration from './FlightDuration';
import FlightTimes from './FlightTimes';
import PriceFilter from './PriceFilter';

import styles from './GroupContent.module.scss';

const MAX_HEIGHT = 480;

export const addScrollbarToParentIfNeeded = (el: Nullable<HTMLDivElement>): void => {
    if (el === null) return;

    const { id, parentElement, clientHeight } = el as HTMLDivElement;

    const isScrollableGroup =
        (id === FilterGroupCodes.Destination || id === FilterGroupCodes.Facilities) && clientHeight > MAX_HEIGHT;

    if (isScrollableGroup) {
        parentElement!.classList.add(styles.filterGroupScroll);
    }
};

export const renderContent = (
    code: FilterGroupCodes,
    storeInstance: TLeftHandFilterStoreInstance,
): Nullable<JSX.Element> => {
    switch (code) {
        case FilterGroupCodes.StarRating:
        case FilterGroupCodes.TripAdvisorRating: {
            return <RatingGroup storeInstance={storeInstance} triggeringCode={code} />;
        }

        case FilterGroupCodes.PriceRange: {
            return <PriceFilter />;
        }

        case FilterGroupCodes.PackageTheme:
        case FilterGroupCodes.Destination: {
            return <Destination code={code} storeInstance={storeInstance} />;
        }

        case FilterGroupCodes.Recommended: {
            const isSearchFiltersStore = [SearchFilterStore, TradePortalSearchFilterStore].some(
                Store => storeInstance instanceof Store,
            );

            return isSearchFiltersStore ? <Recommended storeInstance={storeInstance} /> : null;
        }

        case FilterGroupCodes.RecentlyUsed: {
            const isSearchFiltersStore = [SearchFilterStore, TradePortalSearchFilterStore].some(
                Store => storeInstance instanceof Store,
            );

            return isSearchFiltersStore ? <RecentlyUsed storeInstance={storeInstance} /> : null;
        }

        case FilterGroupCodes.FlightDuration: {
            return <FlightDuration />;
        }

        case FilterGroupCodes.Facilities: {
            return <Facilities storeInstance={storeInstance} />;
        }

        case FilterGroupCodes.FlightTimes: {
            return <FlightTimes />;
        }

        case FilterGroupCodes.Weather: {
            return <Weather />;
        }

        default: {
            if (FILTER_GROUP_CODES.has(code) && !NO_CHECKBOX_GROUPS.has(code))
                return <BaseCheckboxGroup storeInstance={storeInstance} code={code} />;

            return null;
        }
    }
};
