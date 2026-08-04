import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { IFilterOption, IFilters, ISelectedFilter } from 'models/data/IFilters';
import { DestinationType } from 'models/enum/DestinationType';
import { FilterGroupCodes, FLIGHT_DURATION_FILTER_CODE, PRICE_RANGE_FILTER_CODE } from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';

import { SelectedFilterPill } from './SelectedFilterPill';

export interface ISelectedFiltersProps extends IComponentWithDictionary {
    availableFilters: IFilters[];
    isScreenExtraSmall: boolean;
    onClearAll: () => void;
    onRemoveFilter: (filterGroupCode: string, filterCode: string) => void;
    selectedFilters: ISelectedFilter[];
    flightDurationFilterLabel?: Nullable<string>;
    onClick?: (code: FilterGroupCodes) => void;
    priceFilterLabel?: Nullable<string>;
}

@observer
export class SelectedFilters extends Component<ISelectedFiltersProps> {
    private isRemoveSelectDestinationPills = (filterSelected: ISelectedFilter): boolean => {
        const destinationFilters = this.props.availableFilters.find(el => el.code === FilterGroupCodes.Destination);

        if (!destinationFilters) return false;

        const countries = destinationFilters.options || [];

        const selectedIndex = countries.findIndex(el =>
            (el.children || []).find(
                ch => filterSelected.code === ch.code && filterSelected.groupCode === ch.groupCode,
            ),
        );

        // remove pill if parent country has all regions selected
        if (selectedIndex > -1) {
            const isCountrySelected = countries[selectedIndex].children?.every(
                ch =>
                    this.props.selectedFilters.findIndex(el => el.code === ch.code && el.groupCode === ch.groupCode) >
                    -1,
            );

            if (isCountrySelected) {
                return true;
            }
        }

        // remove pill if it's children are pre-checked
        const isDestinationPreCheckCountry =
            countries.findIndex(el => {
                if (el.code === filterSelected.code) {
                    return (el.children || [])
                        .filter(ch => ch.destinationInfo?.type !== DestinationType.VirtualRegion) // no need to check virtual regions, as it will be checked if related checked
                        .every(
                            ch =>
                                this.props.selectedFilters.findIndex(
                                    el => el.code === ch.code && el.groupCode === ch.groupCode && el.preChecked,
                                ) > -1,
                        );
                }

                return false;
            }) > -1;

        if (isDestinationPreCheckCountry) {
            return true;
        }

        // remove pill if all it's related regions are pre-checked
        if (filterSelected.destinationInfo?.type === DestinationType.VirtualRegion) {
            const isAllRelatedPreChecked = filterSelected.destinationInfo.relatedRegions.every(rc =>
                this.props.selectedFilters.find(
                    f => f.groupCode === FilterGroupCodes.Destination && f.code === rc && f.preChecked,
                ),
            );

            if (isAllRelatedPreChecked) {
                return true;
            }
        }

        // remove pill if related virtual region has all regions selected
        if (filterSelected.destinationInfo?.type === DestinationType.Region) {
            let relatedVirtualRegion: IFilterOption | undefined;

            countries.some(c => {
                const virtual = c.children?.find(
                    ch =>
                        ch.destinationInfo?.type === DestinationType.VirtualRegion &&
                        ch.destinationInfo.relatedRegions.indexOf(filterSelected.code) > -1,
                );

                if (virtual) {
                    relatedVirtualRegion = virtual;

                    return true;
                }

                return false;
            });

            if (relatedVirtualRegion) {
                const allInVirtualSelected = relatedVirtualRegion.destinationInfo?.relatedRegions.every(
                    code =>
                        this.props.selectedFilters.findIndex(
                            el => el.code === code && el.groupCode === FilterGroupCodes.Destination,
                        ) > -1,
                );

                if (allInVirtualSelected) {
                    return true;
                }
            }
        }

        return false;
    };

    /**
     * Shouldn't show pills with boardGroup.
     */
    private isRemoveSelectBoardPills = (filterSelected: ISelectedFilter): IFilterOption | boolean | undefined => {
        const boardFilters = this.props.availableFilters.find(el => el.code === FilterGroupCodes.BoardType);

        if (!boardFilters) return false;

        return (
            boardFilters?.options.find(
                el => el.code === filterSelected.code && el.boardGroup && el.boardGroup.code !== el.code,
            ) ||
            boardFilters?.options.find(el =>
                el.children?.some(x => x.code === filterSelected.code && x.code !== el.code),
            )
        );
    };

