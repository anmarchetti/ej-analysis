import React from 'react';
import { Guid } from 'guid-typescript';
import { inject, observer } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { IAnchorParameters } from 'models/data/IAnchorParameters';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import HotelInfo from './components/HotelInfo';

interface IHotelInfoBookingProps extends IComponentWithDictionary, ISitecoreComponent<null, IAnchorParameters> {
    isShowEcoFacilityPlaceholder: boolean;
    offer: Nullable<IOfferWithoutAltBoards>;
}

export const HotelInfoBooking: React.FC<IHotelInfoBookingProps> = props => {
    const { offer, rendering, isShowEcoFacilityPlaceholder, params } = props;

    return (
        <HotelInfo
            offer={offer}
            anchor={params ? params.Anchor : Guid.create().toString()}
            rendering={rendering}
            isShowEcoFacilityPlaceholder={isShowEcoFacilityPlaceholder}
        />
    );
};

export default inject((stores: TStores) => ({
    offer: stores.bookingStore.selectedOffer,
}))(observer(HotelInfoBooking));
