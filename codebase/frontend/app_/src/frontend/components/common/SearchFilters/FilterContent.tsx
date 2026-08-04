import React, { Component } from 'react';
import classNames from 'classnames';
import { inject, observer } from 'mobx-react';

import marketStore from 'frontend/store/base/market/MarketStore';
import { TStores } from 'frontend/store/IStores';
import { getDepartureAirportsWithCountryName, isExclusiveFilterDisabled } from 'frontend/utils/filter.utils';
import { containsSubstring } from 'frontend/utils/string.utils';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { IFilterOption, IFilters, ISelectedFilter } from 'models/data/IFilters';
import { MarketCode } from 'models/data/MarketSettings';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { DataStatus, isLoadingStatus } from 'models/enum/DataStatus';
import { DestinationType } from 'models/enum/DestinationType';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { FilterGroupTitles } from 'models/enum/FilterGroupTitles';
import { DEPARTURE_ALL_CODE } from 'models/enum/RequestConstants';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import TripadvisorRating from 'frontend/components/common/TripadvisorRating/TripadvisorRating';
import SvgStarFilled from 'frontend/components/icons-new/StarFilled';
import DateFilter from 'frontend/components/renderings/MediaCenter/components/DateFilter';

import FilterCheckControl from './FilterCheckControl';
import FilterControlsButtons from './FilterControlsButtons';

export interface IFilterContentProps extends IComponentWithDictionary {
    ShowFacilityFilterGroupList: string[];
    availableFilters: IFilters[];
    checkIsFilterSelected: (filter: IFilterOption) => boolean;
    codeFilters: FilterGroupCodes;
    getFormattedNumber: marketStore['getFormattedNumber'];
    getSetting: (setting: SiteSettings) => boolean;
    isPromoPage: boolean;
    marketCode: MarketCode;
    onSelectFilters: (filters?: IFilterOption) => void;
    originsWithNames: IDestinationCountry[];
    selectedDestinationCodesQuery: Nullable<string>;
    selectedFilters: ISelectedFilter[];
    status: DataStatus;
    isApplyDisabled?: boolean;
    onApply?: () => void;
    onCancel?: () => void;
}

const COUNT_OF_STARTS = 5;

export class FilterContent extends Component<IFilterContentProps> {
    private getAvailableFilterContent(groupCode?: FilterGroupCodes): IFilterOption[] {
        if (!groupCode) {
            groupCode = this.props.codeFilters;
        }

        const filtersContent = this.props.availableFilters.find(el => el.code === groupCode);

        return filtersContent?.options.filter(el => !el.boardGroup) ?? [];
    }

    private checkIsFilterDisabled = (count: number): boolean =>
        !count ||
        isLoadingStatus(this.props.status) ||
        (this.props.codeFilters === FilterGroupCodes.Flights &&
            (this.getAvailableFilterContent().length === 1 ||
                this.getAvailableFilterContent().filter(el => el.count).length === 1));

    private toggleCheckbox = (option: IFilterOption): boolean => {
        if (
            this.props.codeFilters === FilterGroupCodes.Flights &&
            option.count &&
            this.getAvailableFilterContent().filter(el => el.count).length === 1
        ) {
            return true;
        }

        return this.props.checkIsFilterSelected(option);
    };

