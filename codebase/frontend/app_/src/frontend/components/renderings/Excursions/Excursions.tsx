import React, { FC, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { RichText, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import excursionsService from 'frontend/services/excursions.service';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IExcursion } from 'models/data/IExcursions';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import JSSImage from 'frontend/components/common/JSSImage';

import ExcursionCarousel from './components/ExcursionCarousel/ExcursionCarousel';
import { getExcursionLinkAndExcursionsWithUtmTagging, getViewBookingStatusPageData } from './Excursions.utils';

import styles from './Excursions.module.scss';

export interface IExcursionsFields {
    Description: ISitecoreField<string>;
    FreeCancellation: ISitecoreField<string>;
    LikelyToSellOut: ISitecoreField<string>;
    Logo: ISitecoreField<ISitecoreImage>;
    PoweredBy: ISitecoreField<string>;
    SeeMoreDesktop: ISitecoreField<string>;
    SeeMoreMobile: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export interface IExcursionsParams {
    isLeftAligned: boolean;
    isPrimaryCTA: boolean;
}

export interface IExcursionsProps extends ISitecoreComponent<IExcursionsFields, IExcursionsParams> {
    endDate?: string;
    location?: string;
    startDate?: string;
}

const Excursions: FC<IExcursionsProps> = ({ fields, location, startDate, endDate, params }) => {
    const [excursions, setExcursions] = useState<IExcursion[]>([]);
    const [linkToExcursions, setLinkToExcursions] = useState<string>('');

    const {
        isExcursionsEnabled,
        destinationCode,
        trackEventWithParams,
        isCountryBrowsePage,
        isRegionBrowsePage,
        isResortBrowsePage,
        isRegionCityBrowsePage,
        isConfirmationPage,
        isViewBookingPage,
        destinationParents,
        layoutName,
        confirmationBooking,
        viewBooking,
        trackExcursionsAction,
        destinationsPageCountry,
        siteLang,
        websiteMarketCode,
    } = useStore(stores => ({
        isExcursionsEnabled: stores.layoutStore.isExcursionsEnabled,
        destinationCode: stores.layoutStore.destinationCode,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        isCountryBrowsePage: stores.layoutStore.isCountryBrowsePage,
        isRegionBrowsePage: stores.layoutStore.isRegionBrowsePage,
        isResortBrowsePage: stores.layoutStore.isResortBrowsePage,
        isRegionCityBrowsePage: stores.layoutStore.isRegionCityBrowsePage,
        isConfirmationPage: stores.layoutStore.isConfirmationPage,
        isViewBookingPage: stores.layoutStore.isViewBookingPage,
        destinationParents: stores.layoutStore.destinationParents,
        layoutName: stores.layoutStore.layoutName,
        confirmationBooking: stores.bookingStore?.booking,
        viewBooking: stores.viewBookingStore?.booking,
        trackExcursionsAction: stores.trackingStore.trackExcursionsAction,
        destinationsPageCountry: stores.layoutStore.displayName,
        siteLang: stores.layoutStore.lang,
        websiteMarketCode: stores.marketStore.marketCode,
    }));

    const isMobile = useMobileViewport();

    const booking = isConfirmationPage ? confirmationBooking : isViewBookingPage ? viewBooking : null;
    const country = booking?.hotel?.country?.name || destinationsPageCountry;

    const { ref, inView } = useInView({
        triggerOnce: true,
    });

    useEffect(() => {
        const hasNoExcursionsLocationInfo = !destinationCode && !location && !viewBooking;

        if (!isExcursionsEnabled || hasNoExcursionsLocationInfo) {
            return;
        }

        let componentMounted = true;

        const getExcursions = async (): Promise<void> => {
            try {
                const isDestinationPage =
                    isCountryBrowsePage || isRegionBrowsePage || isResortBrowsePage || isRegionCityBrowsePage;

                const {
                    isViewBookingStatusPage,
                    viewBookingStatusPageBookingStartDate,
                    viewBookingStatusPageBookingEndDate,
                    viewBookingStatusPageLocation,
                } = getViewBookingStatusPageData(booking, isDestinationPage, isConfirmationPage, !!location);

                const locationFromStore = isViewBookingStatusPage ? viewBookingStatusPageLocation : destinationCode;

                const excursionLocation = locationFromStore || location || '';

                const result = await excursionsService.getExcursionsForDestination(
                    excursionLocation,
                    booking?.marketCode || websiteMarketCode,
                    startDate || viewBookingStatusPageBookingStartDate,
                    endDate || viewBookingStatusPageBookingEndDate,
                );

                if (componentMounted) {
                    const { excursionsLink, excursions } = getExcursionLinkAndExcursionsWithUtmTagging(
                        result,
                        isDestinationPage,
                        isConfirmationPage,
                        isViewBookingPage,
                        confirmationBooking,
                        viewBooking,
                        siteLang,
                        destinationParents,
                        layoutName,
                    );

                    setLinkToExcursions(excursionsLink);
                    setExcursions(excursions);
                    trackExcursionsComponent(excursions, inView);
                }
            } catch (e) {
                setExcursions([]);
                setLinkToExcursions('');
            }
        };

        getExcursions();

        return () => {
            componentMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destinationCode]);

    useEffect(() => {
        if (inView) {
            trackExcursionsComponent(excursions, inView);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inView]);

    const trackExcursion = (item: IExcursion): void => {
        trackExcursionsAction(
            excursions,
            {
                eventAction: EventActions.Carousel,
                eventLabel: item.title,
            },
            {
                genericValue1: `${excursions.length}`,
                genericValue2: country,
                genericValue3: `${item.retailPrice?.value}`,
                genericValue4: `${item.freeCancellation ? 'YES' : 'NO'}|NO|${excursions.indexOf(item) + 1}`,
            },
        );
    };

    const trackExcursionsComponent = (items: IExcursion[], inView: boolean): void => {
        trackExcursionsAction(items, {
            eventAction: inView ? EventActions.ExcursionsViewed : EventActions.ExcursionsLoaded,
            eventLabel: `${items?.length}`,
        });
    };

    if (!isExcursionsEnabled || !fields || !excursions.length) {
        return null;
    }

    const btnLabel = !isMobile ? fields.SeeMoreDesktop?.value : fields.SeeMoreMobile?.value;
    const titleText = {
        value: Tokenizer.replaceToken(fields.Title?.value, Tokens.DestinationName, country),
    };
    const descriptionText = { value: Tokenizer.replaceToken(fields.Description?.value, Tokens.Country, country) };

    const onCTAClick = (): void => {
        trackEventWithParams(
            EventTypes.ViewAllExcursions,
            {
                name: btnLabel,
                destination: linkToExcursions,
            },
            undefined,
            true,
        );
        window.open(linkToExcursions);
    };

    const { isLeftAligned } = params;

    const showSeeMoreButtonOnTop = isLeftAligned && !isMobile;

    //Diff design on destination guide and post booking pages, leave "excursions" class to have way override class in MasonryWrapper
    return (
        <div ref={ref} className={classNames('excursions', styles.excursions, isLeftAligned && styles.leftAligned)}>
            <div className={styles.primaryCTAContainer}>
                <div className={styles.titleContainer}>
                    <Text tag='h2' className={styles.excursionsTitle} field={titleText} data-tid='excursions-title' />

                    <RichText
                        field={descriptionText}
                        tag='h3'
                        className={styles.excursionsDescription}
                        data-tid='excursions-description'
                    />
                </div>
                {showSeeMoreButtonOnTop && (
                    <Button
                        role='link'
                        isLarge
                        isOutlined
                        className={styles.ctaBtn}
                        data-tid='excursions-btn-see-more'
                        onClick={onCTAClick}
                    >
                        {btnLabel}
                    </Button>
                )}
            </div>

            <ExcursionCarousel
                fields={fields}
                params={params}
                excursions={excursions}
                trackExcursion={trackExcursion}
            />

            {!showSeeMoreButtonOnTop && (
                <Button
                    role='link'
                    isLarge
                    isOutlined
                    className={styles.ctaBtn}
                    data-tid='excursions-btn-see-more'
                    onClick={onCTAClick}
                >
                    {btnLabel}
                </Button>
            )}

            {fields.PoweredBy && fields.Logo && (
                <div className={styles.logo}>
                    <Text
                        field={fields.PoweredBy}
                        tag='p'
                        className={styles.logoText}
                        data-tid='excursions-logo-text'
                    />
                    <JSSImage field={fields.Logo} src={fields.Logo.value.src} data-tid='excursions-logo-image' />
                </div>
            )}
        </div>
    );
};

export default observer(Excursions);
