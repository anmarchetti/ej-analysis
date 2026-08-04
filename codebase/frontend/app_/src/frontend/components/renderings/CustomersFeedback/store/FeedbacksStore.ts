import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import reviewsService from 'frontend/services/reviews.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { ICustomerFeedback, ICustomersFeedbackResponse } from 'models/data/ICustomerFeedback';
import SiteSettings from 'models/enum/SiteSettings';

enum FeefoPageType {
    Home = 'HomePage',
    Promo = 'PromoPage',
    Destination = 'DestinationPages',
}

export interface IFeedbackData {
    averageRating: number;
    count: number;
    reviews: ICustomerFeedback[];
}

export interface IFeedbacksInitialState {
    isError: boolean;
    feedbackData?: IFeedbackData;
}

export class FeedbacksStore {
    public maxRatingValue: number = 5;

    @observable isError: boolean = false;
    @observable feedbackData: IFeedbackData = {
        reviews: [],
        averageRating: 0,
        count: 0,
    };

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    @computed get pageType(): FeefoPageType {
        if (this.rootStore.layoutStore.isHomePage) return FeefoPageType.Home;

        if (this.rootStore.layoutStore.isPromoPage) return FeefoPageType.Promo;

        if (this.rootStore.layoutStore.isDestinationPage) return FeefoPageType.Destination;

        return FeefoPageType.Home;
    }

    @computed get isFeefoEnabled(): boolean {
        return !!this.rootStore.layoutStore.getSetting(SiteSettings.IsFeefoEnabled);
    }

    @computed get showReviews(): boolean {
        return !!this.rootStore.layoutStore.getSetting(SiteSettings[`ShowReviewsOn${this.pageType}`]);
    }

    @computed get showTitlesAndComments(): boolean {
        return !!this.rootStore.layoutStore.getSetting(SiteSettings[`ShowTitlesAndCommentsOn${this.pageType}`]);
    }

    @computed get reviewsCount(): { desktop: number; mobile: number } {
        return {
            desktop: this.rootStore.layoutStore.getSetting(SiteSettings[`ReviewsCountDesktopOn${this.pageType}`]),
            mobile: this.rootStore.layoutStore.getSetting(SiteSettings[`ReviewsCountMobileOn${this.pageType}`]),
        };
    }

    public fetchFeefoReviews = async (count: number) => {
        const rating = this.rootStore.layoutStore.getSetting(SiteSettings.ReviewsRating);

        try {
            const reviewsData = await reviewsService.fetchFeefoReviews(count, rating);
            this.setData(reviewsData);
            runInAction(() => {
                this.isError = false;
            });
        } catch {
            runInAction(() => {
                this.isError = true;
            });
        }
    };

    @action private setData(res: ICustomersFeedbackResponse) {
        if (!res) {
            return;
        }

        if (res.summary.averageRating) {
            this.feedbackData.averageRating = res.summary.averageRating;
        }

        if (res.summary.count) {
            this.feedbackData.count = res.summary.count;
        }

        if (res.reviews) {
            this.feedbackData.reviews = res.reviews.map(item => ({
                title: item.title || '',
                text: item.text || '',
                date: item.date || '',
                rating: item.rating || 0,
                customerName: item.customerName || '',
            }));
        }
    }

    @action resetStore = () => {
        this.feedbackData = {
            reviews: [],
            averageRating: 0,
            count: 0,
        };
    };
}
