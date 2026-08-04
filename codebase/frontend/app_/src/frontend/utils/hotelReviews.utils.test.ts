import { IReviewsApiData } from 'models/data/IReviewsApiData';

import { prepareReviewsData } from './hotelReviews.utils';

describe('prepareReviewsData', () => {
    it('should return null if apiData is null', () => {
        expect(prepareReviewsData(null)).toBeNull();
    });

    it('should map base fields: averageRating, webUrl, num_reviews and review_rating_count', () => {
        const apiData: IReviewsApiData = {
            rating: 4.5,
            web_url: 'http://test.com',
            num_reviews: 10,
            review_rating_count: { '5': 6, '4': 4 },
            reviews: [],
            subratings: [],
            awards: [],
        } as any;

        const result = prepareReviewsData(apiData)!;
        expect(result.averageRating).toBe(4.5);
        expect(result.webUrl).toBe('http://test.com');
        expect(result.totalReviewsAmount).toBe(10);
        expect(result.reviewRatingAmounts).toEqual([
            { index: 4, value: 40 },
            { index: 5, value: 60 },
        ]);
    });

    it('should sort reviews by date (desc) and limits to 3 items', () => {
        const apiData: IReviewsApiData = {
            reviews: [
                {
                    title: 'Old',
                    rating: 3,
                    published_date: '2021-01-01T00:00:00+0000',
                    user: { username: 'A' },
                    text: 'old text',
                },
                {
                    title: 'New',
                    rating: 5,
                    published_date: '2023-01-01T00:00:00+0000',
                    user: { username: 'B' },
                    text: 'new text',
                },
                {
                    title: 'Middle',
                    rating: 4,
                    published_date: '2022-01-01T00:00:00+0000',
                    user: { username: 'C' },
                    text: 'mid text',
                },
                {
                    title: 'Extra',
                    rating: 2,
                    published_date: '2020-01-01T00:00:00+0000',
                    user: { username: 'D' },
                    text: 'extra text',
                },
            ],
        } as any;

        const result = prepareReviewsData(apiData)!;
        expect(result.reviews).toHaveLength(3);
        expect(result.reviews.map(r => r.title)).toEqual(['New', 'Middle', 'Old']);
    });

    it('should map subratings correctly', () => {
        const apiData: IReviewsApiData = {
            subratings: [
                { localized_name: 'Cleanliness', value: 4 },
                { localized_name: 'Service', value: 5 },
            ],
        } as any;

        const result = prepareReviewsData(apiData)!;
        expect(result.subratings).toEqual([
            { title: 'Cleanliness', value: 4 },
            { title: 'Service', value: 5 },
        ]);
    });

    it('should filter and sorts awards', () => {
        const apiData: IReviewsApiData = {
            awards: [
                { award_type: 2, images: { large: 'img2' } },
                { award_type: 1, images: { large: 'img1' } },
                { award_type: 3, images: {} },
            ],
        } as any;

        const result = prepareReviewsData(apiData)!;
        expect(result.certificates).toHaveLength(2);
        expect(result.certificates.map(c => c.award_type)).toEqual([1, 2]);
    });

    it('should handle empty or undefined fields gracefully', () => {
        const apiData: IReviewsApiData = {
            rating: undefined,
            web_url: undefined,
            num_reviews: undefined,
            review_rating_count: undefined,
            reviews: [
                {
                    title: undefined,
                    rating: undefined,
                    published_date: undefined,
                    user: undefined,
                    text: undefined,
                },
            ],
        } as any;

        const result = prepareReviewsData(apiData)!;
        expect(result.averageRating).toBeNull();
        expect(result.webUrl).toBe('');
        expect(result.totalReviewsAmount).toBe(0);
        expect(result.reviewRatingAmounts).toEqual([]);
        expect(result.reviews[0]).toEqual({
            title: '',
            ratingNum: 0,
            publishedDate: '',
            author: '',
            text: '',
        });
    });

    it('should normalize timezone in published_date before sorting', () => {
        const apiData: IReviewsApiData = {
            reviews: [
                {
                    title: 'With +0000',
                    rating: 5,
                    published_date: '2022-05-01T00:00:00+0000',
                    user: { username: 'A' },
                    text: '',
                },
                {
                    title: 'With +00:00',
                    rating: 5,
                    published_date: '2022-06-01T00:00:00+00:00',
                    user: { username: 'B' },
                    text: '',
                },
            ],
        } as any;

        const result = prepareReviewsData(apiData)!;
        expect(result.reviews.map(r => r.title)).toEqual(['With +00:00', 'With +0000']);
    });
});
