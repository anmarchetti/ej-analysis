import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IOffer } from 'models/data/IOffer';
import { OfferCardSlider } from 'frontend/components/common/OfferCardSlider/OfferCardSlider';

import styles from './SummaryHotelImagesCarousel.module.scss';

const SummaryHotelImagesCarousel = () => {
    const { offer } = useStore((stores: IHolidaysStores) => ({
        offer: stores.bookingStore.selectedOffer,
    }));

    return (
        <OfferCardSlider
            className={styles.carousel}
            images={offer?.hotel?.images}
            offer={offer as IOffer}
            fallbackImage=''
            showIndex={false}
            aria-roledescription='carousel'
            aria-label='Hotel photo gallery'
        />
    );
};

export default observer(SummaryHotelImagesCarousel);
