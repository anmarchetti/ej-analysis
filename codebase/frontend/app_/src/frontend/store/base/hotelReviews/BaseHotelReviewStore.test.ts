import reviewsService from 'frontend/services/reviews.service';
import { TripAdvisorAwardType } from 'models/enum/TripAdvisorAwardType';

import { BaseHotelReviewsStore } from './BaseHotelReviewsStore';

describe('BaseHotelReviewsStore', () => {
    const createRootStore = () =>
        ({
            bookingStore: {
                selectedOffer: {
                    hotel: {
                        tripAdvisorId: '123123123',
                    },
                },
            },
            layoutStore: {
                isHotelDetailsBrowsePage: true,
                pageFields: {
                    TripAdvisorId: {
                        value: '123123',
                    },
                },
            },
            viewBookingStore: {
                isViewBookingStatusPage: false,
            },
        } as any);

    const createMockResponse = () =>
        ({
            num_reviews: 1,
            rating: 2,
            reviews: new Array(4).fill(0).map((item, index) => ({
                title: index.toString(),
                rating: '',
                published_date: `2020-01-01T00:00:00-0${index}00`,
                user: {
                    username: '',
                },
                text: '',
            })),
            review_rating_count: {
                1: '111',
                2: '222',
                3: '333',
                4: '444',
                5: '555',
            },
            subratings: [
                {
                    localized_name: 'name',
                    value: 1,
                },
            ],
            awards: [
                {
                    award_type: TripAdvisorAwardType.TravelersChoiceBestOfBest,
                    images: {
                        large: {
                            id: 'large image',
                        },
                    },
                },
            ],
            web_url: 'web url',
        } as any);

    const initialState = {
        averageRating: null,
        totalReviewsAmount: 0,
        webUrl: '',
        reviews: [],
        reviewRatingAmounts: [],
        subratings: [],
        certificates: [],
    };

    const fetchReviewsMock = jest.fn();
    reviewsService.fetchReviews = fetchReviewsMock;

    let rootStore = createRootStore();
    let response = createMockResponse();

    beforeEach(() => {
        fetchReviewsMock.mockReset();
        rootStore = createRootStore();
        response = createMockResponse();
    });

    it('should correctly get tripAdviserId from sitecore', async () => {
        const store = new BaseHotelReviewsStore(rootStore);

        await store.fetchReviews();

        expect(fetchReviewsMock).toHaveBeenCalledTimes(1);
        expect(fetchReviewsMock).toHaveBeenCalledWith(+rootStore.layoutStore.pageFields.TripAdvisorId.value);
    });

    it('should correctly get tripAdvisorId when isViewBookingStatusPage is true', async () => {
        rootStore.layoutStore.isHotelDetailsBrowsePage = false;
        rootStore.viewBookingStore = {
            isViewBookingStatusPage: true,
            booking: {
                hotel: {
                    tripAdvisorId: '123123123',
                },
            },
        };
        const store = new BaseHotelReviewsStore(rootStore);

        await store.fetchReviews();

        expect(fetchReviewsMock).toHaveBeenCalledTimes(1);
        expect(fetchReviewsMock).toHaveBeenCalledWith(+rootStore.viewBookingStore.booking.hotel.tripAdvisorId);
    });

    it('should correctly get tripAdviserId from offer', async () => {
        rootStore.layoutStore.isHotelDetailsBrowsePage = null;
        const store = new BaseHotelReviewsStore(rootStore);

        await store.fetchReviews();

        expect(fetchReviewsMock).toHaveBeenCalledTimes(1);
        expect(fetchReviewsMock).toHaveBeenCalledWith(+rootStore.bookingStore.selectedOffer.hotel.tripAdvisorId);
    });

    it('should skip request because of invalid offer', async () => {
        rootStore.layoutStore = {};
        rootStore.bookingStore.selectedOffer = null;
        const store = new BaseHotelReviewsStore(rootStore);

        await store.fetchReviews();

        expect(fetchReviewsMock).toHaveBeenCalledTimes(0);
    });

    it('should skip request because of invalid hotel', async () => {
        rootStore.layoutStore = {};
        rootStore.bookingStore.selectedOffer.hotel = null;
        const store = new BaseHotelReviewsStore(rootStore);

        await store.fetchReviews();

        expect(fetchReviewsMock).toHaveBeenCalledTimes(0);
    });

    it('should NOT update data in case if invalid response', async () => {
        const store = new BaseHotelReviewsStore(rootStore);

        fetchReviewsMock.mockReturnValueOnce(Promise.resolve({}));

        await store.fetchReviews();

        expect(store.data).toEqual(initialState);
    });

    it('should update averageRating', async () => {
        const store = new BaseHotelReviewsStore(rootStore);

        fetchReviewsMock.mockReturnValueOnce(Promise.resolve(response));

        await store.fetchReviews();

        expect(store.data.averageRating).toBe(response.rating);
    });

    it('should update totalReviewsAmount', async () => {
        const store = new BaseHotelReviewsStore(rootStore);

        fetchReviewsMock.mockReturnValueOnce(Promise.resolve(response));

        await store.fetchReviews();

        expect(store.data.totalReviewsAmount).toBe(response.num_reviews);
    });

    it('should update webUrl', async () => {
        const store = new BaseHotelReviewsStore(rootStore);

        fetchReviewsMock.mockReturnValueOnce(Promise.resolve(response));

        await store.fetchReviews();

        expect(store.data.webUrl).toBe(response.web_url);
    });

    it('should update reviewRatingAmounts', async () => {
        const store = new BaseHotelReviewsStore(rootStore);

        fetchReviewsMock.mockReturnValueOnce(Promise.resolve(response));

        await store.fetchReviews();

        expect(store.data.reviewRatingAmounts.length).toBe(Object.values(response.review_rating_count).length);
    });

    it('should update reviews and sort it by publish date', async () => {
        const store = new BaseHotelReviewsStore(rootStore);

        fetchReviewsMock.mockReturnValueOnce(Promise.resolve(response));

        await store.fetchReviews();

        const reviewsPublishDates = store.data.reviews.map(review => review.publishedDate);

        expect(store.data.reviews.length).toBe(3);
        expect(reviewsPublishDates).toEqual([
            '2020-01-01T00:00:00-0300',
            '2020-01-01T00:00:00-0200',
            '2020-01-01T00:00:00-0100',
        ]);
    });

    it('should update subratings', async () => {
        const store = new BaseHotelReviewsStore(rootStore);

        fetchReviewsMock.mockReturnValueOnce(Promise.resolve(response));

        await store.fetchReviews();

        const subratings = response.subratings.map(item => ({
            title: item.localized_name,
            value: item.value,
        }));

        expect(store.data.subratings).toEqual(subratings);
    });

    it('should update certificates', async () => {
        const store = new BaseHotelReviewsStore(rootStore);

        fetchReviewsMock.mockReturnValueOnce(Promise.resolve(response));

        await store.fetchReviews();

        expect(store.data.certificates[0].images.large).toEqual(response.awards[0].images.large);
    });

    it('should NOT update certificates because of empty awards', async () => {
        const store = new BaseHotelReviewsStore(rootStore);
        response.awards = [];
        fetchReviewsMock.mockReturnValueOnce(Promise.resolve(response));

        await store.fetchReviews();

        expect(store.data.certificates).toEqual(initialState.certificates);
    });

    it('should NOT update certificates because award do not consist images', async () => {
        const store = new BaseHotelReviewsStore(rootStore);
        response.awards[0].images = null;
        fetchReviewsMock.mockReturnValueOnce(Promise.resolve(response));

        await store.fetchReviews();

        expect(store.data.certificates).toEqual(initialState.certificates);
    });

    it('should NOT update certificates because award do not consist large image', async () => {
        const store = new BaseHotelReviewsStore(rootStore);
        response.awards[0].images.large = null;
        fetchReviewsMock.mockReturnValueOnce(Promise.resolve(response));

        await store.fetchReviews();

        expect(store.data.certificates).toEqual(initialState.certificates);
    });

    it('should correctly reset store', async () => {
        const store = new BaseHotelReviewsStore(rootStore);
        fetchReviewsMock.mockReturnValueOnce(Promise.resolve(response));

        await store.fetchReviews();

        expect(store.data).not.toEqual(initialState);

        store.resetStore();

        expect(store.data).toEqual(initialState);
    });
});
