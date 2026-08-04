import * as React from 'react';
import { useMemo } from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getPriceDifferencePP } from 'frontend/utils/offer.utils';
import { getOfferRoutesUniqueId } from 'frontend/utils/route.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IUnit } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import ShowMoreButton from 'frontend/components/common/ShowMoreButton';

import AlternativeFlightsFilters from './AlternativeFlightsFilters';
import FlightCard from './FlightCard';

export interface IAlternativeFlightsListProps {
    altRoutes: IAlternativeOffer[];
    isFlightSelected: (offerToCheck: IAlternativeOffer) => boolean;
    isShowLessVisible: boolean;
    isShowMoreVisible: boolean;
    nextFlightIndex: number;
    nextFlightRef: React.RefObject<HTMLDivElement>;
    offer: Nullable<IAlternativeOffer>;
    onClickSelect: (offer: IAlternativeOffer, priceDiff: number) => void;
    onClickShowLess: () => void;
    onClickShowMore: () => void;
    showMoreRef: React.RefObject<HTMLDivElement>;
    totalFlights: number;
    seatsReservationNotification?: JSX.Element | null;
}

export const AlternativeFlightsList = (props: IAlternativeFlightsListProps) => {
    const {
        totalFlights,
        altRoutes,
        seatsReservationNotification,
        offer,
        isFlightSelected,
        onClickSelect,
        nextFlightIndex,
        onClickShowLess,
        isShowMoreVisible,
        onClickShowMore,
        isShowLessVisible,
        nextFlightRef,
        showMoreRef,
    } = props;

    const { getPhrase, isLoadingOffer, hasSelectedFilters, isScreenMedium, getFormattedNumber } = useStore(
        (stores: TStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            isLoadingOffer: stores.bookingStore.isLoadingOffer,
            hasSelectedFilters: stores.alternativeFlightsStore.hasSelectedFilters,
            isScreenMedium: stores.appStore.isScreenMedium,
            getFormattedNumber: stores.marketStore.getFormattedNumber,
        }),
    );

    const countOfFlightsLabel = useMemo(() => {
        const phrase =
            totalFlights > 1
                ? SitecoreDictionary.AlternativeFlightsLabelsTotalFlightsPlural
                : SitecoreDictionary.AlternativeFlightsLabelsTotalFlightsSingular;

        const count = getFormattedNumber(totalFlights);

        return Tokenizer.replaceToken(getPhrase(phrase), Tokens.Number, count);
    }, [totalFlights]);

    if (!altRoutes?.length && !hasSelectedFilters) return null;

    return (
        <>
            <h3 className='step__sub-title alternative-flights__sub-title d-none d-sm-block'>
                {getPhrase(SitecoreDictionary.PriceGraphLabelsAlternativeTimes)}
            </h3>

            <AlternativeFlightsFilters />

            <div className='alternative-flights__total'>{countOfFlightsLabel}</div>

            {isScreenMedium && seatsReservationNotification}

            {altRoutes.map((flight, idx) => (
                <FlightCard
                    key={getOfferRoutesUniqueId(flight)}
                    offer={flight}
                    priceDifference={getPriceDifferencePP(
                        flight.price - (offer?.price ?? 0),
                        flight.accom.unit as IUnit[],
                    )}
                    dataTid='alt-flight-card'
                    isChangeable={false}
                    isSelected={isFlightSelected(flight)}
                    isLoadingOffer={isLoadingOffer}
                    onClickSelect={onClickSelect}
                    ref={idx === nextFlightIndex ? nextFlightRef : null}
                />
            ))}

            <div ref={showMoreRef} className='mb-4'>
                {isShowMoreVisible && (
                    <ShowMoreButton
                        dataTid='show-more-button'
                        onClick={onClickShowMore}
                        title={getPhrase(SitecoreDictionary.AlternativeFlightsButtonsShowMore)}
                    />
                )}

                {isShowLessVisible && (
                    <ShowMoreButton
                        dataTid='show-less-button'
                        onClick={onClickShowLess}
                        title={getPhrase(SitecoreDictionary.AlternativeFlightsButtonsShowLess)}
                        isChevronUp
                    />
                )}
            </div>
        </>
    );
};

export default observer(AlternativeFlightsList);
