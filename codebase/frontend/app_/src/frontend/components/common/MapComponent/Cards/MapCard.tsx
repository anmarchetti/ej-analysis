import { FC, useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import LuxuryWrapper from 'frontend/components/common/LuxuryWrapper/LuxuryWrapper';
import { OfferCardSlider } from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import StarRating from 'frontend/components/common/StarRating';
import Clock from 'frontend/components/icons/Clock';
import SvgCross from 'frontend/components/icons-new/Cross';
import TripadvisorInfo from 'frontend/components/renderings/HotelDetails/components/TripadvisorInfo';

import useMapCard, { IUseMapCardProps, onWheel } from './MapCard.utils';
import MapCardSkeleton from './MapCardSkeleton';

import styles from './MapCard.module.scss';

const MapCard: FC<IUseMapCardProps> = props => {
    const { isLoading, onClose, isLuxury, content, button } = useMapCard(props);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    const map = useMap();
    const isXSMobile = useXSMobileViewport();

    /* On mobile:
     * - Prevent double-tap on the card from zooming the map, while still
     *   allowing double-tap on the map outside the card to zoom normally.
     *   (On desktop, the onDoubleClick stopPropagation on the wrapper div handles this instead.)
     * - Prevent map dragging when swiping on the image slider, so swipes
     *   navigate the slider rather than panning the map.
     */
    useEffect(() => {
        if (!map || !isXSMobile || isLoading || !wrapperRef.current || !sliderRef.current) return;

        const mapDiv = map.getDiv();
        const cardEl = wrapperRef.current;
        const sliderEl = sliderRef.current;

        const disableDoubleClickZoom = (): void => map.setOptions({ disableDoubleClickZoom: true });
        const enableDoubleClickZoom = (): void => map.setOptions({ disableDoubleClickZoom: false });
        const disableDragging = (): void => map.setOptions({ draggable: false });
        const enableDragging = (): void => map.setOptions({ draggable: true });

        const onTouchStart = (e: TouchEvent): void => {
            // If the touchstart event originated from the card element, disable map zoom.
            if (cardEl.contains(e.target as Node)) {
                disableDoubleClickZoom();
            } else {
                enableDoubleClickZoom();
            }
        };

        mapDiv.addEventListener('touchstart', onTouchStart, { passive: true });
        mapDiv.addEventListener('touchend', enableDragging, { passive: true });
        mapDiv.addEventListener('touchcancel', enableDragging, { passive: true });
        // When interacting with the slider, disable map dragging to allow swipe gestures to work.
        sliderEl.addEventListener('touchstart', disableDragging, { passive: true });

        return (): void => {
            mapDiv.removeEventListener('touchstart', onTouchStart);
            mapDiv.removeEventListener('touchend', enableDragging);
            mapDiv.removeEventListener('touchcancel', enableDragging);
            sliderEl.removeEventListener('touchstart', disableDragging);
            enableDoubleClickZoom();
            enableDragging();
        };
    }, [map, isXSMobile, isLoading]);

    if (isLoading) {
        return <MapCardSkeleton onClose={onClose} />;
    }

    const { name, rating, starRating, numberOfReviews, description, duration, list, hidden, images, fallbackImage } =
        content;

    return (
        <LuxuryWrapper
            wrapperClassName={styles.luxuryWrapper}
            bannerClassName={classNames(styles.luxuryBanner, styles.priority)}
            renderChildrenOnly={!isLuxury}
        >
            {/* eslint-disable jsx-a11y/no-static-element-interactions */}
            <div
                ref={wrapperRef}
                className={styles.wrapper}
                // Prevent map zoom on double click within the card (desktop)
                onDoubleClick={(e): void => e.stopPropagation()}
            >
                {/* eslint-enable jsx-a11y/no-static-element-interactions */}
                <div className={styles.head}>
                    <p className={styles.name} data-tid='map-card-name'>
                        {name}
                    </p>

                    <div className={styles.rating}>
                        {!!rating && <TripadvisorInfo rating={rating} reviews={numberOfReviews} hasIcon />}

                        {!!starRating && <StarRating rating={starRating} />}
                    </div>

                    <button onClick={onClose}>
                        <SvgCross />
                    </button>
                </div>

                <div className={styles.content}>
                    <div ref={sliderRef}>
                        <OfferCardSlider
                            images={images}
                            showIndex={false}
                            fallbackImage={fallbackImage ?? ''}
                            className={styles.imageSlider}
                            carouselWrapperClassName={styles.carouselWrapper}
                        />
                    </div>

                    {list && (
                        <div className={styles.options}>
                            <ul className={classNames(styles.list, { [styles.hidden]: hidden })}>
                                {list.map(i => (
                                    <li
                                        key={i.key}
                                        className={classNames(styles.item, i.itemClassName)}
                                        data-tid={i.dataTid || 'map-card-item'}
                                    >
                                        {i.icon && typeof i.icon === 'string' ? (
                                            <img src={i.icon} alt={i.content as string} />
                                        ) : (
                                            i.icon
                                        )}
                                        <span className={i.contentClassName}>{i.content}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {description && !list && (
                        <div className={styles.text}>
                            <p className={styles.description} onWheel={onWheel} data-tid='map-card-description'>
                                {description}
                            </p>
                            <p className={styles.duration} data-tid='map-card-duration'>
                                <Clock />
                                <div className={styles.durationText} data-tid='map-card-duration-text'>
                                    {duration?.[0]} <b>{duration?.[1]}</b> {duration?.[2]}
                                </div>
                            </p>
                        </div>
                    )}

                    {button && (
                        <div className={styles.footer}>
                            <a
                                href={button.link}
                                onClick={button.onClick}
                                className={styles.btn}
                                data-tid='map-card-btn'
                            >
                                <span>{button.title}</span>
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </LuxuryWrapper>
    );
};

export default observer(MapCard);
