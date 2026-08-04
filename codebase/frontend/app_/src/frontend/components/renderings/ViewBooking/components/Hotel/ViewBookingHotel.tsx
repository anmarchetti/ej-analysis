import { FC, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { ComponentRendering, Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { useBoard, useDatesLabel, useGuests, useNightsLabel } from 'frontend/hooks/viewBooking.hooks';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import {
    getAdultsCountPhrase,
    getChildrenCountPhrase,
    getInfantsCountPhrase,
} from 'frontend/utils/search/search.utils';
import { ViewBookingTrackingEvents } from 'frontend/utils/tracking/viewBooking.utils';
import { scrollToElement } from 'frontend/utils/ui.utils';
import { IPreBookingInfo } from 'models/data/IBookingInfo';
import { FacilitiesDesignVariant } from 'models/enum/FacilitiesDesignVariant';
import { GuestType } from 'models/enum/GuestType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories, GENERIC_CUSTOM_PARAMS_EMPTY } from 'models/enum/tracking/GenericEventParams';
import HeaderTextWithIcon from 'frontend/components/common/HeaderTextWIthIcon/HeaderTextWithIcon';
import HotelRating from 'frontend/components/common/Hotel/HotelRating/HotelRating';
import usePackageIcons from 'frontend/components/common/PackageIcons/PackageIcons.utils';
import SvgAdults from 'frontend/components/icons-new/Adults';
import SvgCalendarLined from 'frontend/components/icons-new/CalendarLined';
import SvgHotelLargeLined from 'frontend/components/icons-new/HotelLargeLined';
import SvgLocationPinFilled from 'frontend/components/icons-new/LocationPinFilled';
import BoardTypeIcon from 'frontend/components/renderings/BoardTypes/components/BoardTypeIcon/BoardTypeIcon';
import { RenderedHotelLocationLinks } from 'frontend/components/renderings/HotelDetails/components/HotelLocation';
import Facilities from 'frontend/components/renderings/HotelDetails/HotelFacilities/components/Facilities';

import { getHotelMeta } from './ViewBookingHotel.utils';
import ViewBookingHotelGallery from './ViewBookingHotelGallery';
import ViewBookingPassengers from './ViewBookingPassengers';

import styles from './ViewBookingHotel.module.scss';

interface IBookingHotelProps {
    booking: IPreBookingInfo;
    rendering: ComponentRendering;
    fallbackImage?: string;
    isPrintPreview?: boolean;
}

export const ViewBookingHotel: FC<IBookingHotelProps> = ({ booking, fallbackImage, isPrintPreview, rendering }) => {
    const {
        getPhrase,
        filterFacilitiesByDesignVariant,
        trackEventWithParams,
        isTradePortal,
        fireViewBookingEvent,
        isFlightAndHotelPackage,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        filterFacilitiesByDesignVariant: stores.layoutStore.filterFacilitiesByDesignVariant,
        isTradePortal: stores.layoutStore.isTradePortal,
        fireViewBookingEvent: isHolidayStore(stores) ? stores.trackingStore.fireViewBookingEvent : null,
        isFlightAndHotelPackage:
            isHolidayStore(stores) &&
            (stores.viewBookingStore.isFlightAndHotelPackage || stores.bookingStore.isFlightAndHotelPackage),
    }));

    const [isBlockTracked, setTracked] = useState(false);
    const { ref, inView } = useInView({
        triggerOnce: true,
    });
    const isMobile = useMobileViewport();

    useEffect(() => {
        if (inView) {
            trackEvent(false);
        }
    }, [inView]);

    const { hotelName, hotelLocationLinks, hotelImages, accom } = getHotelMeta(booking);

    const { guests } = booking;

    const adultsCount = guests.filter(el => el.type === GuestType.Adult).length;
    const adultsCountLabel = adultsCount ? getAdultsCountPhrase(adultsCount, getPhrase) : '';

    const childrenCount = guests.filter(el => el.type === GuestType.Child).length;
    const childrenCountLabel = childrenCount ? getChildrenCountPhrase(childrenCount, getPhrase) : '';

    const infantsCount = guests.filter(el => el.type === GuestType.Infant).length;
    const infantsCountLabel = infantsCount ? getInfantsCountPhrase(infantsCount, getPhrase) : '';
    const isShowEcoFacilityPlaceholder = !!(booking.hotel?.ecoFacility?.name && booking.hotel?.ecoFacility?.tooltip);
    const facilities = filterFacilitiesByDesignVariant(
        booking.hotel?.facilities || accom?.hotel?.facilities || [],
        FacilitiesDesignVariant.Tabs,
        isShowEcoFacilityPlaceholder,
    );

    const { street, postalCode } = accom?.hotel?.fullHotelAddress || {};

    const showLuxuryPackage = containsLuxuryPromoCode(booking?.promoCollections);

    const guestsLabel = useGuests(
        booking,
        getPhrase,
        SitecoreDictionary.BookingSummaryLabelsPersonTravelling,
        SitecoreDictionary.BookingSummaryLabelsPeopleTravelling,
    );
    const [datesLabel] = useDatesLabel(booking, isTradePortal, getPhrase);
    const nightsLabel = useNightsLabel(accom.startDate, accom.endDate, getPhrase);
    const board = useBoard(booking);
    const { ...data } = usePackageIcons({
        isLuxury: showLuxuryPackage,
        packageIcons: booking.hotel?.theme?.packageIcons || [],
        transfer: booking.transfers?.[0],
        extraLuggage: booking?.extraLuggageInfo,
    });

    const trackEvent = (isClick?: boolean, currentLocations?: string): void => {
        if (fireViewBookingEvent && isClick) {
            fireViewBookingEvent(ViewBookingTrackingEvents.DestinationLinks, currentLocations);
        }

        if (!isTradePortal || (!isClick && isBlockTracked)) {
            return;
        }

        const location = hotelLocationLinks.map(link => link.value.text).join(', ');
        const passengers = [adultsCountLabel, childrenCountLabel, infantsCountLabel].filter(item => item).join(', ');

        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: isClick ? EventActions.HotelSummaryClicked : EventActions.HotelSummary,
                eventCategory: EventCategories.BookingConfirmation,
                eventLabel: hotelName,
                eventType: isClick ? EventTypes.Interaction : EventTypes.NonInteraction,
                eventValue: 'null',
            },
            {
                ...GENERIC_CUSTOM_PARAMS_EMPTY,
                genericValue1: currentLocations ? currentLocations : location,
                genericValue2: passengers,
                genericValue3: datesLabel,
            },
        );

        if (!isClick) {
            setTracked(true);
        }
    };

    return (
        <div className='view-booking-hotel'>
            <HeaderTextWithIcon
                Icon={SvgHotelLargeLined}
                title={getPhrase(
                    isFlightAndHotelPackage
                        ? SitecoreDictionary.BookingSummaryTitlesBookingSummary
                        : SitecoreDictionary.BookingSummaryTitlesHolidaySummary,
                )}
            />
            <div ref={ref}>
                {!!hotelImages?.length && (
                    <ViewBookingHotelGallery
                        images={hotelImages}
                        fallbackImage={fallbackImage}
                        isPrintPreview={isPrintPreview}
                    />
                )}
                <div
                    className={classNames(styles.bookingDetailsHotel, {
                        [styles.bookingDetailsHotelLuxury]: showLuxuryPackage,
                    })}
                >
                    <div className={classNames(styles.hotelCard, 'view-booking-card')}>
                        <div
                            className={classNames('view-booking-hotel__main', styles.hotelCardMain, {
                                [styles.hotelCardMainFullWidth]: !showLuxuryPackage,
                            })}
                        >
                            <div className='view-booking-hotel__head'>
                                <h3 className={classNames('view-booking-hotel__title', styles.hotelTitle)}>
                                    {hotelName}
                                </h3>
                                <div className='view-booking-hotel__location' data-tid='hotel-location-links'>
                                    <RenderedHotelLocationLinks
                                        onClick={trackEvent}
                                        hotelLocationLinks={hotelLocationLinks}
                                        separator={', '}
                                        isFlightAndHotelPackage={isFlightAndHotelPackage}
                                    />
                                </div>

                                <HotelRating booking={booking} />
                            </div>

                            <div className='view-booking-hotel__details'>
                                <div>
                                    {isTradePortal ? (
                                        <ViewBookingPassengers
                                            adultsCount={adultsCount}
                                            childrenCount={childrenCount}
                                            infantsCount={infantsCount}
                                            adultsCountLabel={adultsCountLabel}
                                            childrenCountLabel={childrenCountLabel}
                                            infantsCountLabel={infantsCountLabel}
                                            mainGuestSex={guests[0]?.sex}
                                        />
                                    ) : (
                                        <div className={styles.detailsItem}>
                                            <SvgAdults />
                                            <span data-tid='guests-label'>{guestsLabel}</span>
                                        </div>
                                    )}
                                    {!!datesLabel && (
                                        <div className={styles.detailsItem}>
                                            <SvgCalendarLined />
                                            <span
                                                data-tid='dates-label'
                                                data-cs-mask
                                            >{`${datesLabel}, ${nightsLabel}`}</span>
                                        </div>
                                    )}

                                    {!!board.label && (
                                        <div className={styles.detailsItem}>
                                            <BoardTypeIcon iconUrl={board.iconUrl} className={styles.icon} />
                                            <span data-tid='board-label'>{board.label}</span>
                                        </div>
                                    )}

                                    {!!street && !!postalCode && (
                                        <div className={styles.detailsItem}>
                                            <SvgLocationPinFilled />
                                            <span data-tid='address-label'>
                                                {street}, {postalCode}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    {showLuxuryPackage && (
                        <div
                            className={classNames(styles.hotelCard, styles.hotelCardFeatures)}
                            data-tid='luxury-features-hotel-card'
                        >
                            <p className={styles.text} data-tid='luxury-features-title-text'>
                                {getPhrase(SitecoreDictionary.LuxuryLabelsThisHolidayIncludesStandard)}
                            </p>
                            <Placeholder
                                name='listed-items'
                                rendering={rendering}
                                className={styles.items}
                                itemClassName={styles.item}
                                isMultiColumn={true}
                                {...data}
                            />
                            <button
                                className={classNames('btn', 'btn--outlined', styles.button)}
                                onClick={(): void => {
                                    const el = document.getElementById('holiday-details');
                                    el && scrollToElement(el, 60);
                                }}
                            >
                                {getPhrase(SitecoreDictionary.LuxuryLabelsViewAllHolidayDetails)}
                            </button>
                        </div>
                    )}
                </div>
                <Facilities
                    facilityGroups={facilities}
                    shouldShowTitle={isMobile}
                    isShowEcoFacilityPlaceholder={isShowEcoFacilityPlaceholder}
                    rendering={rendering}
                    titleDictionaryKey={SitecoreDictionary.BookingSummaryTitlesFacilitiesTitle}
                    isPrintPreview={isPrintPreview}
                />
            </div>
        </div>
    );
};

export default observer(ViewBookingHotel);
