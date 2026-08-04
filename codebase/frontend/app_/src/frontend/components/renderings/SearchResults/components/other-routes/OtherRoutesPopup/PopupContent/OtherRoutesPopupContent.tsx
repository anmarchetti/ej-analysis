import React, { FC } from 'react';

import { IOtherRoutesPopupProps } from 'frontend/components/renderings/SearchResults/components/other-routes/OtherRoutesPopup/OtherRoutesPopup';

import OtherRoutesNoResults from './NoResults/OtherRoutesNoResults';
import OtherRoutesPopupHeader from './PopupHeader/OtherRoutesPopupHeader';
import OtherRoutesResultsList from './RoutesList/OtherRoutesList';
import OtherRoutesSkeleton from './Skeleton/OtherRoutesSkeleton';
import OtherRoutesTableHeader from './TableHeader/OtherRoutesTableHeader';

export interface IOtherRoutesPopupContentProps extends IOtherRoutesPopupProps {
    priceDisclaimer: string;
    isMobile?: boolean;
}

export const OtherRoutesPopupContent: FC<IOtherRoutesPopupContentProps> = ({
    offer,
    alternativeFlights,
    priceDisclaimer,
    isLoading,
    isMobile,
    onClose,
    onSelectRoute,
    onFlightsSort,
    sortBy,
    sortOptions,
    selectedSortOption,
}) => {
    if (alternativeFlights.length <= 1 && !isLoading) {
        return <OtherRoutesNoResults onClose={onClose} />;
    }

    return (
        <>
            <OtherRoutesPopupHeader
                offer={offer}
                onFlightsSort={onFlightsSort}
                sortBy={sortBy}
                sortOptions={sortOptions}
                selectedSortOption={selectedSortOption}
            />

            <section className='section'>
                {!isMobile && (
                    <OtherRoutesTableHeader
                        hasPricePerPerson={offer.price !== offer.pricePP}
                        priceDisclaimer={priceDisclaimer}
                    />
                )}

                {isLoading ? (
                    <OtherRoutesSkeleton isMobile={isMobile} />
                ) : (
                    <OtherRoutesResultsList
                        offer={offer}
                        alternativeFlights={alternativeFlights}
                        onSelectRoute={onSelectRoute}
                        isMobile={isMobile}
                    />
                )}
            </section>
        </>
    );
};

export default OtherRoutesPopupContent;
