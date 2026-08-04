import * as React from 'react';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';

import { Tokens } from 'code/tokens';
import { useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IReviewsData } from 'frontend/store/base';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import TripadvisorRating from 'frontend/components/common/TripadvisorRating/TripadvisorRating';
import IconChevronDown from 'frontend/components/icons/ChevronDown';
import IconChevronUp from 'frontend/components/icons/ChevronUp';

import { RatingBarItem } from './RatingBarItem';
import { RatingCategoryItem } from './RatingCategoryItem';
import ReviewsDrawer from './ReviewsDrawer';
import ReviewsList from './ReviewsList';
import TripAdvisorCertificates from './TripAdvisorCertificates';

export interface IReviewsProps {
    rating: Nullable<number>;
    reviews: Nullable<number>;
    tripadvisorId: Nullable<string>;
    SSRData?: Nullable<IReviewsData>;
    anchor?: string;
    showRatingValue?: boolean;
}

export interface IReviewRatingAmount {
    index: number;
    value: number;
}
export interface ISubrating {
    title: string;
    value: number;
}

export const Reviews: FC<IReviewsProps> = ({ anchor, rating, reviews, tripadvisorId, SSRData, showRatingValue }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const showLessRef = useRef<HTMLDivElement>(null);
    const showLessMobileRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const { getPhrase, reviewsData, fetchReviews, resetStore, layout, selectedOffer, getFormattedNumber } = useStore(
        stores => ({
            reviewsData: stores.hotelReviewsStore.data,
            fetchReviews: stores.hotelReviewsStore.fetchReviews,
            resetStore: stores.hotelReviewsStore.resetStore,
            layout: stores.layoutStore.layout,
            selectedOffer: stores.bookingStore.selectedOffer,
            getPhrase: stores.layoutStore.getPhrase,
            getFormattedNumber: stores.marketStore.getFormattedNumber,
        }),
    );

    const isExtraSmallMobile = useXSMobileViewport();

    const trackScrolling = useCallback(() => {
        if (!SSRData && wrapperRef.current && isTopReached(wrapperRef.current)) {
            fetchReviews();
            document.removeEventListener('scroll', trackScrolling);
        }
    }, [fetchReviews, SSRData]);

    useEffect(() => {
        resetStore();
        document.addEventListener('scroll', trackScrolling);

        return () => {
            resetStore();
            document.removeEventListener('scroll', trackScrolling);
        };
    }, [layout.sitecore.route.itemId, selectedOffer, resetStore, trackScrolling]);

    useEffect(() => {
        setIsExpanded(false);
    }, [isExtraSmallMobile]);

    const isTopReached = (el: HTMLDivElement): boolean => {
        const windowTopPosition = document.documentElement.scrollTop || document.body.scrollTop;

        return el.getBoundingClientRect().top <= windowTopPosition - window.innerHeight;
    };

    const marks = {
        5: getPhrase(SitecoreDictionary.HotelReviewsLabelsTripAdvisorMarksFive),
        4: getPhrase(SitecoreDictionary.HotelReviewsLabelsTripAdvisorMarksFour),
        3: getPhrase(SitecoreDictionary.HotelReviewsLabelsTripAdvisorMarksThree),
        2: getPhrase(SitecoreDictionary.HotelReviewsLabelsTripAdvisorMarksTwo),
        1: getPhrase(SitecoreDictionary.HotelReviewsLabelsTripAdvisorMarksOne),
    };

    const reviewsText = useMemo(
        () =>
            Tokenizer.replaceToken(
                getPhrase(
                    reviews === 1
                        ? SitecoreDictionary.HotelReviewsLabelsBasedOnReviewSingular
                        : SitecoreDictionary.HotelReviewsLabelsBasedOnReviewsPlural,
                ),
                Tokens.Review,
                getFormattedNumber(reviews || 0),
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [reviews],
    );

    const openReviews = (): void => {
        setIsExpanded(true);
        scrollToReviews();
    };

    const closeReviews = (): void => {
        setIsExpanded(false);
        scrollToReviews();
    };

    const toggleReviews = (): void => {
        setIsExpanded(prev => !prev);
        scrollToReviews();
    };

    const scrollToReviews = (): void => {
        const node = isExtraSmallMobile ? showLessMobileRef.current : showLessRef.current;

        if (node) {
            scrollIntoViewIfNeeded(node, {
                behavior: 'smooth',
                block: 'start',
            });
        }
    };

    if (!tripadvisorId) {
        return null;
    }

    const feedClassname = classNames('reviews__feed d-none d-sm-block mt-5', isExpanded && 'is-open');

    const dataForRendering = SSRData ?? reviewsData;

    return (
        <section id={anchor} className='reviews' data-tid='tripadvisor-reviews-section' ref={wrapperRef}>
            {dataForRendering && !!dataForRendering.totalReviewsAmount && (
                <>
                    <div className='reviews__header d-flex justify-content-between' ref={showLessRef}>
                        <h2 className='step__title reviews__header__title m-0'>
                            {getPhrase(SitecoreDictionary.HotelReviewsLabelsReviews)}
                        </h2>
                    </div>
                    <div className='reviews__main'>
                        <div className='tripadvisor-aggregate'>
                            <div>
                                {!!rating && (
                                    <div className='tripadvisor-aggregate--rating'>
                                        <TripadvisorRating hasIcon showRatingValue={showRatingValue} rating={rating} />
                                    </div>
                                )}
                                <div className='tripadvisor-aggregate--text'>{reviewsText}</div>
                            </div>
                        </div>
                        <div className='tripadvisor-rating_bars'>
                            <div className='tripadvisor-rating_bars__marks'>
                                {dataForRendering.reviewRatingAmounts
                                    .slice()
                                    .sort((itemA, itemB) => +itemB.index - +itemA.index)
                                    .map(item => (
                                        <RatingBarItem
                                            key={item.index}
                                            percentage_value={item.value}
                                            mark={marks[item.index]}
                                        />
                                    ))}
                            </div>
                            <div className='tripadvisor-rating_bars__categories'>
                                {dataForRendering.subratings.map(item => (
                                    <RatingCategoryItem key={item.title} ratingNum={item.value} title={item.title} />
                                ))}
                            </div>
                        </div>
                        <TripAdvisorCertificates />
                    </div>
                    {!!dataForRendering.reviews.length &&
                        (isExtraSmallMobile ? (
                            <div className='reviews__drawer d-block d-md-none mt-4' data-tid='reviews-drawer-section'>
                                <ReviewsDrawer
                                    isExpanded={isExpanded}
                                    showLessMobileRef={showLessMobileRef}
                                    onClose={closeReviews}
                                    reviewsData={dataForRendering}
                                />
                                <div className='open-drawer'>
                                    <Button onClick={openReviews} isOutlined>
                                        {getPhrase(SitecoreDictionary.HotelReviewsLabelsOpenReviewsDrawer)}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className={feedClassname} data-tid='reviews-feed-section'>
                                <ReviewsList reviewsData={dataForRendering} isExpanded={isExpanded} />
                                <Button
                                    className={isExpanded ? 'reviews__feed--close' : 'reviews__feed--open'}
                                    isText
                                    onClick={toggleReviews}
                                    isOutlined
                                    dataTid='hotel-reviews-button-open'
                                >
                                    {isExpanded
                                        ? getPhrase(SitecoreDictionary.HotelReviewsLabelsCloseReviewsList)
                                        : getPhrase(SitecoreDictionary.HotelReviewsLabelsOpenReviewsList)}
                                    {isExpanded ? <IconChevronUp /> : <IconChevronDown />}
                                </Button>
                            </div>
                        ))}
                </>
            )}
        </section>
    );
};

export default observer(Reviews);
