import { action, computed, makeObservable, observable } from 'mobx';

import { getSelectValueFromSortOrder, sortBy } from 'frontend/utils/sort.utils';
import { IOffer } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { ISelectOption } from 'models/data/ISelectOption';
import { AlternativeFlightsSortBy, TAlternativeFlightsSortOrderItem } from 'models/enum/AlternativeFlightsSortBy';
import { RouteDirection } from 'models/enum/RouteDirection';

export class AmendFlightsSortStore {
    @observable sortBy: AlternativeFlightsSortBy = AlternativeFlightsSortBy.PriceLowToHigh;
    @observable sortOptions: ISelectOption[] = [];

    constructor() {
        makeObservable(this);
    }

    private sortByRouteTime = (routeDirection: RouteDirection) => (offer1: IOffer, offer2: IOffer) => {
        const offer1InboundRoute = offer1.transport.routes.find(({ direction }) => direction === routeDirection);
        const offer2InboundRoute = offer2.transport.routes.find(({ direction }) => direction === routeDirection);

        if (!offer2InboundRoute || !offer2InboundRoute) {
            return 0;
        }

        return sortBy<IRoute>(offer1InboundRoute!, offer2InboundRoute, route => new Date(route.depDate).getTime());
    };

    private sortByPrice = (direction: 1 | -1) => (offer1: IOffer, offer2: IOffer) =>
        sortBy(offer1, offer2, ({ totalPrice }) => totalPrice, direction);

    getSortedOffers = (filteredFlights: IOffer[]): IOffer[] => {
        switch (this.sortBy) {
            case AlternativeFlightsSortBy.PriceLowToHigh:
                return [...filteredFlights].sort(this.sortByPrice(1));
            case AlternativeFlightsSortBy.PriceHightToLow:
                return [...filteredFlights].sort(this.sortByPrice(-1));
            case AlternativeFlightsSortBy.ReturningEarliestArrival:
                return [...filteredFlights].sort(this.sortByRouteTime(RouteDirection.Inbound));
            case AlternativeFlightsSortBy.OutboundEarliestDeparture:
                return [...filteredFlights].sort(this.sortByRouteTime(RouteDirection.Outbound));
            case AlternativeFlightsSortBy.NearestAirport:
                return [...filteredFlights].sort((previousOffer, currentOffer) =>
                    sortBy(previousOffer, currentOffer, offer => offer.distanceToOriginalAirport ?? 0),
                );
            default:
                return filteredFlights;
        }
    };

    @action setSortByInitially = (
        sortOrder: Nullable<TAlternativeFlightsSortOrderItem[]>,
        sortDefault: Nullable<TAlternativeFlightsSortOrderItem>,
    ): void => {
        this.sortBy = sortDefault?.fields?.Code?.value || AlternativeFlightsSortBy.OutboundEarliestDeparture;
        this.sortOptions = sortOrder?.map(getSelectValueFromSortOrder) || [];
    };

    @action onChangeSortBy = (sortBy: AlternativeFlightsSortBy): void => {
        this.sortBy = sortBy;
    };

    @computed get selectedSortOption(): Nullable<ISelectOption> {
        return this.sortOptions.find(o => o.value === this.sortBy);
    }
}
