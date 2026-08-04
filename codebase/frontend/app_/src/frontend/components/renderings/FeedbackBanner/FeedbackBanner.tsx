import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgTripAdvisor from 'frontend/components/icons-new/TripAdvisor';

import styles from './FeedbackBanner.module.scss';

export interface IFeedbackBannerFields {
    CTAButtonLabel: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TFeedbackBannerProps = ISitecoreComponent<IFeedbackBannerFields>;

const FeedbackBanner: FC<TFeedbackBannerProps> = ({ fields }) => {
    const { booking, tripadvisorHotelUrl } = useStore(stores => ({
        booking: stores.viewBookingStore.booking,
        tripadvisorHotelUrl: stores.hotelReviewsStore.data.webUrl,
    }));

    if (!fields || !booking) {
        return null;
    }

    const { Title, Subtitle, CTAButtonLabel } = fields;

    return (
        <div className={styles.sizeContainer} data-tid='feedback-banner'>
            <div className={styles.container}>
                <div className={styles.contentContainer}>
                    <SvgTripAdvisor className={styles.icon} />
                    <div className={styles.content}>
                        <Text field={Title} className={styles.title} tag='h3' data-tid='feedback-banner-title' />
                        <RichTextWithLinks
                            className={styles.description}
                            field={Subtitle}
                            dataId='feedback-banner-description'
                        />
                    </div>
                </div>
                {!!CTAButtonLabel?.value && (
                    <a
                        href={tripadvisorHotelUrl || '#'}
                        className={classNames('btn', 'btn--outlined', styles.button)}
                        target='_blank'
                        rel='noopener noreferrer'
                        data-tid='feedback-banner-leave-review-link'
                    >
                        {CTAButtonLabel.value}
                    </a>
                )}
            </div>
        </div>
    );
};

export default observer(FeedbackBanner);