    private isLastSelectDestination = (option: IFilterOption) => {
        const destinationSelected = this.props.selectedFilters.filter(
            el => el.groupCode === FilterGroupCodes.Destination,
        );

        // disable Destination checkbox regions and countries
        if (!option.count) {
            return true;
        }

        // no need to disable last virtual region when we are on promo page
        if (option.destinationInfo?.type === DestinationType.VirtualRegion && !this.props.isPromoPage) {
            const selectedVirtual = destinationSelected.filter(
                d => d.destinationInfo?.type === DestinationType.VirtualRegion,
            );

            if (selectedVirtual.length === 1 && selectedVirtual[0].code === option.code) {
                const allInVirtualInQuery = option.destinationInfo?.relatedRegions.every(
                    r => !!this.props.selectedDestinationCodesQuery?.match(r),
                );

                if (allInVirtualInQuery) {
                    // if all virtual in query we should disable virtual if only regions in virtual currently selected
                    return option.destinationInfo?.relatedRegions.length + 1 === destinationSelected.length;
                }
            }

            return !option.count;
        }

        // we might need to disable checkbox if only last remains
        if (
            destinationSelected.length === 1 &&
            destinationSelected[0].code === option.code &&
            !this.props.isPromoPage
        ) {
            const destinationFilters = this.getAvailableFilterContent(FilterGroupCodes.Destination);

            // if all countries was initially selected, than we don't need to disabled the last filter
            const areAllCountriesSelected = destinationFilters.every(c => {
                // if one child of virtual in query, it means that not all virtual country is selected
                if (c.destinationInfo?.type === DestinationType.VirtualCountry) {
                    return !c.children?.some(ch => !!this.props.selectedDestinationCodesQuery?.match(ch.code));
                }

                return (
                    c.children?.every(ch => {
                        if (!!this.props.selectedDestinationCodesQuery?.match(ch.code)) {
                            return true;
                        }

                        if (ch.destinationInfo?.type === DestinationType.VirtualRegion) {
                            return (ch.destinationInfo?.relatedRegions || []).every(
                                code => !!this.props.selectedDestinationCodesQuery?.match(code),
                            );
                        }

                        return false;
                    }) || c.children?.every(ch => !this.props.selectedDestinationCodesQuery?.match(ch.code))
                );
            });

            return !areAllCountriesSelected;
        }

        return false;
    };

    private renderStarLabel = option => (
        <>
            <div className='star_rating full-rate'>
                {Array(COUNT_OF_STARTS)
                    .fill('')
                    .map((_, i: number) => (
                        <span key={i} className={parseInt(option.code) - i > 0 ? 'active' : ''}>
                            <SvgStarFilled />
                        </span>
                    ))}
            </div>
            <span data-tid='stars-label'>({this.props.getFormattedNumber(option.count)})</span>
        </>
    );

    private renderTripAdvisorLabel = option => (
        <>
            <TripadvisorRating rating={parseInt(option.code)} />
            <span className='checkbox-item__text'>
                {option.code === '5'
                    ? this.props.getPhrase(SitecoreDictionary.SearchPodFiltersLabelsOnly)
                    : this.props.getPhrase(SitecoreDictionary.SearchPodFiltersLabelsAndUp)}
            </span>
            <span className='count' data-tid='tripadvisor-rating-label'>
                ({this.props.getFormattedNumber(option.count)})
            </span>
        </>
    );

