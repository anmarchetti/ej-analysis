import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SearchFilterStore from 'frontend/store/holidays/search/SearchFiltersStore';
import TradePortalSearchFilterStore from 'frontend/store/tradePortal/search/TradePortalSearchFiltersStore';
import { IFilterOption } from 'models/data/IFilters';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import FilterCheckControl from 'frontend/components/common/LeftHandFilter/FilterContent/GroupContent/BaseCheckboxGroup/FilterCheckControl/FilterCheckControl';
import { TLeftHandFilterStoreInstance } from 'frontend/components/common/LeftHandFilter/FilterContent/models';
import TripadvisorRating from 'frontend/components/common/TripadvisorRating/TripadvisorRating';

import styles from './StarRatings.module.scss';

interface ITripAdvisorRatingsProps {
    storeInstance: TLeftHandFilterStoreInstance;
}

const TRIP_ADVISOR_FILTER_OPTIONS_COUNT = 4;
const TRIP_ADVISOR_MAX_STARS = 5;
const RATING = [...new Array(TRIP_ADVISOR_FILTER_OPTIONS_COUNT).keys()];
const TWO_STAR_CODE = '2';
const THREE_STAR_CODE = '3';

const TripAdvisorRatings: FC<ITripAdvisorRatingsProps> = ({ storeInstance }) => {
    const { getPhrase, getFormattedNumber } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        getFormattedNumber: stores.marketStore.getFormattedNumber,
        isAmendHotelPage: stores.layoutStore.isAmendHotelPage,
    }));

    const { onChange, isOptionDisabled, isFilterGroupSelected, getPreparedGroupContent, isCountHidden } = storeInstance;
    const content = getPreparedGroupContent(FilterGroupCodes.TripAdvisorRating);
    const contentByCode: Record<string, IFilterOption> = Object.fromEntries(content.map(i => [i.code, i]));
    const isSearchFiltersStore = [SearchFilterStore, TradePortalSearchFilterStore].some(
        Store => storeInstance instanceof Store,
    );
    const tripAdvisorRatingListItems = RATING.reduce<IFilterOption[]>((acc, i) => {
        const starAmount = TRIP_ADVISOR_MAX_STARS - i;
        const item = contentByCode[starAmount];

        if (!item) {
            return acc;
        }

        // INS-1518: [LH Filters] Remove Trip Advisor duplicate 2-star rating
        const shouldExcludeTwoStarOption =
            item.code === TWO_STAR_CODE &&
            contentByCode[TWO_STAR_CODE]?.count === contentByCode[THREE_STAR_CODE]?.count;

        if (isSearchFiltersStore && shouldExcludeTwoStarOption) {
            return acc;
        }

        acc.push(item);

        return acc;
    }, []);

    const renderTripAdvisorLabel = (option: IFilterOption): JSX.Element => (
        <>
            <TripadvisorRating rating={parseInt(option.code)} />
            <span className='checkbox-item__text'>
                {option.code === String(TRIP_ADVISOR_MAX_STARS)
                    ? getPhrase(SitecoreDictionary.SearchPodFiltersLabelsOnly)
                    : getPhrase(SitecoreDictionary.SearchPodFiltersLabelsAndUp)}
            </span>
            {!isCountHidden && <span className='count'>({getFormattedNumber(option.count)})</span>}
        </>
    );

    if (tripAdvisorRatingListItems.length === 0) {
        return null;
    }

    return (
        <div className={styles.starRatingContainer}>
            <p className={styles.ratingTitle} data-tid='trip-advisor-rating-header'>
                {getPhrase(SitecoreDictionary.SearchPodFiltersTitlesTripAdvisorRatingSubtitle)}
            </p>

            <div className='rating-block__list' data-tid='trip-advisor-rating'>
                {tripAdvisorRatingListItems.map((option: IFilterOption) => (
                    <FilterCheckControl
                        key={option.code}
                        option={option}
                        checked={isFilterGroupSelected(option)}
                        onChange={(): void => onChange(option)}
                        disabled={isOptionDisabled(option.count, FilterGroupCodes.TripAdvisorRating)}
                        label={renderTripAdvisorLabel(option)}
                        isRadioButton
                    />
                ))}
            </div>
        </div>
    );
};

export default observer(TripAdvisorRatings);
