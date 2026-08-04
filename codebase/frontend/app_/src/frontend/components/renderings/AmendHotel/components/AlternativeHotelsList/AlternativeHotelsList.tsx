import { FunctionComponent } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import Button from 'frontend/components/common/Button';
import { IAmendHotelFields } from 'frontend/components/renderings/AmendHotel/AmendHotel';
import { getHotelOffer } from 'frontend/components/renderings/AmendHotel/AmendHotel.utils';
import NoResultsErrorBlock from 'frontend/components/renderings/SearchResults/components/NoResultsErrorBlock/NoResultsErrorBlock';
import OfferCardNew from 'frontend/components/renderings/SearchResults/components/OfferCardNew';
import SearchResultsLoadingSkeleton from 'frontend/components/renderings/SearchResults/components/SearchResultsLoadingSkeleton';

import styles from './AlternativeHotelsList.module.scss';

interface IAlternativeHotelsListProps {
    fallbackImage: string;
    fields: IAmendHotelFields;
    rendering: any;
}

const AlternativeHotelsList: FunctionComponent<IAlternativeHotelsListProps> = ({
    fields,
    rendering,
    fallbackImage,
}) => {
    const {
        isLoadingAlternativeHotels,
        alternativeHotels,
        getNextPageOfHotels,
        isLoadingNextPage,
        booking,
        isLoading,
        selectNewHotel,
        trackClickLoadMoreAmendHotelList,
        trackClickBookHotel,
        hasMoreHotelsToLoad,
    } = useStore(({ amendHotelStore, trackingStore, viewBookingStore }: IHolidaysStores) => ({
        isLoadingAlternativeHotels: amendHotelStore.isLoadingAlternativeHotels,
        alternativeHotels: amendHotelStore.alternativeHotels,
        getNextPageOfHotels: amendHotelStore.getNextPageOfHotels,
        isLoadingNextPage: amendHotelStore.isLoadingNextPage,
        booking: viewBookingStore.booking,
        hasMoreHotelsToLoad: amendHotelStore.hasMoreHotelsToLoad,
        isLoading: amendHotelStore.isLoading,
        selectNewHotel: amendHotelStore.selectNewHotel,
        trackClickLoadMoreAmendHotelList: trackingStore.changeHotel.clickLoadMoreAmendHotelList,
        trackClickBookHotel: trackingStore.changeHotel.clickBookHotel,
    }));

    if (!booking) return null;

    const handleClickOnLoadMore = (): void => {
        trackClickLoadMoreAmendHotelList();
        getNextPageOfHotels();
    };

    const handleChoseHotel = (offer: IAmendHotelOffer): void => {
        trackClickBookHotel(offer);
        selectNewHotel(offer);
    };

    const { LoadMoreCTA, BookHotelCTA, ViewHotelCTA, PriceTooltip } = fields;
    const shouldShowShowMoreButton = hasMoreHotelsToLoad || isLoading;
    const isShowEmptyList = !alternativeHotels?.length && !isLoadingAlternativeHotels;

    const offerCards = alternativeHotels?.reduce<JSX.Element[]>((acc, offer, index) => {
        const hotelOffer = getHotelOffer(offer, booking);

        if (!hotelOffer) {
            return acc;
        }

        acc.push(
            <OfferCardNew
                key={offer.accom.code}
                offer={hotelOffer}
                amendHotelOffer={offer}
                fallbackImage={fallbackImage}
                offerIndex={index}
                onSelect={() => handleChoseHotel(offer)}
                rendering={rendering}
                isInAmendHotelFlow
                hotelOfferCardFields={{
                    ViewHotelCTA,
                    BookHotelCTA,
                    PriceTooltip,
                }}
            />,
        );

        return acc;
    }, []);

    return (
        <div className={styles.alternativeHotelsSection}>
            {isLoadingAlternativeHotels && <SearchResultsLoadingSkeleton hideHeader hidePaginationShimmer />}
            {isShowEmptyList && (
                <NoResultsErrorBlock
                    icon={fields.EmptyListIcon?.value.src}
                    title={fields.EmptyListTitle?.value}
                    description={fields.EmptyListDescription?.value}
                />
            )}
            {offerCards}

            {shouldShowShowMoreButton && (
                <Button
                    dataTid='alt-hotels-list-more-btn'
                    isOutlined
                    className={styles.loadMoreCTA}
                    onClick={handleClickOnLoadMore}
                    isLoading={isLoadingNextPage}
                    disabled={isLoadingAlternativeHotels}
                >
                    {LoadMoreCTA.value}
                </Button>
            )}
        </div>
    );
};

export default observer(AlternativeHotelsList);
