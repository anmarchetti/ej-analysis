import { useEffect, useState } from 'react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import bookingService from 'frontend/services/booking.service';
import { buildFrontendImageWithFallBack } from 'frontend/utils/url.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import SiteSettings from 'models/enum/SiteSettings';

const useBookingDestImage = (booking?: IBookingInfo | null) => {
    const { getSetting } = useStore(stores => ({
        getSetting: stores.layoutStore.getSetting,
    }));

    const [destImage, setDestImage] = useState('');

    const fallbackImage = getSetting(SiteSettings.HotelFallbackImage);
    const backgroundImage = buildFrontendImageWithFallBack(cmsUrls.media(destImage), fallbackImage);

    useEffect(() => {
        const getDestImage = async () => {
            const destCode = booking?.hotel?.location?.code || booking?.package?.accom?.hotel?.location?.code;
            let img = '';

            if (destCode) {
                try {
                    img = await bookingService.loadDestinationImage(destCode);
                } catch (e) {
                    console.error(e);
                }
            }

            setDestImage(img);
        };

        getDestImage();
    }, [booking]);

    if (!booking) {
        return undefined;
    }

    return backgroundImage;
};

export default useBookingDestImage;
