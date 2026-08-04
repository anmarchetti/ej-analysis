import { ITripAdvisorAwardItem } from 'models/data/ITripAdvisorAwardItem';

export interface IReviewsApiData {
    awards: ITripAdvisorAwardItem[];
    num_reviews: number;
    rating: number;
    review_rating_count: {
        1: string;
        2: string;
        3: string;
        4: string;
        5: string;
    };
    reviews: [
        {
            published_date: string;
            rating: number;
            text: string;
            title: string;
            user: {
                username: string;
            };
        },
    ];
    subratings: [
        {
            localized_name: string;
            value: number;
        },
    ];
    web_url: string;
}
