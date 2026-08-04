import React, { FC, useMemo, useState } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import bookingService from 'frontend/services/booking.service';
import { sortFlights } from 'frontend/utils/sort.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IOffer } from 'models/data/IOffer';
import { ISelectOption } from 'models/data/ISelectOption';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { OtherRoutesActions } from 'models/enum/tracking/OtherRoutesActions';
import ViewAltOptionsButton from 'frontend/components/renderings/SearchResults/components/ViewAltOptionsButton/ViewAltOptionsButton';

import OtherRoutesPopup from './OtherRoutesPopup/OtherRoutesPopup';

interface IOtherRoutesProps {
    offer: IOffer;
    alternativeFlightsDefaultSort?: AlternativeFlightsSortBy;
    alternativeFlightsSortOrders?: ISelectOption[];
    className?: string;
    isOfferCardsABTesting?: boolean;
}

const OtherRoutes: FC<IOtherRoutesProps> = props => {
    const [sortBy, setSortBy] = useState<AlternativeFlightsSortBy>(
        props.alternativeFlightsDefaultSort || AlternativeFlightsSortBy.PriceLowToHigh,
    );
    const selectedSortOption = props.alternativeFlightsSortOrders?.find(o => o.value === sortBy);

    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [alternativeFlights, setAlternativeFlights] = useState<IOffer[] | IAlternativeOffer[]>([]);

    const { getPhrase, layoutId, setOtherRoutesValue, trackOtherRoutesClick, saveSearchParamsAndFilterToLocalStorage } =
        useStore(stores => ({
            getPhrase: stores.layoutStore.getPhrase,
            layoutId: stores.layoutStore.layoutId,
            setOtherRoutesValue: stores.bookingStore.setOtherRoutesValue,
            trackOtherRoutesClick: stores.trackingStore.trackOtherRoutesClick,
            saveSearchParamsAndFilterToLocalStorage: stores.promoPageStore.saveSearchParamsAndFilterToLocalStorage,
        }));

    const onFlightsSort = (flightsSortBy: AlternativeFlightsSortBy): void => {
        if (isLoading) {
            return;
        }

        setSortBy(flightsSortBy);
    };

    const sortedAlternativeFlights = useMemo(
        () => sortFlights([...alternativeFlights], sortBy),
        [alternativeFlights, sortBy],
    );

    /** Select other route */
    const onClickLink = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>): void => {
        e.preventDefault?.();
        setIsOpen(true);
        trackOtherRoutesClick(EventTypes.ShowOtherRoutesClick);
        getAlternativeFlights();
    };

    const closePopup = (): void => {
        setIsOpen(false);
        trackOtherRoutesClick(EventTypes.OtherRoutes, OtherRoutesActions.ModalClosed);
        setSortBy(props.alternativeFlightsDefaultSort || AlternativeFlightsSortBy.PriceLowToHigh);
    };

    const selectRoute = (offer: IOffer, isEqualRoutes: boolean): void => {
        setIsOpen(false);
        trackOtherRoutesClick(
            EventTypes.OtherRoutes,
            isEqualRoutes ? OtherRoutesActions.SameRoute : OtherRoutesActions.NewRoute,
        );
        setOtherRoutesValue(offer.otherRoutes);
        saveSearchParamsAndFilterToLocalStorage(layoutId);
    };

    const getAlternativeFlights = async (): Promise<void> => {
        try {
            if (isLoading) {
                return;
            }

            setIsLoading(true);

            const fetchedFlights = (await bookingService.getOtherRoutes(props.offer)) || [];

            if (fetchedFlights.length < 2) {
                trackOtherRoutesClick(EventTypes.OtherRoutes, OtherRoutesActions.NoRoutesErr);
            }

            setAlternativeFlights(fetchedFlights);
        } catch (e) {
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={classNames('other-routes', props.className)} data-tid='other-routes'>
            <a href='#' onClick={onClickLink} className='main-link'>
                <ViewAltOptionsButton isOfferCardsABTesting={props.isOfferCardsABTesting}>
                    <span>{getPhrase(SitecoreDictionary.SearchResultsLabelsShowOtherRoutes)}</span>
                </ViewAltOptionsButton>
            </a>

            <OtherRoutesPopup
                offer={props.offer}
                alternativeFlights={sortedAlternativeFlights}
                isOpen={isOpen}
                isLoading={isLoading}
                onClose={closePopup}
                onSelectRoute={selectRoute}
                onFlightsSort={onFlightsSort}
                sortBy={sortBy}
                sortOptions={props.alternativeFlightsSortOrders}
                selectedSortOption={selectedSortOption}
            />
        </div>
    );
};

export default OtherRoutes;
