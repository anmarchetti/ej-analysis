import { IReviewsData } from 'frontend/store/base';
import { IReviewsApiData } from 'models/data/IReviewsApiData';

import { compare } from './sort.utils';

export const prepareReviewsData = (apiData: Nullable<IReviewsApiData>): IReviewsData | null => {
    if (!apiData) {
        return null;
    }

    const preparedData: IReviewsData = {
        averageRating: null,
        totalReviewsAmount: 0,
        reviews: [],
        reviewRatingAmounts: [],
        subratings: [],
        certificates: [],
        webUrl: '',
    };

    preparedData.averageRating = apiData.rating || null;
    preparedData.webUrl = apiData.web_url || '';

    if (apiData.num_reviews) {
        preparedData.totalReviewsAmount = apiData.num_reviews;

        if (apiData.review_rating_count) {
            preparedData.reviewRatingAmounts = Object.keys(apiData.review_rating_count).map(key => ({
                index: +key,
                value: Math.round((100 * +apiData.review_rating_count[key]) / apiData.num_reviews),
            }));
        }
    }

    preparedData.reviews = (apiData.reviews || [])
        .map(item => ({
            title: item.title || '',
            ratingNum: item.rating || 0,
            publishedDate: item.published_date || '',
            author: item.user ? item.user.username : '',
            text: item.text || '',
        }))
        .sort((firstItem, secondItem) => {
            const firstItemDate = firstItem.publishedDate.replace(/([+-]\d\d)(\d\d)$/, '$1:$2');
            const secondItemDate = secondItem.publishedDate.replace(/([+-]\d\d)(\d\d)$/, '$1:$2');

            return new Date(secondItemDate).getTime() - new Date(firstItemDate).getTime();
        })
        .slice(0, 3);

    preparedData.subratings = (apiData.subratings || []).map(item => ({
        title: item.localized_name,
        value: item.value,
    }));

    preparedData.certificates = (apiData.awards || [])
        .filter(award => !!award?.images?.large)
        .sort((a, b) => compare(a, b, 'award_type'));

    return preparedData;
};
