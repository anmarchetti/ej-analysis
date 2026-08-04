import React, { useMemo } from 'react';
import { observer } from 'mobx-react';

import { ITour } from 'models/data/map/IItinerary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import DestinationGuides from 'frontend/components/common/DestinationGuides';

export interface IIItinerariesPropsFields {
    items: [
        {
            children: ITour[];
        },
    ];
}

export type TItinerariesProps = ISitecoreComponent<IIItinerariesPropsFields>;

export const Itineraries: React.FC<TItinerariesProps> = observer(props => {
    const tours: Nullable<ITour[]> = useMemo(() => {
        const { fields } = props;

        return fields?.items?.length ? fields.items[0].children : null;
    }, [props]);

    return <>{tours && <DestinationGuides tours={tours} />}</>;
});

export default Itineraries;
