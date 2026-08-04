import * as React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import HotelImageCarousel from './components/HotelImageCarousel';

type THotelImageCarouselBookingProps = ISitecoreComponent<null, null>;

const HotelImageCarouselBooking: React.FC<THotelImageCarouselBookingProps> = props => {
    const { offer, failedToLoadData, getSetting } = useStore((stores: TStores) => ({
        offer: stores.bookingStore.selectedOffer,
        failedToLoadData: stores.bookingStore.failedToLoadData,
        getSetting: stores.layoutStore.getSetting,
    }));

    const fallbackImage = getSetting(SiteSettings.HotelFallbackImage);

    if (failedToLoadData) {
        return <h2 className='text-center fallback-text'>Failed to load offer data.</h2>;
    }

    return <HotelImageCarousel rendering={props.rendering} fallbackImage={fallbackImage} offer={offer} />;
};

export default observer(HotelImageCarouselBooking);
