import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays/create-stores';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';

import styles from './InspireMeBanner.module.scss';

interface IInspireMeBannerFields {
    Description: ISitecoreField<string>;
    Image: ISitecoreField<ISitecoreImage>;
    Link: ISitecoreField<ISitecoreLink>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TInspireMeBannerProps = ISitecoreComponent<IInspireMeBannerFields>;

const InspireMeBanner: FC<TInspireMeBannerProps> = ({ fields }) => {
    const { booking, isCancelledBookingPage } = useStore((stores: IHolidaysStores) => ({
        booking: stores.viewBookingStore.booking,
        isCancelledBookingPage: stores.viewBookingStore.isCancelledBookingPage,
    }));

    if (!fields || (isCancelledBookingPage && booking?.isExternalAgency)) {
        return null;
    }

    const { Description, Image, Link, Subtitle, Title } = fields;

    return (
        <div className={styles.banner} data-tid='inspire-me-banner'>
            <div className={styles.infoContainer}>
                <Text className={styles.subtitle} field={Subtitle} tag='h3' data-tid='inspire-me-banner-subtitle' />
                <Text className={styles.title} field={Title} tag='h2' data-tid='inspire-me-banner-title' />

                <RichTextWithLinks
                    field={Description}
                    className={styles.description}
                    dataId='inspire-me-banner-description'
                />

                {!!Link?.value?.text && (
                    <RouterLink link={Link} className={classNames('btn', styles.link)} dataId='inspire-me-banner-link'>
                        {Link.value.text}
                    </RouterLink>
                )}
            </div>
            <div className={styles.imageContainer}>
                <JSSImageNext field={Image} fill />
            </div>
        </div>
    );
};

export default InspireMeBanner;
