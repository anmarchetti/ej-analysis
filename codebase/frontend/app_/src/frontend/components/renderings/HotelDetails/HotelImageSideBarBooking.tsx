import * as React from 'react';
import { inject } from 'mobx-react';

import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { IHotel } from 'models/data/IHotel';
import { IOffer } from 'models/data/IOffer';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import HotelImageCarouselSidebar, {
    IHotelImageSideBarParams,
} from 'frontend/components/renderings/HotelDetails/components/HotelImageCarouselSidebar/HotelImageCarouselSidebar';

interface IHotelImageSideBarBookingParams extends ISitecoreComponent<null, IHotelImageSideBarParams> {
    hotelInfo: Nullable<IHotel>;
    offer: Nullable<IOffer>;

    // props injected from Holidays Stores (undefined in Trade Portal)
    selectedSeatsPrice?: number;
    selectedSeatsPricePP?: number;
    setBookingSidebarLoaded?: (value: boolean) => void;
}

export const HotelImageSideBarBooking = (props: IHotelImageSideBarBookingParams): JSX.Element => {
    React.useEffect(() => {
        if (props.setBookingSidebarLoaded) {
            props.setBookingSidebarLoaded(true);
        }
    }, [props]);

    return (
        <HotelImageCarouselSidebar
            hotelInfo={props.hotelInfo}
            offer={props.offer}
            selectedSeatsPrice={props.selectedSeatsPrice}
            selectedSeatsPricePP={props.selectedSeatsPricePP}
            reviewsAnchor={props.params?.reviewsAnchor || ''}
            rendering={props.rendering}
        />
    );
};

const ConnectedHotelImageSideBarBooking = inject((stores: TStores) => ({
    hotelInfo: stores.bookingStore.hotel,
    offer: stores.bookingStore.selectedOffer,
    setBookingSidebarLoaded: stores.bookingStore.setBookingSidebarLoaded,

    // Inject Holidays only Stores
    ...(isHolidayStore(stores) && {
        selectedSeatsPrice: stores.seatMapStore.selectedSeatsPrice,
        selectedSeatsPricePP: stores.seatMapStore.selectedSeatsPricePP,
    }),
}))(HotelImageSideBarBooking);

export default ConnectedHotelImageSideBarBooking;