    /**
     * Check if need show pills on UI.
     * For Duration/Flights filter need show pills only in cse if it was selected manually
     */
    shouldShow = (filter: ISelectedFilter): boolean => {
        if (filter.groupCode === FilterGroupCodes.Destination) {
            return !filter.preChecked && !this.isRemoveSelectDestinationPills(filter);
        }

        if (filter.groupCode === FilterGroupCodes.Duration || filter.groupCode === FilterGroupCodes.Flights) {
            return !filter.preChecked;
        }

        if (filter.groupCode === FilterGroupCodes.BoardType) {
            return !this.isRemoveSelectBoardPills(filter);
        }

        return true;
    };

    onPillClick = (filterGroupCode: FilterGroupCodes): void => {
        if (this.props.onClick) {
            this.props.onClick(
                filterGroupCode === FilterGroupCodes.TripAdvisorRating ? FilterGroupCodes.StarRating : filterGroupCode,
            );
        }
    };

    onRemoveClick = (e: React.MouseEvent, filterGroupCode: FilterGroupCodes, filterCode: string): void => {
        e.stopPropagation();

        this.props.onRemoveFilter(filterGroupCode, filterCode);
    };

    render() {
        const filters = (this.props.selectedFilters || []).filter(this.shouldShow);

        if (
            (!(this.props.availableFilters || []).length || !filters.length) &&
            !this.props.priceFilterLabel &&
            !this.props.flightDurationFilterLabel
        ) {
            return null;
        }

        return (
            <div className='filter-apply' data-tid='filter-apply'>
                {this.props.isScreenExtraSmall && (
                    <span className='filter-apply__title'>
                        {this.props.getPhrase(SitecoreDictionary.SearchPodFiltersLabelsSelectedFilters)}
                    </span>
                )}
                <div className='flex-group'>
                    <div className='filter-apply__group'>
                        {filters.map(el => (
                            <SelectedFilterPill
                                key={`${el.groupCode}_${el.code}`}
                                dataTid={`${el.groupCode}_${el.code}`}
                                label={el.name || el.code}
                                onClick={() =>
                                    this.onPillClick(
                                        [
                                            FilterGroupCodes.InboundDepartureTime,
                                            FilterGroupCodes.OutboundDepartureTime,
                                        ].includes(el.groupCode)
                                            ? FilterGroupCodes.FlightTimes
                                            : el.groupCode,
                                    )
                                }
                                onRemoveClick={event => this.onRemoveClick(event, el.groupCode, el.code)}
                            />
                        ))}

                        {!!this.props.priceFilterLabel && (
                            <SelectedFilterPill
                                key={PRICE_RANGE_FILTER_CODE}
                                dataTid={PRICE_RANGE_FILTER_CODE}
                                label={this.props.priceFilterLabel}
                                onClick={() => this.onPillClick(FilterGroupCodes.PriceRange)}
                                onRemoveClick={event =>
                                    this.onRemoveClick(event, FilterGroupCodes.PriceRange, PRICE_RANGE_FILTER_CODE)
                                }
                            />
                        )}

                        {!!this.props.flightDurationFilterLabel && (
                            <SelectedFilterPill
                                key={FLIGHT_DURATION_FILTER_CODE}
                                dataTid={FLIGHT_DURATION_FILTER_CODE}
                                label={this.props.flightDurationFilterLabel}
                                onClick={() => this.onPillClick(FilterGroupCodes.FlightDuration)}
                                onRemoveClick={event =>
                                    this.onRemoveClick(
                                        event,
                                        FilterGroupCodes.FlightDuration,
                                        FLIGHT_DURATION_FILTER_CODE,
                                    )
                                }
                            />
                        )}

                        <Button isTransparent onClick={() => this.props.onClearAll()} dataTid='clear-all'>
                            {this.props.isScreenExtraSmall
                                ? this.props.getPhrase(
                                      SitecoreDictionary.SearchPodFiltersButtonsClearAppliedFiltersOnMobile,
                                  )
                                : this.props.getPhrase(SitecoreDictionary.SearchPodFiltersButtonsClearAppliedFilters)}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}

const ConnectedSelectedFilters = inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    isScreenExtraSmall: stores.appStore.isScreenExtraSmall,
}))(SelectedFilters);

export default ConnectedSelectedFilters;
