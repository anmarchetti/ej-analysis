import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { createLocalStore } from 'frontend/utils/createLocalStore';
import { TCustomersFeedbackProps } from 'frontend/components/renderings/CustomersFeedback/CustomersFeedback';

import { FeedbacksStore } from './FeedbacksStore';

export const [withFeedbacksStore, useFeedbacksStore] = createLocalStore<FeedbacksStore, TCustomersFeedbackProps>(
    (rootStore: HolidaysRootStore) => new FeedbacksStore(rootStore),
);
