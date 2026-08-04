import { FC } from 'react';

import { useMoreThenXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import { splitToChunksArray } from 'frontend/utils/chunkArray';
import { IOffer } from 'models/data/IOffer';
import { ISelectOption } from 'models/data/ISelectOption';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import OffersPerPage from 'frontend/components/renderings/SearchResults/components/Offers/OffersPerPage';

export interface IOffersProps extends ISitecoreComponent {
    alternativeFlightsDefaultSort: AlternativeFlightsSortBy;
    alternativeFlightsSortOrders: ISelectOption[];
    currentPage: number;
    itemsOnEachPage: number;
    minLoadedPageNumber: number;
    offerCardBySelectedIndex: React.RefObject<HTMLDivElement>;
    offers: IOffer[];
    onSetSelectedOfferIndex: (i: number, page?: number) => void;
}

const Offers: FC<IOffersProps> = ({
    offerCardBySelectedIndex,
    offers,
    currentPage,
    itemsOnEachPage,
    minLoadedPageNumber,
    rendering,
    onSetSelectedOfferIndex,
    alternativeFlightsDefaultSort,
    alternativeFlightsSortOrders,
}) => {
    const isScreenSmall = useMoreThenXSMobileViewport();

    if (isScreenSmall) {
        return (
            <OffersPerPage
                offers={offers}
                page={currentPage}
                rendering={rendering}
                offerCardBySelectedIndex={offerCardBySelectedIndex}
                onSetSelectedOfferIndex={onSetSelectedOfferIndex}
                alternativeFlightsSortOrders={alternativeFlightsSortOrders}
                alternativeFlightsDefaultSort={alternativeFlightsDefaultSort}
            />
        );
    }

    /** Split offers by pages, because on mobile offers can be rendered for several pages at once */
    const offersPerPage = splitToChunksArray(offers, itemsOnEachPage);

    return (
        <>
            {offersPerPage.map((offers, i) => {
                const page = minLoadedPageNumber + i;

                return (
                    <OffersPerPage
                        key={page}
                        offers={offers}
                        page={page}
                        rendering={rendering}
                        offerCardBySelectedIndex={offerCardBySelectedIndex}
                        onSetSelectedOfferIndex={onSetSelectedOfferIndex}
                        alternativeFlightsSortOrders={alternativeFlightsSortOrders}
                        alternativeFlightsDefaultSort={alternativeFlightsDefaultSort}
                    />
                );
            })}
        </>
    );
};

export default Offers;