    render() {
        let starRatingListItems;
        let tripAdvisorRatingListItems;

        if (this.props.codeFilters === FilterGroupCodes.StarRating) {
            starRatingListItems = Array(4)
                .fill('')
                .map((_: any, idx: number) => {
                    const starsAmount = COUNT_OF_STARTS - idx;

                    return this.getAvailableFilterContent().find(filter => parseInt(filter.code) === starsAmount);
                });
            tripAdvisorRatingListItems = Array(4)
                .fill('')
                .map((_: any, idx: number) => {
                    const starsAmount = COUNT_OF_STARTS - idx;

                    return this.getAvailableFilterContent(FilterGroupCodes.TripAdvisorRating).find(
                        filter => parseInt(filter.code) === starsAmount,
                    );
                });
        }

        const filtersToShow =
            this.props.codeFilters === FilterGroupCodes.Flights && this.getAvailableFilterContent()
                ? this.getAvailableFilterContent().filter(f => f.code !== DEPARTURE_ALL_CODE)
                : this.getAvailableFilterContent();

        const departureAirportsWithCountryName = getDepartureAirportsWithCountryName(
            filtersToShow,
            this.props.originsWithNames,
            this.props.marketCode,
        );

        const inboundFilterOptions = filtersToShow
            .find(el => containsSubstring(el.name, RouteDirection.Inbound))
            ?.children?.map(el => ({
                ...el,
                groupCode: FilterGroupCodes.InboundDepartureTime,
            }));
        const outboundFilterOptions = filtersToShow
            .find(el => containsSubstring(el.name, RouteDirection.Outbound))
            ?.children?.map(el => ({ ...el, groupCode: FilterGroupCodes.OutboundDepartureTime }));

        const faciltitesFilterOptions = this.props.ShowFacilityFilterGroupList
            ? filtersToShow.filter(option => this.props.ShowFacilityFilterGroupList.includes(option.name))
            : [];

        const isCheckControlDisplayed = ![
            FilterGroupCodes.StarRating,
            FilterGroupCodes.PriceRange,
            FilterGroupCodes.PackageTheme,
            FilterGroupCodes.Destination,
            FilterGroupCodes.Facilities,
            FilterGroupCodes.Date,
            FilterGroupCodes.FlightTimes,
            FilterGroupCodes.FlightDuration,
        ].includes(this.props.codeFilters);

        return (
            <div className='filter-group filter-group--open'>
                <div
                    id={this.props.codeFilters}
                    className='filter-group__values filter-group__values--active'
                    style={{ display: 'block' }}
                >
                    <h4
                        className={classNames(
                            'filter-group__title',
                            (this.props.codeFilters === FilterGroupCodes.Facilities ||
                                this.props.codeFilters === FilterGroupCodes.FlightTimes) &&
                                'filter-group__title--bordered',
                        )}
                    >
                        {this.props.getPhrase(FilterGroupTitles[this.props.codeFilters])}
                    </h4>

                    {isCheckControlDisplayed && (
                        <div
                            className={classNames(
                                'checkbox-group',
                                this.props.codeFilters === FilterGroupCodes.Duration && 'duration-filter',
                            )}
                        >
                            {(
                                (this.props.codeFilters === FilterGroupCodes.Flights
                                    ? departureAirportsWithCountryName
                                    : filtersToShow) || []
                            ).map((option: IFilterOption, idx: number) => {
                                const isDisabled =
                                    isExclusiveFilterDisabled(option, this.props.selectedFilters) ||
                                    this.checkIsFilterDisabled(option.count);

                                return (
                                    <FilterCheckControl
                                        key={idx}
                                        option={option}
                                        checked={this.toggleCheckbox(option)}
                                        onChange={() => this.props.onSelectFilters(option)}
                                        disabled={isDisabled}
                                        isRadioButton={this.props.codeFilters === FilterGroupCodes.Duration}
                                        hideLabelCount={
                                            [
                                                FilterGroupCodes.Flights,
                                                FilterGroupCodes.Duration,
                                                FilterGroupCodes.AltFlightsDepartureAirports,
                                                FilterGroupCodes.AltFlightsOutboundDepartureTime,
                                                FilterGroupCodes.AltFlightsInboundDepartureTime,
                                            ].includes(this.props.codeFilters) ||
                                            (this.props.codeFilters === FilterGroupCodes.BoardType &&
                                                this.props.getSetting(SiteSettings.NewAlternativeBoardsFilterIsActive))
                                        }
                                    />
                                );
                            })}
                        </div>
                    )}
                    {this.props.codeFilters === FilterGroupCodes.StarRating && (
                        <div className='row'>
                            <div className='col-xs-12 col-md-4 offset-md-1 offset-lg-2 rating-block'>
                                <p>
                                    {this.props.getPhrase(SitecoreDictionary.SearchPodFiltersTitlesStarRatingSubtitle)}
                                </p>
                                {this.getAvailableFilterContent().length > 0 && (
                                    <div className='rating-block__list' data-tid='star-rating'>
                                        {starRatingListItems
                                            .filter(_ => !!_)
                                            .map((option: any, idx: number) => (
                                                <FilterCheckControl
                                                    key={idx}
                                                    option={option}
                                                    checked={this.toggleCheckbox(option)}
                                                    onChange={() => this.props.onSelectFilters(option)}
                                                    disabled={this.checkIsFilterDisabled(option.count)}
                                                    label={this.renderStarLabel(option)}
                                                />
                                            ))}
                                    </div>
                                )}
                            </div>
                            {tripAdvisorRatingListItems.length > 0 && (
                                <>
                                    <hr className='small-line' />
                                    <div className='col-xs-12 col-md-4 offset-md-1 rating-block'>
                                        <p>
                                            {this.props.getPhrase(
                                                SitecoreDictionary.SearchPodFiltersTitlesTripAdvisorRatingSubtitle,
                                            )}
                                        </p>
                                        <div className='rating-block__list' data-tid='trip-advisor-rating'>
                                            {tripAdvisorRatingListItems
                                                .filter(_ => !!_)
                                                .map((option: any, idx: number) => (
                                                    <FilterCheckControl
                                                        key={idx}
                                                        option={option}
                                                        checked={this.toggleCheckbox(option)}
                                                        onChange={() => this.props.onSelectFilters(option)}
                                                        disabled={this.checkIsFilterDisabled(option.count)}
                                                        label={this.renderTripAdvisorLabel(option)}
                                                        isRadioButton
                                                    />
                                                ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {[FilterGroupCodes.PackageTheme, FilterGroupCodes.Destination].includes(this.props.codeFilters) && (
                        <div className='filter-group__content-wrapper'>
                            <div className='filter-group__centered-content'>
                                {filtersToShow.map((option: IFilterOption, idx: number) => (
                                    <div key={idx} className='checkbox-tree-group'>
                                        <FilterCheckControl
                                            key={idx}
                                            option={option}
                                            checked={this.toggleCheckbox(option)}
                                            onChange={() => this.props.onSelectFilters(option)}
                                            disabled={this.checkIsFilterDisabled(option.count)}
                                            hiddenZeroCount
                                        />
                                        <div className='checkbox-group'>
                                            {(option.children || []).map((ch: IFilterOption, idx1: number) => (
                                                <FilterCheckControl
                                                    key={`${idx}_${idx1}`}
                                                    option={ch}
                                                    checked={this.toggleCheckbox(ch)}
                                                    onChange={() => this.props.onSelectFilters(ch)}
                                                    disabled={
                                                        this.props.codeFilters === FilterGroupCodes.Destination
                                                            ? this.isLastSelectDestination(ch)
                                                            : this.checkIsFilterDisabled(ch.count)
                                                    }
                                                    hiddenZeroCount
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {this.props.codeFilters === FilterGroupCodes.Facilities && (
                        <div className='filter-group__content-wrapper' data-tid='facilities'>
                            <div className='filter-group__centered-content'>
                                {(faciltitesFilterOptions || []).map((option: IFilterOption, idx: number) => (
                                    <div key={idx} className={classNames('tree-group')}>
                                        <div className='tree-group__header'>{option.name}</div>
                                        <div className='tree-group__items'>
                                            {(option.children || []).map((ch: IFilterOption, idx1: number) => (
                                                <FilterCheckControl
                                                    key={`${idx}_${idx1}`}
                                                    option={{
                                                        ...ch,
                                                        tooltipOrientation: CalloutOrientation.Top,
                                                        tooltipPosition: CalloutPosition.IconLeft,
                                                    }}
                                                    checked={this.toggleCheckbox(ch)}
                                                    onChange={() => this.props.onSelectFilters(ch)}
                                                    disabled={this.checkIsFilterDisabled(ch.count)}
                                                    hiddenZeroCount
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {this.props.codeFilters === FilterGroupCodes.Date && (
                        <div className='filter-group__content-wrapper'>
                            <div className='filter-group__centered-content'>
                                <h4 className='filter-group__title'>
                                    {this.props.getPhrase(SitecoreDictionary.PressHubFiltersLabelsSubtitle)}
                                </h4>
                                <DateFilter />
                            </div>
                        </div>
                    )}

                    {this.props.codeFilters === FilterGroupCodes.FlightTimes &&
                        ((inboundFilterOptions && !!inboundFilterOptions.length) ||
                            (outboundFilterOptions && !!outboundFilterOptions.length)) && (
                            <div className='row'>
                                {outboundFilterOptions && !!outboundFilterOptions.length && (
                                    <div className='col-xs-12 col-md-6 departure-time-block'>
                                        <p>
                                            {this.props.getPhrase(
                                                SitecoreDictionary.SearchPodFiltersTitlesOutboundDepartureTimeSubtitle,
                                            )}
                                        </p>
                                        <div className='departure-time-block__list' data-tid='outbound-departure-time'>
                                            {outboundFilterOptions.map((option: any, idx: number) => (
                                                <FilterCheckControl
                                                    key={idx}
                                                    option={option}
                                                    checked={this.toggleCheckbox(option)}
                                                    onChange={() =>
                                                        this.props.onSelectFilters({
                                                            ...option,
                                                            name:
                                                                RouteDirection.Outbound[0].toUpperCase() +
                                                                RouteDirection.Outbound.slice(1) +
                                                                ' ' +
                                                                option.name.toLowerCase(),
                                                        })
                                                    }
                                                    disabled={this.checkIsFilterDisabled(option.count)}
                                                    label={option.pillLabel}
                                                    hideLabelCount
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {inboundFilterOptions && !!inboundFilterOptions.length && (
                                    <div className='col-xs-12 col-md-6 departure-time-block'>
                                        <p>
                                            {this.props.getPhrase(
                                                SitecoreDictionary.SearchPodFiltersTitlesInboundDepartureTimeSubtitle,
                                            )}
                                        </p>
                                        <div className='departure-time-block__list' data-tid='inbound-departure-time'>
                                            {inboundFilterOptions.map((option: any, idx: number) => (
                                                <FilterCheckControl
                                                    key={idx}
                                                    option={option}
                                                    checked={this.toggleCheckbox(option)}
                                                    onChange={() =>
                                                        this.props.onSelectFilters({
                                                            ...option,
                                                            name:
                                                                RouteDirection.Inbound[0].toUpperCase() +
                                                                RouteDirection.Inbound.slice(1) +
                                                                ' ' +
                                                                option.name.toLowerCase(),
                                                        })
                                                    }
                                                    disabled={this.checkIsFilterDisabled(option.count)}
                                                    label={option.pillLabel}
                                                    hideLabelCount
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    {this.props.onApply && this.props.onCancel && (
                        <FilterControlsButtons
                            isApplyDisabled={
                                this.props.codeFilters === FilterGroupCodes.Date && this.props.isApplyDisabled
                            }
                            onApply={this.props.onApply}
                            onCancel={this.props.onCancel}
                            getPhrase={this.props.getPhrase}
                            content={
                                this.props.codeFilters === FilterGroupCodes.Duration
                                    ? this.props.getPhrase(SitecoreDictionary.FilterTypesTextDurationFilterText)
                                    : ''
                            }
                        />
                    )}
                </div>
            </div>
        );
    }
}

export default inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    getSetting: stores.layoutStore.getSetting,

    ShowFacilityFilterGroupList: stores.layoutStore.ShowFacilityFilterGroupList,
    getFormattedNumber: stores.marketStore.getFormattedNumber,
    marketCode: stores.marketStore.marketCode,
    originsWithNames: stores.searchStore.originsWithNames,
}))(observer(class WrappedFilterContent extends FilterContent {}));
