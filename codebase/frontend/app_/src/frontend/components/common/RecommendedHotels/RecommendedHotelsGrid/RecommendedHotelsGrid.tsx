import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IOffer } from 'models/data/IOffer';
import { IRecommendedHotelsFields } from 'models/data/IRecommendedHotels';
import { RecommendedType } from 'models/enum/RecommendedType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import CarouselOfferCard from 'frontend/components/renderings/SearchResults/components/CarouselOfferCard';

const MAX_ITEMS_IN_ROW = 4;

interface IRecommendedHotelsGridProps {
    fallbackImage: string;
    initialNumberOfHotelsDesktop: number;
    initialNumberOfHotelsMobile: number;
    offers: IOffer[];
    title: string;
    displaySponsoredLabel?: boolean;
    fields?: IRecommendedHotelsFields;
}

const RecommendedHotelsGrid = ({
    initialNumberOfHotelsDesktop,
    initialNumberOfHotelsMobile,
    title,
    offers,
    fallbackImage,
    displaySponsoredLabel,
    fields,
}: IRecommendedHotelsGridProps) => {
    const [offersToShow, setOffersToShow] = useState<IOffer[]>([]);
    const [initialItemsAmount, setInitialItemsAmount] = useState<number>(0);

    const {
        onSelectRecommendedOffer,
        isScreenMedium,
        getPhrase,
        trackRecommenderLoaded,
        trackRecommenderPagination,
        trackRecommenderHotelClick,
    } = useStore(stores => ({
        onSelectRecommendedOffer: stores.bookingStore.onSelectRecommendedOffer,
        isScreenMedium: stores.appStore.isScreenMedium,
        getPhrase: stores.layoutStore.getPhrase,
        trackRecommenderLoaded: stores.trackingStore.trackRecommenderLoaded,
        trackRecommenderPagination: stores.trackingStore.trackRecommenderPagination,
        trackRecommenderHotelClick: stores.trackingStore.trackRecommenderHotelClick,
    }));

    useEffect(() => {
        const initialItemsAmount = isScreenMedium ? initialNumberOfHotelsDesktop : initialNumberOfHotelsMobile;
        const offersToShow = offers.length <= initialItemsAmount ? offers : offers.slice(0, initialItemsAmount);
        updateSettings(initialItemsAmount, offersToShow);

        offers.length > 0 &&
            trackRecommenderLoaded(offers, {
                currentSlide: 0,
                previousSlide: 0,
                slidesToShow: offersToShow.length,
                slidesToSlide: initialItemsAmount,
                totalItems: offers.length,
            });
    }, []);

    useEffect(() => {
        const initialItemsAmount = isScreenMedium ? initialNumberOfHotelsDesktop : initialNumberOfHotelsMobile;
        const offersToShow = offers.length <= initialItemsAmount ? offers : offers.slice(0, initialItemsAmount);
        updateSettings(initialItemsAmount, offersToShow);
    }, [isScreenMedium]);

    const updateSettings = (initialItemsAmount: number, offersToShow: IOffer[]) => {
        setInitialItemsAmount(initialItemsAmount);
        setOffersToShow(offersToShow);
    };

    const onToggleClick = () => {
        const newOffers =
            offersToShow.length - offers.length < 0
                ? offers.slice(0, offersToShow.length + initialItemsAmount)
                : offers.slice(0, initialItemsAmount);
        setOffersToShow(newOffers);
        trackRecommenderPagination(offers, {
            currentSlide: 0,
            previousSlide: 0,
            slidesToShow: newOffers.length,
            slidesToSlide: initialItemsAmount,
            totalItems: offers.length,
        });
    };

    const onSelectOffer = (offer: IOffer, url: string, index: number) => {
        const initialItemsAmount = isScreenMedium ? initialNumberOfHotelsDesktop : initialNumberOfHotelsMobile;

        onSelectRecommendedOffer(offer, url);
        trackRecommenderHotelClick(
            offer,
            index,
            {
                currentSlide: 0,
                previousSlide: 0,
                slidesToShow: offersToShow.length,
                slidesToSlide: initialItemsAmount,
                totalItems: offers.length,
            },
            true,
        );
    };

    if (!offers.length) {
        return null;
    }

    const isToggleButtonShown = offers.length > initialItemsAmount;

    return (
        <div className='wrapper-component-container__inner'>
            <div className='recommended-hotels-grid hotels-carousel--slim'>
                <h2 className='recommended-hotels-grid__title' data-tid='title'>
                    {title}
                </h2>
                <div
                    className={classNames(
                        'recommended-hotels-grid__offers',
                        isScreenMedium &&
                            offers.length < MAX_ITEMS_IN_ROW &&
                            'recommended-hotels-grid__offers--one-row',
                    )}
                >
                    {offersToShow.map((offer, i) => (
                        <CarouselOfferCard
                            key={`${offer.id}_${i}`}
                            offer={offer}
                            offerIndex={i}
                            fallbackImage={fallbackImage || ''}
                            onSelect={(offer, url) => onSelectOffer(offer, url, i)}
                            recommendedType={RecommendedType.Browse}
                            fields={fields}
                            isGrid
                            displaySponsoredLabel={displaySponsoredLabel}
                        />
                    ))}
                </div>
                {isToggleButtonShown && (
                    <Button className='recommended-hotels-grid__btn' onClick={onToggleClick}>
                        {offersToShow.length === offers.length
                            ? getPhrase(SitecoreDictionary.GlobalsButtonsCollapse)
                            : getPhrase(SitecoreDictionary.SearchResultsButtonsLoadMore)}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default observer(RecommendedHotelsGrid);
