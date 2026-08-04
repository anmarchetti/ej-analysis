import * as React from 'react';
import { inject } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { IAnchorParameters } from 'models/data/IAnchorParameters';
import { IHotel } from 'models/data/IHotel';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import Anchors, { TAnchorsProps } from './components/Anchors';

interface IAnchorsBookingProps extends ISitecoreComponent<TAnchorsProps, IAnchorParameters> {
    hotelInfo: Nullable<IHotel>;
}

const AnchorsBooking = ({ fields, hotelInfo }: IAnchorsBookingProps) => {
    if (!fields) {
        return null;
    }

    return <Anchors items={fields.items} reviews={hotelInfo?.numberOfReviews} />;
};

const ConnectedAnchorsBooking = inject((stores: TStores) => ({
    hotelInfo: stores.bookingStore.hotel,
}))(AnchorsBooking);

export default ConnectedAnchorsBooking;
