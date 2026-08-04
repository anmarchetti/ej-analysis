import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { AlternativeHotelsSortingOptions } from 'models/enum/AlternativeHotelsSortingOptions';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import AmendmentSort from 'frontend/components/common/Amend/AmendmentSort/AmendmentSort';
import Button from 'frontend/components/common/Button';
import SvgFilterLined from 'frontend/components/icons-new/FilterLined';
import SvgTick from 'frontend/components/icons-new/Tick';
import { IAmendHotelFields } from 'frontend/components/renderings/AmendHotel/AmendHotel';
import NumberOfHotelsTitle from 'frontend/components/renderings/AmendHotel/components/AlternativeHotelsHeader/componetns/NumberOfHotelsTitle';

import styles from './AlternativeHotelsHeader.module.scss';

export interface IAlternativeHotelsHeaderProps {
    fields: IAmendHotelFields;
}

const AlternativeHotelsHeader: FC<IAlternativeHotelsHeaderProps> = ({ fields }) => {
    const {
        selectedSortingOption,
        setSortingOption,
        totalNumberOfHotels,
        isLoading,
        getPhrase,
        toggleFilterMobileDrawer,
        areFiltersSelected,
    } = useStore((store: IHolidaysStores) => ({
        getPhrase: store.layoutStore.getPhrase,
        selectedSortingOption: store.amendHotelStore.selectedSortingOption,
        areFiltersSelected: store.amendHotelStore.filters.areFiltersSelected,
        setSortingOption: store.amendHotelStore.setSortingOption,
        totalNumberOfHotels: store.amendHotelStore.totalNumberOfHotels,
        isLoading: store.amendHotelStore.isLoading,
        toggleFilterMobileDrawer: store.amendHotelStore.filters.toggleFilterMobileDrawer,
    }));

    const isSmallScreen = useMobileViewport();

    const { AlternativeHotelsTitle, AlternativeHotelsSubtitle, PriceHighToLow, PriceLowToHigh, TripAdvisor } = fields;

    const numberOfHotelsTitle = Tokenizer.replaceToken(
        AlternativeHotelsSubtitle.value,
        Tokens.Number,
        totalNumberOfHotels?.toString(),
    );

    const selectOptions = [
        {
            label: PriceHighToLow.value,
            value: AlternativeHotelsSortingOptions.PriceHighToLow,
        },
        {
            label: PriceLowToHigh.value,
            value: AlternativeHotelsSortingOptions.PriceLowToHigh,
        },
        {
            label: TripAdvisor.value,
            value: AlternativeHotelsSortingOptions.TripAdvisor,
        },
    ];

    const selectedSortOption = selectOptions.find(option => option.value === selectedSortingOption);

    const wrapCountAndFilters = (child: JSX.Element): JSX.Element =>
        isSmallScreen ? (
            child
        ) : (
            <div data-tid='count-and-filters' className={styles.countAndFilters}>
                {child}
            </div>
        ); //filters are sticky on mobile, but on md+ it flex reverse.

    return (
        <>
            <Text field={AlternativeHotelsTitle} tag='h2' data-tid='alternative-hotels-title' />
            {wrapCountAndFilters(
                <>
                    <div
                        className={classNames(styles.subsection, {
                            [styles.sticky]: isSmallScreen && areFiltersSelected,
                        })}
                    >
                        <div className={styles.filterAndSortWrap}>
                            {isSmallScreen && (
                                <>
                                    <Button
                                        isText
                                        onClick={toggleFilterMobileDrawer}
                                        className='search-pod-filter__button'
                                        dataTid='filter-button'
                                        disabled={isLoading}
                                    >
                                        <i className={styles.filterIcon}>
                                            <SvgFilterLined />
                                        </i>
                                        <span>{getPhrase(SitecoreDictionary.SearchPodFiltersTitlesFilters)}</span>
                                        {areFiltersSelected && (
                                            <i className={styles.activeIcon}>
                                                <SvgTick />
                                            </i>
                                        )}
                                    </Button>
                                    <div className={styles.divider} />
                                </>
                            )}

                            <AmendmentSort
                                selectedSortOption={selectedSortOption}
                                options={selectOptions}
                                sortBy={selectedSortingOption}
                                isDisabled={isLoading}
                                onChangeSortBy={setSortingOption}
                                isLoading={isLoading}
                                isHotelChangeFlow
                            />
                        </div>
                    </div>
                    <NumberOfHotelsTitle
                        title={numberOfHotelsTitle}
                        isLoading={isLoading}
                        className={styles.subtitle}
                        shimmerClassName={styles.numbersOfHotelsShimmer}
                    />
                </>,
            )}
        </>
    );
};
export default observer(AlternativeHotelsHeader);
