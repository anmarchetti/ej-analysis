import { FunctionComponent, useEffect, useRef, useState } from 'react';
import { EventData, Swipeable } from 'react-swipeable';
import { Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useClickOutside from 'frontend/hooks/useClickOutside';
import { useMobileViewport, useTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Callout, { ICalloutProps } from 'frontend/components/common/Callout/Callout';
import HeightAnimatedContainer from 'frontend/components/common/HeightAnimatedContainer/HeightAnimatedContainer';
import Link from 'frontend/components/common/Link';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import StickyBox from 'frontend/components/common/StickyBox';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';
import SvgChevronUp from 'frontend/components/icons-new/ChevronUp';

import styles from './MobileBasket.module.scss';

export enum SwipeDirection {
    Down = 'Down',
    Up = 'Up',
}

interface IMobileBasketFields {
    Continue: ISitecoreField<string>;
    CurrentDetails: ISitecoreField<string>;
    GoBack: ISitecoreField<string>;
    HideDetails: ISitecoreField<string>;
    HotelDetails: ISitecoreField<string>;
    NewDetails: ISitecoreField<string>;
    SeeDetails: ISitecoreField<string>;
}

export interface IMobileBasketProps extends ISitecoreComponent<IMobileBasketFields> {
    handleSubmit: (e: React.MouseEvent) => void;
    hasOptionSelected: boolean;
    applyNegativeMargin?: boolean;
    backLink?: string;
    calloutProps?: ICalloutProps;
    children?: React.ReactNode;
    continueLabel?: string;
    isHotelDetailsIncluded?: boolean;
    isOnlyBackButton?: boolean;
    isStaticFooterIncluded?: boolean;
    price?: number;
    showPrice?: boolean;
}

const MIN_SWIPE_DISTANCE = 50;

const MobileBasket: FunctionComponent<IMobileBasketProps> = ({
    fields,
    handleSubmit,
    hasOptionSelected,
    applyNegativeMargin,
    price,
    showPrice = true,
    backLink = SitePath.ViewBooking,
    children,
    continueLabel = fields?.Continue?.value,
    calloutProps,
    isHotelDetailsIncluded = false,
    isOnlyBackButton,
    rendering,
    isStaticFooterIncluded = true,
}) => {
    const { currency, formatMoney } = useStore((stores: IHolidaysStores) => ({
        currency: stores.viewBookingStore.booking?.currency?.code,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const drawerRef = useRef(null);

    const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
    const [translateY, setTranslateY] = useState(0);
    const isTablet = useTabletViewport();
    const isMobile = useMobileViewport();

    useClickOutside(drawerRef, () => setIsDetailsDrawerOpen(false));

    useEffect(() => {
        const tabletOrDesktopPadding = isTablet ? '72px' : '';
        const padding = isMobile ? '100px' : tabletOrDesktopPadding;

        document.body.style.paddingBottom = padding;

        return () => {
            document.body.style.paddingBottom = '';
        };
    }, [isTablet, isMobile]);

    useEffect(() => {
        const body = document.body;

        if (isDetailsDrawerOpen) {
            body.style.overflow = 'hidden';
        }

        return () => {
            body.style.overflow = '';
        };
    }, [isDetailsDrawerOpen]);

    if (!fields) {
        return null;
    }

    const formattedPrice = formatMoney(price!, {
        currency,
    });

    const closeDrawerBySwipe = (eventData: EventData): void => {
        if (Math.abs(eventData.deltaY) <= MIN_SWIPE_DISTANCE || eventData.dir === SwipeDirection.Up) {
            setTranslateY(0);

            return;
        }

        setIsDetailsDrawerOpen(false);
        setTranslateY(0);
    };

    const onSwipingDrawer = (eventData: EventData): void => {
        const { absY, deltaY, event } = eventData;

        event.preventDefault();
        event.stopPropagation();

        setTranslateY(deltaY < 0 ? absY : 0);
    };

    const headerTitle = (): ISitecoreField<string> => {
        if (isHotelDetailsIncluded) {
            return fields.HotelDetails;
        }

        return !hasOptionSelected ? fields.CurrentDetails : fields.NewDetails;
    };

    const isShowPriceLabel = hasOptionSelected && showPrice;

    return (
        <>
            {isDetailsDrawerOpen && <div className={styles.greyOverlay} />}
            <StickyBox
                render={(): React.ReactElement => (
                    <div
                        className={classNames(styles.stickyFooter, {
                            [styles.negativeMargin]: applyNegativeMargin,
                        })}
                        data-tid='mobile-basket'
                    >
                        <div ref={drawerRef} className={styles.drawer}>
                            <HeightAnimatedContainer isOpened={isDetailsDrawerOpen} exit={translateY === 0}>
                                <div
                                    className={styles.detailsSection}
                                    data-tid='basket-details-drawer'
                                    style={{ transform: `translateY(${translateY}px)` }}
                                >
                                    <Swipeable
                                        className={styles.swipeZone}
                                        onSwiped={closeDrawerBySwipe}
                                        onSwiping={onSwipingDrawer}
                                        trackTouch
                                    >
                                        <div className={styles.swipeIndicator} data-tid='swipe-indicator' />
                                        <Text tag='h4' dataTid='details-title' field={headerTitle()} />
                                    </Swipeable>
                                    <div className={styles.detailsContent} data-tid='details-content'>
                                        {children}
                                    </div>
                                </div>
                            </HeightAnimatedContainer>
                            <div className={styles.seeDetails}>
                                <Button
                                    className={styles.detailsButton}
                                    isText
                                    onClick={(): void => {
                                        setIsDetailsDrawerOpen(!isDetailsDrawerOpen);
                                    }}
                                    dataTid='show-details-toggle'
                                >
                                    {isDetailsDrawerOpen ? (
                                        <>
                                            <SvgChevronDown />
                                            {fields.HideDetails?.value}
                                        </>
                                    ) : (
                                        <>
                                            <SvgChevronUp />
                                            {fields.SeeDetails?.value}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                        {isStaticFooterIncluded && (
                            <div
                                className={classNames(styles.staticFooter, {
                                    [styles.withOnlyBackButton]: isOnlyBackButton,
                                    [styles.withPriceLabel]: isShowPriceLabel,
                                })}
                                data-tid='basket-static-footer'
                            >
                                {isShowPriceLabel && (
                                    <div className={styles.priceBackground}>
                                        <PriceLabel
                                            tag='div'
                                            className={styles.priceLabel}
                                            price={
                                                <span className={styles.price} data-tid='mobile-basket-price'>
                                                    {formattedPrice} {calloutProps && <Callout {...calloutProps} />}
                                                </span>
                                            }
                                            priceDictionary={SitecoreDictionary.GlobalsPriceLabelsTotal}
                                            dataTid='basket-price'
                                        />
                                        <Placeholder name={PlaceholderNames.ChangeFeeInfo} rendering={rendering} />
                                    </div>
                                )}
                                {!isShowPriceLabel && (
                                    <div className={styles.backLink} data-tid='mobile-basket-back-link'>
                                        <Link href={backLink} data-tid='basket-back-link'>
                                            {fields.GoBack?.value}
                                        </Link>
                                    </div>
                                )}

                                {!isOnlyBackButton && (
                                    <Button
                                        disabled={!hasOptionSelected}
                                        className={styles.continueButton}
                                        onClick={handleSubmit}
                                        dataTid='basket-continue-button'
                                    >
                                        {continueLabel}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            />
        </>
    );
};

export default MobileBasket;
