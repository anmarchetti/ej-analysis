import reviewsService from 'frontend/services/reviews.service';
import SiteSettings from 'models/enum/SiteSettings';

import { FeedbacksStore } from './FeedbacksStore';

describe('FeedbacksStore', () => {
    const createRootStore = () =>
        ({
            layoutStore: {
                getSetting: jest.fn(key => settings[key]),
            },
        } as any);

    const createMockResponse = () =>
        ({
            reviews: new Array(4).fill(0).map((_, idx) => ({
                customerName: `Customer ${idx}`,
                date: `2022-11-11T00:00:00-0${idx}00`,
                rating: `${idx + 1}`,
                text: `test ${idx}`,
            })),
            summary: {
                averageRating: 4.2,
                count: 21,
            },
        } as any);

    const createSettings = () => ({
        [SiteSettings.ReviewsRating]: ['4'],
    });

    const initialState = {
        reviews: [],
        averageRating: 0,
        count: 0,
    };

    const reviewsCount = 10;
    const fetchFeefoReviewsMock = jest.fn();
    let rootStore = createRootStore();
    let response = createMockResponse();
    let settings = createSettings();

    reviewsService.fetchFeefoReviews = fetchFeefoReviewsMock;

    beforeEach(() => {
        fetchFeefoReviewsMock.mockReset();
        rootStore = createRootStore();
        response = createMockResponse();
        settings = createSettings();
    });

    it('should set and reset store correctly', async () => {
        const store = new FeedbacksStore(rootStore);
        fetchFeefoReviewsMock.mockReturnValueOnce(Promise.resolve(response));

        await store.fetchFeefoReviews(reviewsCount);

        expect(rootStore.layoutStore.getSetting).toHaveBeenCalledWith(SiteSettings.ReviewsRating);
        expect(store.feedbackData).not.toEqual(initialState);
        expect(store.isError).not.toBeTruthy;
        store.resetStore();
        expect(store.feedbackData).toEqual(initialState);
    });

    it('should set error state on API fails', async () => {
        const store = new FeedbacksStore(rootStore);
        fetchFeefoReviewsMock.mockReturnValueOnce(Promise.reject);

        await store.fetchFeefoReviews(reviewsCount);
        expect(store.isError).toBeTruthy;
    });
});
