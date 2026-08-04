import { FC, useMemo, useRef } from 'react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IFilterOption } from 'models/data/IFilters';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { AnimatedWrapper } from 'frontend/components/common/AnimatedWrapper/AnimatedWrapper';
import Button from 'frontend/components/common/Button';

import styles from './GroupTitle.module.scss';

interface IFilterTitleClearProps {
    code: FilterGroupCodes;
    countableFilters: IFilterOption[];
    onRemoveAllFilterGroup: (filterGroupCode: string) => void;
}

const FilterTitleClear: FC<IFilterTitleClearProps> = ({ countableFilters, code, onRemoveAllFilterGroup }) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const isMobile = useMobileViewport();
    const skipAnimationRef = useRef<boolean>(true);

    const filterCount = useMemo(
        () =>
            (countableFilters || []).filter(el => {
                const { groupCode } = el;

                if (groupCode === code) {
                    return true;
                }

                switch (code) {
                    case FilterGroupCodes.FlightTimes:
                        return [FilterGroupCodes.OutboundDepartureTime, FilterGroupCodes.InboundDepartureTime].includes(
                            groupCode,
                        );
                    case FilterGroupCodes.StarRating:
                    case FilterGroupCodes.TripAdvisorRating:
                        return [FilterGroupCodes.StarRating, FilterGroupCodes.TripAdvisorRating].includes(groupCode);
                    case FilterGroupCodes.HotelTypes:
                        return groupCode === FilterGroupCodes.PromoCollection;
                    default:
                        return false;
                }
            }).length,
        [countableFilters, code],
    );

    const hasActiveFilters = filterCount > 0;

    // Disable animation on mobile only for active filters.
    const disableAnimation = isMobile && skipAnimationRef.current && hasActiveFilters;

    // Track that we've displayed the filters, future changes will animate.
    // hasActiveFilters to prevent triggering animation when component re-renders.
    if (!hasActiveFilters) {
        skipAnimationRef.current = false;
    }

    const handleClearClick = (e: React.MouseEvent): void => {
        e.stopPropagation();
        onRemoveAllFilterGroup(code);
    };

    return (
        <div className={styles.titleClear}>
            <AnimatedWrapper
                isShown={hasActiveFilters}
                entranceClass={styles.counterEntrance}
                exitClass={styles.counterExit}
                disableAnimation={disableAnimation}
            >
                <div className={styles.filterCount}>{filterCount}</div>
            </AnimatedWrapper>

            <AnimatedWrapper
                isShown={hasActiveFilters}
                entranceClass={styles.clearEntrance}
                exitClass={styles.clearExit}
                disableAnimation={disableAnimation}
            >
                <Button isTransparent onClick={handleClearClick} dataTid={`clear-${code}`}>
                    {getPhrase(SitecoreDictionary.SearchPodFiltersButtonsClearAppliedFiltersOnMobile)}
                </Button>
            </AnimatedWrapper>
        </div>
    );
};

export default FilterTitleClear;
