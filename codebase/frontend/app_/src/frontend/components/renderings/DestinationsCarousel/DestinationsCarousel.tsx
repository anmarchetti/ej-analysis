import { FC, useCallback, useMemo, useState } from 'react';
import { ResponsiveType } from 'react-multi-carousel';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { findFilterOptionByCode } from 'frontend/utils/filter.utils';
import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import { IDestinationCarouselCard } from 'models/data/IDestinationCarousel';
import { IFilterOption } from 'models/data/IFilters';
import { DestinationType } from 'models/enum/DestinationType';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import { withRerender } from 'frontend/components/hoc';

import DestinationCard from './DestinationCard/DestinationCard';
import SliderButtonsGroup from './SliderButtonsGroup/SliderButtonsGroup';

import styles from './DestinationCarousel.module.scss';

interface IDestinationCarouselFields {
    Destinations: ISitecoreCompositeField<IDestinationCarouselCard>[];
    Title: ISitecoreField<string>;
}

type TDestinationCarouselProps = ISitecoreComponent<IDestinationCarouselFields>;

export interface ICountries {
    children: string[] | undefined;
    name: string;
}

export interface ICardItem {
    category: DestinationType;
    code: string;
    name: string;
    position: string;
    children?: IFilterOption[];
}

export enum SelectionMode {
    Single = 'Single Selection',
    Multiple = 'Multiple Selection',
}

const MIN_CAROUSEL_LENGTH = 4;
const RESPONSIVE: ResponsiveType = {
    desktop: { breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 992 }, items: 4, partialVisibilityGutter: 28 },
    tablet: { breakpoint: { max: 992, min: 767 }, items: 3, partialVisibilityGutter: 40 },
    smtablet: { breakpoint: { max: 767, min: 575 }, items: 2, partialVisibilityGutter: 75 },
    mobile: { breakpoint: { max: 575, min: 0 }, items: 1, partialVisibilityGutter: 90 },
};

