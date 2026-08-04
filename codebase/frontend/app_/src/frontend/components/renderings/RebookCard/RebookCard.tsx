import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import Link from 'next/link';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { ImageSize } from 'models/enum/ImageSize';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import HotelImage from 'frontend/components/common/HotelImage/HotelImage';

import styles from './RebookCard.module.scss';

export interface IRebookCardFields {
    ActionText: ISitecoreField<string>;
    CTAButtonLabel: ISitecoreField<string>;
    RebookButtonLabel: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TRebookCardProps = ISitecoreComponent<IRebookCardFields>;

const RebookCard: FC<TRebookCardProps> = ({ fields }) => {
    const { booking, getSetting, hotelDetailsBrowseUrl, buildRebookHotelQuery } = useStore(stores => ({
        booking: stores.viewBookingStore.booking,
        getSetting: stores.layoutStore.getSetting,
        hotelDetailsBrowseUrl: stores.routerStore.hotelDetailsBrowseUrl,
        buildRebookHotelQuery: stores.queryParamStore.buildRebookHotelQuery,
    }));

    if (!fields || !booking) {
        return null;
    }

    const { Title, Subtitle, ActionText, RebookButtonLabel } = fields;
    const hotelFallbackImage = getSetting(SiteSettings.HotelFallbackImage);
    const fallbackImage = cmsUrls.media(hotelFallbackImage);

    const { hotel } = booking;
    const hotelImages = hotel?.images ?? booking.package?.accom?.hotel?.images;

    const imageStyleMap: Record<number, string[]> = {
        1: [styles.photo3],
        2: [styles.photo2, styles.photo3],
        3: [styles.photo1, styles.photo2, styles.photo3],
        4: [styles.photo1, styles.photo2, styles.photo3, styles.photo4],
    };
    const imageCount = hotelImages?.length ?? 0;
    const stylesArray = imageStyleMap[Math.min(imageCount, 4)] || [];
    const imagesToRender = stylesArray.map((style, idx) => ({
        image: hotelImages[idx],
        style,
    }));

    return (
        <div className={styles.rebookContainer} data-tid='rebook-container'>
            <div className={styles.textContent}>
                <Text field={Title} className={styles.title} tag='h3' data-tid='rebook-title' />
                <Text field={Subtitle} className={styles.text} tag='p' data-tid='rebook-subtitle' />
                <Text field={ActionText} className={styles.text} tag='p' data-tid='rebook-action-text' />

                <Link
                    className={classNames(styles.borderedBtn, styles.orangeBtn)}
                    href={hotelDetailsBrowseUrl(booking.hotel, buildRebookHotelQuery(booking))}
                    data-tid='rebook-button'
                >
                    {RebookButtonLabel.value}
                </Link>
            </div>

            <div className={styles.imageContent}>
                {imagesToRender.map((item, index) => (
                    <HotelImage
                        data-tid={`rebook-image-${index}`}
                        key={item.image.id || index}
                        image={item.image}
                        defaultSize={ImageSize.Medium}
                        fallbackImage={fallbackImage}
                        className={classNames(styles.photoStyle, item.style)}
                    />
                ))}
            </div>
        </div>
    );
};

export default observer(RebookCard);
