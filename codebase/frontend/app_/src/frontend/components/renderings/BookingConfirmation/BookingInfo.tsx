import React, { FunctionComponent, useEffect, useMemo } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { BookingContext } from 'frontend/context/BookingContext';
import { useChatbotTracking } from 'frontend/hooks/useChatbotTracking/useChatbotTracking';
import useStore from 'frontend/hooks/useStore';
import { OrderCheckoutPayment } from 'frontend/store/base/tracking/sitecore/constants';
import { IHolidaysStores } from 'frontend/store/holidays';
import { calculatePriceBreakdown } from 'frontend/utils/priceBreakdown.utils';
import { getBookingPdfFileName, getPdfLinks, getPdfRequestBody } from 'frontend/utils/viewBooking.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import { gaPaymentSuccess } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { usePaymentTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';
import ViewBookingHotel from 'frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel';
import ViewBookingToolbar from 'frontend/components/renderings/ViewBooking/components/Toolbar/ViewBookingToolbar';
import ViewBookingHolidayDetails from 'frontend/components/renderings/ViewBooking/components/ViewBookingHolidayDetails';
import ViewBookingNavigation, {
    ViewBookingAnchors,
} from 'frontend/components/renderings/ViewBooking/components/ViewBookingNavigation/ViewBookingNavigation';
import ViewBookingCost from 'frontend/components/renderings/ViewBooking/HolidayCost/components/ViewBookingCost';
import { IViewBookingFields } from 'frontend/components/renderings/ViewBooking/ViewBooking';

interface IBookingInfoProps extends ISitecoreComponent<IViewBookingFields, null>, IComponentWithDictionary {
    booking: IBookingInfo;
    isLoadingBookingConfirmationInfo: boolean;
    isScreenLarge: boolean;
    loadBookingConfirmationInfo: () => void;
    payBalance: () => void;
}

