import { TripAdvisorAwardType } from 'models/enum/TripAdvisorAwardType';

export interface ITripAdvisorAwardItem {
    award_type: TripAdvisorAwardType;
    images: {
        large: string;
        small: string;
    };
    year: string;
}