const DestinationCarousel: FC<TDestinationCarouselProps> = ({ fields }) => {
    const [selectedCards, setSelectedCards] = useState<ICardItem[]>([]);
    const {
        allRegions,
        isScreenLarge,
        onSelectFilters,
        isFilterGroupSelected,
        setSeachPerformWithNewParams,
        clearIsClickBackToSearch,
        setPageNumber,
        fetchResults,
        setPrevPageNumber,
        trackEventWithParams,
        onChangeSearchFilterStore,
        selectedFilters,
        allDestinationFilters,
    } = useStore((stores: IHolidaysStores) => ({
        onSelectFilters: (filters?: IFilterOption) => stores.searchFiltersStore.onSelectFilters(filters, true),
        isFilterGroupSelected: stores.searchFiltersStore.isFilterGroupSelected,
        setSeachPerformWithNewParams: stores.searchStore.setSeachPerformWithNewParams,
        clearIsClickBackToSearch: stores.routerStore.clearIsClickBackToSearch,
        setPageNumber: stores.searchStore.setPageNumber,
        setPrevPageNumber: stores.searchStore.setPrevPageNumber,
        fetchResults: stores.hotelsStore.fetchOffers,
        allRegions: stores.searchStore.searchTo.countriesWithRegions,
        isScreenLarge: stores.appStore.isScreenLarge,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        selectedFilters: stores.searchFiltersStore.selectedFilters,
        allDestinationFilters: stores.searchFiltersStore.allDestinationFilters,
        onChangeSearchFilterStore: stores.searchFiltersStore.onChangeSearchFilterStore,
    }));

    const { Destinations, Title } = fields || {};

    const destinationCodes = useMemo(() => Destinations?.map(({ fields }) => fields?.Code?.value), [Destinations]);
    const filteredRegions = useMemo((): Nullable<ICountries[]> => {
        if (!allRegions || allRegions.length === 0) return null;

        return allRegions
            .filter(
                ({ children }) =>
                    children && children.filter(({ code }) => destinationCodes?.includes(code))?.length > 0,
            )
            .map(({ name, children }) => ({ name, children: children?.map(({ code }) => code) }));
    }, [allRegions, destinationCodes]);

    const getSelectedFilterByDestination = useCallback(
        (destination: ISitecoreCompositeField<IDestinationCarouselCard>) =>
            selectedFilters.find(
                el => el.code === destination.fields.Code.value && el.groupCode === FilterGroupCodes.Destination,
            ),
        [selectedFilters],
    );

    const selectedDestinationsForTracking = useMemo(
        (): ICardItem[] =>
            Destinations?.reduce((acc, destination, index) => {
                const filter = getSelectedFilterByDestination(destination);

                if (!filter) {
                    return acc;
                }

                const itemForTracking: ICardItem = {
                    code: destination.fields.Code.value,
                    name: destination.fields.Name.value,
                    position: `${index + 1}`,
                    category: filter?.destinationInfo?.type ?? DestinationType.Region,
                };

                return [...acc, itemForTracking];
            }, []) ?? [],
        [Destinations, getSelectedFilterByDestination],
    );

    if (!Destinations?.length) {
        return null;
    }

    const isMinDestinations = isScreenLarge && Destinations.length <= MIN_CAROUSEL_LENGTH;

    //Single selection for MVP, in the future might be able to select multiple cards
    const selectionMode = SelectionMode.Single;
    const isSingleSelectionMode = selectionMode === SelectionMode.Single;

    const getFilterObj = (cardItem: ICardItem, originFilter?: Nullable<IFilterOption>): IFilterOption => ({
        children: cardItem.children || originFilter?.children,
        code: cardItem.code,
        count: 1,
        destinationInfo: {
            parent: '',
            relatedRegions: [],
            relatedResorts: [],
            type: cardItem.category,
        },
        groupCode: FilterGroupCodes.Destination,
        name: cardItem.name,
        selected: true,
    });

    const onChangeFilters = (filters?: IFilterOption) => {
        onSelectFilters(filters);
        clearIsClickBackToSearch();
        setSeachPerformWithNewParams(true);
        setPageNumber(1);
        //simulate the initial render of the page
        setPrevPageNumber(null);
        onChangeSearchFilterStore({ key: 'filtersChanged', value: true });
        fetchResults(true);
    };

    const onSelectDestination = (selectedItem: ICardItem) => {
        let newSelectedCardsList: ICardItem[];
        const destinationsForTracking: ICardItem[] = [...selectedDestinationsForTracking];

        const originFilter = findFilterOptionByCode(allDestinationFilters, selectedItem.code);
        const selectedFilterObj = getFilterObj(selectedItem, originFilter);
        const isFilterSelected = isFilterGroupSelected(selectedFilterObj);

        const selectedCardItem: ICardItem = {
            code: selectedItem.code,
            name: selectedItem.name,
            position: selectedItem.position,
            category: selectedItem.category,
            children: originFilter?.children,
        };

        if (isSingleSelectionMode) {
            const prevSelectedItem = selectedCards[0];

            if (prevSelectedItem && prevSelectedItem.code !== selectedItem.code) {
                const prevSelectedFilterObj = getFilterObj(prevSelectedItem);
                const prevSelectedIndex = destinationsForTracking.findIndex(
                    dest => dest.code === prevSelectedFilterObj.code,
                );

                if (prevSelectedIndex > -1) {
                    destinationsForTracking.splice(prevSelectedIndex, 1);
                    onSelectFilters(prevSelectedFilterObj);
                }
            }

            newSelectedCardsList = [selectedCardItem];
        } else {
            newSelectedCardsList = selectedCards.some(item => item.name === selectedItem.name)
                ? [...selectedCards]
                : [...selectedCards, selectedCardItem];
        }

        // INS-182: deselected item should also be tracked
        // https://easyjet.atlassian.net/wiki/spaces/DA/pages/349145424/Promo+Destination+Carousel
        const trackingList = destinationsForTracking.some(item => item.name === selectedItem.name)
            ? [...destinationsForTracking]
            : [...destinationsForTracking, selectedCardItem];

        const { trackingItemsNames, trackingItemsPositions } = trackingList.reduce(
            (acc, item) => {
                acc.trackingItemsNames.push(item.name);
                acc.trackingItemsPositions.push(item.position);

                return acc;
            },
            { trackingItemsNames: [] as string[], trackingItemsPositions: [] as string[] },
        );

        onChangeFilters(selectedFilterObj);

        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.PromoDestinationCarousel,
                eventAction: isFilterSelected ? EventActions.CardDeselected : EventActions.CardSelected,
                eventLabel: selectedItem.name,
                eventType: EventTypes.Interaction,
                eventValue: null,
            },
            {
                genericValue1: trackingItemsPositions.join('|'),
                genericValue2: `${Destinations?.length}`,
                genericValue3: isSingleSelectionMode ? SelectionMode.Single : SelectionMode.Multiple,
                genericValue4: trackingItemsNames.join('|'),
            },
        );

        setSelectedCards(newSelectedCardsList);
    };

    return (
        <div className={styles.carouselWrapper} data-tid='destination-carousel'>
            {Title?.value && (
                <Text className={styles.carouselTitle} field={Title} tag='h3' data-tid='destination-carousel-title' />
            )}
            <div data-tid='carousel'>
                <CarouselWrapper
                    responsive={RESPONSIVE}
                    partialVisible={!isMinDestinations}
                    arrows={false}
                    containerClass={!isMinDestinations ? styles.carouselContainer : ''}
                    renderButtonGroupOutside={true}
                    customButtonGroup={!isMinDestinations ? <SliderButtonsGroup /> : <></>}
                    infinite
                >
                    {Destinations.map((destination, index) => {
                        const filter = getSelectedFilterByDestination(destination);
                        const destinationType = filter?.destinationInfo?.type ?? DestinationType.Region;

                        return (
                            <DestinationCard
                                isSelected={!!filter}
                                onSelectDestination={onSelectDestination}
                                key={destination.id}
                                position={`${index + 1}`}
                                countries={filteredRegions}
                                destinationType={destinationType}
                                {...destination.fields}
                            />
                        );
                    })}
                </CarouselWrapper>
            </div>
        </div>
    );
};

export default withRerender(observer(DestinationCarousel));
