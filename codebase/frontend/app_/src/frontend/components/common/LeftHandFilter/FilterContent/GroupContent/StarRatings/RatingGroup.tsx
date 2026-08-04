import { FC } from 'react';
import { observer } from 'mobx-react';

import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { TLeftHandFilterStoreInstance } from 'frontend/components/common/LeftHandFilter/FilterContent/models';

import StarRatings from './StarRatings';
import TripAdvisorRatings from './TripAdvisorRatings';

interface IRatingGroupProps {
    storeInstance: TLeftHandFilterStoreInstance;
    triggeringCode: FilterGroupCodes.StarRating | FilterGroupCodes.TripAdvisorRating;
}

const RatingGroup: FC<IRatingGroupProps> = ({ storeInstance, triggeringCode }) => {
    switch (triggeringCode) {
        case FilterGroupCodes.TripAdvisorRating:
            return (
                <>
                    <TripAdvisorRatings storeInstance={storeInstance} />
                    <StarRatings storeInstance={storeInstance} />
                </>
            );
        case FilterGroupCodes.StarRating:
        default:
            return (
                <>
                    <StarRatings storeInstance={storeInstance} />
                    <TripAdvisorRatings storeInstance={storeInstance} />
                </>
            );
    }
};

export default observer(RatingGroup);
