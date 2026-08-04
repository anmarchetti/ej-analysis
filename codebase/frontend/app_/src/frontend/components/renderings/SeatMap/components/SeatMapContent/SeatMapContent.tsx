import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import styles from './SeatMapContent.module.scss';

export interface ISeatMapHeadContentFields {
    SeatsMapTitle: ISitecoreField<string>;
    SeatsMapTitleLuxury: ISitecoreField<string>;
    SeatsMapTitleMobile: ISitecoreField<string>;
    SeatsSubtitle: ISitecoreField<string>;
    SeatsSubtitleLuxury: ISitecoreField<string>;
}

const SeatMapContent: FC<ISeatMapHeadContentFields> = ({
    SeatsMapTitle,
    SeatsMapTitleLuxury,
    SeatsMapTitleMobile,
    SeatsSubtitle,
    SeatsSubtitleLuxury,
}) => {
    const { isScreenLarge, isLuxuryPackage } = useStore((stores: TStores) => ({
        isScreenLarge: stores.appStore.isScreenLarge,
        isLuxuryPackage: stores.bookingStore.isLuxuryPackage || stores.viewBookingStore.isLuxuryPackage,
    }));

    const getContent = (): { Subtitle: ISitecoreField<string>; Title: ISitecoreField<string> } => {
        if (isLuxuryPackage) {
            return {
                Title: SeatsMapTitleLuxury,
                Subtitle: SeatsSubtitleLuxury,
            };
        }

        return {
            Title: isScreenLarge ? SeatsMapTitle : SeatsMapTitleMobile,
            Subtitle: SeatsSubtitle,
        };
    };

    const { Title, Subtitle } = getContent();

    return (
        <div data-tid='seat-map-content'>
            <div className={styles.headingGroup}>
                <Text className={styles.title} field={Title} tag='h2' />
                <Text className={classNames(styles.subtitle, 'd-none d-lg-block')} field={Subtitle} tag='div' />
            </div>
            <div className={styles.fullWidthContent}>
                <div id='seat-map' data-tid='seat-map' />
            </div>
        </div>
    );
};

export default SeatMapContent;
