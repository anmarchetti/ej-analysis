import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import OfferCardSlider from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import ShowMoreButton from 'frontend/components/common/ShowMoreButton';
import StarRating from 'frontend/components/common/StarRating';

import styles from './HotelSummaryPreview.module.scss';

export type THotelSummaryPreviewProps = {
    shouldShowBtn: boolean;
    toggleShowDetails: (isShown: boolean) => void;
    title?: ISitecoreField<string>;
    viewSummaryLabel?: string;
};

const HotelSummaryPreview: FC<THotelSummaryPreviewProps> = ({
    title,
    viewSummaryLabel,
    toggleShowDetails,
    shouldShowBtn,
}) => {
    const { booking, getSetting } = useStore((stores: IHolidaysStores) => ({
        booking: stores.viewBookingStore.booking,
        getSetting: stores.layoutStore.getSetting,
    }));

    if (!booking) {
        return null;
    }

    const hotelFallbackImage = getSetting(SiteSettings.HotelFallbackImage);
    const fallbackImage = cmsUrls.media(hotelFallbackImage);

    const { hotel } = booking;

    const hotelImages = hotel?.images ?? booking.package?.accom?.hotel?.images;
    const hotelRating = hotel?.starRating ? Number.parseInt(hotel.starRating.substring(-1, 1)) : null;

    return (
        <div className={styles.card} data-tid='hotel-summary-card'>
            <Text tag='h2' className={styles.title} data-tid='hotel-summary-card-title' field={title} />
            <OfferCardSlider
                className={styles.gallery}
                images={hotelImages}
                fallbackImage={fallbackImage}
                showIndex
                isFullScreenEnabled
            />
            <div>
                {!!hotel?.name && (
                    <h3 className={styles.hotelName} data-tid='hotel-summary-hotel-name'>
                        {hotel.name}
                    </h3>
                )}
                {!!hotelRating && hotelRating > 0 && (
                    <div className={styles.rating} data-tid='hotel-summary-hotel-rating'>
                        <StarRating rating={hotelRating} />
                    </div>
                )}
            </div>
            {shouldShowBtn && !!viewSummaryLabel && (
                <ShowMoreButton
                    className={styles.showMoreBtn}
                    title={viewSummaryLabel}
                    onClick={(): void => toggleShowDetails(true)}
                    dataTid='hotel-summary-view-info-cta'
                />
            )}
        </div>
    );
};

export default observer(HotelSummaryPreview);
