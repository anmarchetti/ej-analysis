import { FC, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { isGUIDWithoutDashes } from 'frontend/utils/string.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ItemsPerSlide } from 'models/data/ICustomerFeedback';
import { MediaSize } from 'models/data/MediaSizeParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';

import CustomersFeedbackCarousel from './components/CustomersFeedbackCarousel';
import StarRatingNew from './components/StarRatingNew';
import { useFeedbacksStore, withFeedbacksStore } from './store/createStore';

import styles from './CustomersFeedback.module.scss';

export interface ICustomersFeedbackFields {
    DefaultCustomerName: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    Disclaimer: ISitecoreField<string>;
    Link: ISitecoreField<ISitecoreLink>;
    Logo: ISitecoreField<ISitecoreImage>;
    SubTitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TCustomersFeedbackProps = ISitecoreComponent<ICustomersFeedbackFields>;

export const CustomersFeedback: FC<TCustomersFeedbackProps> = ({ fields }) => {
    const { Title, SubTitle, Description, Logo, Link, Disclaimer, DefaultCustomerName } = fields || {};
    const { ref, inView } = useInView({
        rootMargin: '-300px',
        triggerOnce: true,
    });

    const isMobile = useMobileViewport();

    const {
        isFeefoEnabled,
        fetchFeefoReviews,
        feedbackData,
        showReviews,
        showTitlesAndComments: showReviewsTitlesAndComments,
        reviewsCount,
        isError,
        maxRatingValue,
    } = useFeedbacksStore();

    const { isScreenLessMedium, trackCustomerFeedback } = useStore((stores: IHolidaysStores) => ({
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        trackCustomerFeedback: stores.trackingStore.trackCustomerFeedback,
    }));

    const trackCTALinkClick = (): void => {
        trackCustomerFeedback(Title?.value, Link);
    };

    const reviewsToFetch = Math.max(reviewsCount?.desktop, reviewsCount?.mobile);

    useEffect(() => {
        if (!isFeefoEnabled) {
            return;
        }

        const getReviews = async (): Promise<void> => {
            try {
                await fetchFeefoReviews(reviewsToFetch);
            } catch (e) {}
        };

        getReviews();
    }, [fetchFeefoReviews, isFeefoEnabled, reviewsToFetch]);

    useEffect(() => {
        inView && trackCustomerFeedback(Title?.value);
    }, [inView, Title?.value, trackCustomerFeedback]);

    if (!fields || !isFeefoEnabled || isError || !feedbackData?.reviews?.length) {
        return null;
    }

    const reviews = feedbackData?.reviews
        .slice(0, isScreenLessMedium ? reviewsCount?.mobile : reviewsCount?.desktop)
        .map(review => ({
            ...review,
            ...{
                customerName:
                    review.customerName && !isGUIDWithoutDashes(review.customerName)
                        ? review.customerName
                        : DefaultCustomerName?.value,
            },
        }));

    const description = {
        value: Tokenizer.replaceTokens(Description?.value, {
            [Tokens.FeefoTotalReviewsCount]: `${feedbackData.count}`,
        }),
    };
    const logoSize = isMobile ? { width: 95, height: 22 } : { width: 125, height: 29 };

    return (
        <div className={styles.container} ref={ref} data-tid='customers-feedback-container'>
            {Title && <Text field={Title} tag='h3' className={styles.title} data-tid='customers-feedback-title' />}
            <div className={styles.rating} data-tid='customers-feedback-rating'>
                <div className={styles.subtitle} data-tid='customers-feedback-subtitle'>
                    <Text field={SubTitle} />
                </div>
                <div className={styles['rating-content']}>
                    <span className={styles['rating-average']} data-tid='customers-feedback-average-rating'>
                        {feedbackData.averageRating} / {maxRatingValue}
                    </span>
                    <div className={styles.stars}>
                        <StarRatingNew rating={feedbackData.averageRating} />
                    </div>
                    <JSSImageNext
                        field={Logo}
                        className={styles.logo}
                        data-tid='customers-feedback-logo'
                        mediaSize={MediaSize.Small}
                        {...logoSize}
                    />
                </div>
                <div className={styles.description} data-tid='customers-feedback-rating-description'>
                    <RichTextWithLinks field={description} dataId='customers-feedback-rating-description-content' />
                </div>
            </div>
            {showReviews && reviews.length > 0 && (
                <CustomersFeedbackCarousel
                    items={reviews}
                    showTitlesAndComments={showReviewsTitlesAndComments}
                    itemsPerSlideDesktop={ItemsPerSlide.Desktop}
                    itemsPerSlideMobile={ItemsPerSlide.Mobile}
                />
            )}
            <div className={styles.footer} data-tid='customers-feedback-footer'>
                {Link?.value?.href && (
                    <RouterLink
                        link={Link}
                        className={`btn btn--md btn--outlined ${styles.footerLink}`}
                        dataId='customers-feedback-button-link'
                        onClick={trackCTALinkClick}
                    >
                        {Link.value.text}
                    </RouterLink>
                )}
                {Disclaimer?.value && (
                    <div className={styles.disclaimer} data-tid='customers-feedback-disclaimer'>
                        <Text field={Disclaimer} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default withFeedbacksStore(observer(CustomersFeedback));
