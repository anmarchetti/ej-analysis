import { action, computed, makeObservable, observable } from 'mobx';

import reviewsService from 'frontend/services/reviews.service';
import { ViewBookingStore } from 'frontend/store/holidays/viewBooking/viewBookingStore';
import { TRootStore } from 'frontend/store/IStores';
import { prepareReviewsData } from 'frontend/utils/hotelReviews.utils';
import { IReviewsApiData } from 'models/data/IReviewsApiData';
import { ITripAdvisorAwardItem } from 'models/data/ITripAdvisorAwardItem';
import { IReview } from 'frontend/components/renderings/HotelReviews/components/Review';
import { IReviewRatingAmount, ISubrating } from 'frontend/components/renderings/HotelReviews/components/Reviews';

export interface IReviewsData {
    averageRating: Nullable<number>;
    certificates: ITripAdvisorAwardItem[];
    reviewRatingAmounts: IReviewRatingAmount[];
    reviews: IReview[];
    subratings: ISubrating[];
    totalReviewsAmount: number;
    webUrl: string;
}

export class BaseHotelReviewsStore {
    @observable data: IReviewsData = {
        averageRating: null,
        totalReviewsAmount: 0,
        reviews: [],
        reviewRatingAmounts: [],
        subratings: [],
        certificates: [],
        webUrl: '',
    };

    private cache = new Map();

    constructor(private rootStore: TRootStore) {
        makeObservable(this);
    }

    public fetchReviews = async (): Promise<void> => {
        if (!this.tripAdvisorId) {
            return;
        }

        if (this.cache.has(this.tripAdvisorId)) {
            this.prepareData(this.cache.get(this.tripAdvisorId));

            return;
        }

        const reviewsData = await reviewsService.fetchReviews(this.tripAdvisorId);
        this.cache.set(this.tripAdvisorId, reviewsData);
        this.prepareData(reviewsData);
    };

    @computed private get tripAdvisorId(): Nullable<number> {
        if (this.rootStore.layoutStore.isHotelDetailsBrowsePage) {
            return Number(this.rootStore.layoutStore.pageFields?.TripAdvisorId?.value) || null;
        } else if ((this.rootStore.viewBookingStore as ViewBookingStore).isViewBookingStatusPage) {
            return Number(this.rootStore.viewBookingStore.booking?.hotel?.tripAdvisorId) || null;
        }

        return Number(this.rootStore.bookingStore.selectedOffer?.hotel?.tripAdvisorId) || null;
    }

    @action private prepareData(apiData: Nullable<IReviewsApiData>) {
        const preparedData = prepareReviewsData(apiData);

        if (preparedData) {
            this.data = { ...preparedData };
        }
    }

    @action resetStore = (): void => {
        this.data = {
            averageRating: null,
            totalReviewsAmount: 0,
            reviews: [],
            reviewRatingAmounts: [],
            subratings: [],
            certificates: [],
            webUrl: '',
        };
    };
}

export default BaseHotelReviewsStore;