export const BookingInfo: FunctionComponent<IBookingInfoProps> = props => {
    const {
        booking,
        cardType,
        getPhrase,
        isScreenLarge,
        loadBookingConfirmationInfo,
        payBalance,
        isLoadingBookingConfirmationInfo,
        clearBooking,
        getSetting,
        paymentType,
    } = useStore((stores: IHolidaysStores) => ({
        booking: stores.bookingStore.booking,
        getPhrase: stores.layoutStore.getPhrase,
        isScreenLarge: stores.appStore.isScreenLarge,
        loadBookingConfirmationInfo: stores.bookingStore.loadBookingConfirmationInfo,
        cardType: stores.bookingStore.bookingInfoPayload.cardType,
        payBalance: stores.bookingStore.payRemainingBalance,
        clearBooking: stores.bookingStore.clearBooking,
        isLoadingBookingConfirmationInfo: stores.bookingStore.isLoadingBookingConfirmationInfo,
        getSetting: stores.layoutStore.getSetting,
        paymentType: stores.bookingStore.bookingInfoPayload.paymentType,
    }));
    const { fields, rendering } = props;

    const fallbackImage = getSetting(SiteSettings.HotelFallbackImage);

    const { pushTrackingEvent } = usePaymentTracking();

    useEffect(() => {
        loadBookingConfirmationInfo();

        return () => {
            clearBooking?.();
        };
    }, [clearBooking, loadBookingConfirmationInfo]);

    useEffect(() => {
        if (booking) {
            pushTrackingEvent(
                gaPaymentSuccess(
                    booking.paymentInfo.paymentHistory,
                    booking.paymentInfo.currency,
                    cardType,
                    paymentType === OrderCheckoutPayment.ApplePay,
                ),
            );
        }
    }, [booking, cardType, paymentType, pushTrackingEvent]);

    useChatbotTracking(booking);

    const bookingContextValue = useMemo(() => ({ booking }), [booking]);

    if (isLoadingBookingConfirmationInfo) {
        return <OverlaySpinner header={getPhrase(SitecoreDictionary.BookingConfirmationLabelsLoading)} />;
    }

    if (!booking) {
        return null;
    }

    const showRemainingBalance = booking.paymentInfo?.balanceDueAmount !== 0;
    const bookingPdfLink = getPdfLinks(booking);
    const bookingPdfRequestData = getPdfRequestBody(booking);
    const bookingPdfFileName = getBookingPdfFileName();
    const isLeadLoggedIn = booking.isLoggedInAsLeadPassenger;

    const bookingStartDate = booking.package?.accom?.startDate;
    const regionCode = booking.hotel?.location?.code;

    const priceBreakdown = calculatePriceBreakdown(booking?.extraPriceBreakdown || booking?.priceBreakdown);

    return (
        <BookingContext.Provider value={bookingContextValue}>
            <div className='view-booking' data-tid='booking-info'>
                {isScreenLarge && (
                    <ViewBookingNavigation
                        booking={booking}
                        bookingPdfFileName={bookingPdfFileName}
                        bookingPdfLink={bookingPdfLink}
                        isLeadLoggedIn={isLeadLoggedIn}
                        showRemainingBalance={showRemainingBalance}
                    />
                )}

                <div id={ViewBookingAnchors.HolidaySummary.anchorId}>
                    <Placeholder name={PlaceholderNames.HeroBannerTopSection} rendering={rendering} />

                    <ViewBookingToolbar
                        rendering={rendering}
                        booking={booking}
                        isBookingCanceled={false}
                        isLeadLoggedIn={isLeadLoggedIn}
                        bookingPdfLink={bookingPdfLink}
                        bookingPdfFileName={bookingPdfFileName}
                    />

                    <div className='wrapper-container wrapper-container--px'>
                        <Placeholder name={PlaceholderNames.ExternalExtrasBanner} rendering={rendering} />
                        <ViewBookingHotel booking={booking} fallbackImage={fallbackImage} rendering={rendering} />
                    </div>
                </div>

                <div className='wrapper-component-container__inner'>
                    {!booking.isExternalAgency && showRemainingBalance && (
                        <ViewBookingCost
                            priceBreakdown={priceBreakdown}
                            departureDate={bookingStartDate}
                            paymentInfo={booking.paymentInfo}
                            rendering={rendering}
                            isLoggedInUserLead={isLeadLoggedIn}
                            payBalance={payBalance}
                            showRemainingBalance={showRemainingBalance}
                        />
                    )}
                </div>

                <ComponentWrapper params={{ IsGreyBackground: '1', IsTriangleEnd: '1', IsTriangleStart: '1' }}>
                    <ViewBookingHolidayDetails booking={booking} fields={fields} rendering={rendering} />
                </ComponentWrapper>

                <div className='wrapper-container wrapper-container--px'>
                    {!booking.isExternalAgency && !showRemainingBalance && (
                        <ViewBookingCost
                            priceBreakdown={priceBreakdown}
                            departureDate={bookingStartDate}
                            paymentInfo={booking.paymentInfo}
                            rendering={rendering}
                            isLoggedInUserLead={isLeadLoggedIn}
                            payBalance={payBalance}
                            showRemainingBalance={showRemainingBalance}
                        />
                    )}

                    <Placeholder
                        name={PlaceholderNames.AtolProtection}
                        rendering={rendering}
                        bookingPdfLink={bookingPdfLink}
                        bookingPdfRequestData={bookingPdfRequestData}
                        bookingPdfFileName={bookingPdfFileName}
                        isLoggedInUserLead={isLeadLoggedIn}
                        isExternalAgency={booking.isExternalAgency}
                    />

                    {booking.isExternalAgency && (
                        <div className='rounded-container booking-help-container'>
                            <Placeholder name={PlaceholderNames.TravelAgentContacts} rendering={rendering} />
                        </div>
                    )}

                    <Placeholder
                        name={PlaceholderNames.Excursions}
                        rendering={rendering}
                        location={regionCode}
                        startDate={bookingStartDate}
                        endDate={booking.package?.accom?.endDate}
                    />
                </div>

                {!!booking.healthEntryRequirements?.length && (
                    <ComponentWrapper params={{ IsGreyBackground: '1', IsTriangleEnd: '1', IsTriangleStart: '1' }}>
                        <Placeholder
                            name={PlaceholderNames.HealthEntryRequirements}
                            rendering={rendering}
                            requirements={booking.healthEntryRequirements}
                            id={ViewBookingAnchors.HealthEntryRequirements.anchorId}
                        />
                    </ComponentWrapper>
                )}

                <Placeholder name={PlaceholderNames.Feedback} rendering={rendering} />
            </div>
        </BookingContext.Provider>
    );
};

export default observer(BookingInfo);
