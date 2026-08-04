import React, { FC, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { convertToYesNoString } from 'frontend/utils/string.utils';
import { IExcursion } from 'models/data/IExcursions';
import { IExcursionsEventParams } from 'models/data/tracking/IEventWithParams';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import StarRating from 'frontend/components/common/StarRating';
import SvgPromo from 'frontend/components/icons-new/Promo';
import { IExcursionsFields, IExcursionsParams } from 'frontend/components/renderings/Excursions/Excursions';

import styles from './ExcursionItem.module.scss';

export interface IExcursionItemProps {
    descriptionMaxLines: number;
    fields: IExcursionsFields;
    index: number;
    item: IExcursion;
    params: IExcursionsParams;
    className?: string;
    isHorizontalView?: boolean;
    trackExcursion?: (item: IExcursion) => void;
}

const ExcursionItem: FC<IExcursionItemProps> = ({
    fields,
    item,
    index,
    descriptionMaxLines,
    trackExcursion,
    isHorizontalView,
    className,
    params: { isPrimaryCTA },
}) => {
    const { getPhrase, trackEventWithParams, formatMoney } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const { ref, inView } = useInView({ triggerOnce: true });

    const onClick = () => {
        const params = {
            name: getPhrase(SitecoreDictionary.GlobalsButtonsBookNow),
            destination: item.url,
            position: index + 1,
            section: item.title,
            price: item.retailPrice.value,
            MoreInfoDisplayed: convertToYesNoString(false),
            FreeCancellationDisplayed: convertToYesNoString(item.freeCancellation),
        } as IExcursionsEventParams;

        if (item.likelyToSellOut) {
            params.OverlayMessage = fields.LikelyToSellOut?.value;
        }

        trackEventWithParams(EventTypes.ExcursionClick, params, undefined, true);
    };

    useEffect(() => {
        if (inView && trackExcursion) trackExcursion(item);
    }, [inView]);

    return (
        <div
            className={classNames(styles.excursion, className, {
                [styles.horizontal]: isHorizontalView,
            })}
            ref={ref}
        >
            {item.likelyToSellOut && (
                <span className={styles.badge} data-tid='excursion-item-badge'>
                    <SvgPromo />
                    <Text field={fields.LikelyToSellOut} />
                </span>
            )}
            <div
                className={classNames({ [styles.image]: true, [styles.horizontal]: isHorizontalView })}
                data-tid='excursion-item-image'
            >
                <img src={item.coverImageUrl} alt={item.title} loading='lazy' data-tid='excursion-image' />
                <a
                    target='_blank'
                    href={item.url}
                    onClick={onClick}
                    className={styles.imageLink}
                    data-tid='excursion-item-image-link'
                    rel='noreferrer'
                >
                    <span className='visually-hidden'>{item.title}</span>
                </a>
            </div>

            <div className={classNames({ [styles.content]: true, [styles.horizontal]: isHorizontalView })}>
                <div>
                    <h3 className={styles.title} data-tid='excursion-item-title'>
                        <a
                            target='_blank'
                            href={item.url}
                            onClick={onClick}
                            className={styles.titleLink}
                            data-tid='excursion-item-title-link'
                            rel='noreferrer'
                        >
                            {item.title}
                        </a>
                    </h3>
                    <div className={styles.reviewsContainer}>
                        <StarRating rating={Math.floor(item.reviewsAvg)} className={styles.starRating} />
                        {!!item.reviewsNumber && (
                            <span className={styles.reviews} data-tid='excursion-item-review-text'>
                                {item.reviewsNumber +
                                    ' ' +
                                    getPhrase(
                                        item.reviewsNumber !== 1
                                            ? SitecoreDictionary.HotelReviewsLabelsReviewItemPlural
                                            : SitecoreDictionary.HotelReviewsLabelsReviewItemSingular,
                                    )}
                            </span>
                        )}
                    </div>
                    <p
                        className={styles.description}
                        style={{ WebkitLineClamp: descriptionMaxLines }}
                        data-tid='excursion-item-description'
                    >
                        {item.description}
                    </p>
                    {item.freeCancellation && (
                        <Text
                            field={fields.FreeCancellation}
                            tag='p'
                            className={styles.freeCancellation}
                            data-tid='excursion-item-free-cancellation'
                        />
                    )}
                </div>
                <div className={styles.buttonContainer}>
                    <div className={styles.bottomContent}>
                        <PriceLabel
                            className={styles.priceBlock}
                            dataTid='excursion-item-price-block'
                            tag='span'
                            price={
                                <span className={styles.price}>
                                    {formatMoney(item.retailPrice.value, {
                                        currency: item.retailPrice.currency,
                                        maximumFractionDigits: 0,
                                    })}
                                </span>
                            }
                            priceDictionary={SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom}
                        />
                    </div>
                    <a
                        className={classNames('btn btn--full-width', !isPrimaryCTA && 'btn--outlined')}
                        target='_blank'
                        href={item.url}
                        onClick={onClick}
                        data-tid='excursion-item-link'
                        rel='noreferrer'
                    >
                        {getPhrase(SitecoreDictionary.GlobalsButtonsBookNow)}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ExcursionItem;
