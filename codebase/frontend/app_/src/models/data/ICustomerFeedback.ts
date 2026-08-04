export interface ICustomerFeedback {
    date: string;
    rating: number;
    text: string;
    customerName?: string;
    title?: string;
}

export interface ICustomersFeedbackResponse {
    reviews: ICustomerFeedback[];
    summary: {
        averageRating: number;
        count: number;
    };
}

export enum ItemsPerSlide {
    Desktop = 4,
    Mobile = 1,
}
