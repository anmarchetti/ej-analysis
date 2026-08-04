/* eslint-disable react-hooks/exhaustive-deps */
import React, { FunctionComponent, useEffect, useMemo } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { BookingContext } from 'frontend/context/BookingContext';
import useStore from 'frontend/hooks/useStore';
import { useViewBookingPageInit } from 'frontend/hooks/viewBooking.hooks';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { getBookingPdfFileName, getPdfLinks, getPdfRequestBody } from 'frontend/utils/viewBooking.utils';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';
import ViewBookingHotel from 'frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel';
import ViewBookingToolbar from 'frontend/components/renderings/ViewBooking/components/Toolbar/ViewBookingToolbar';
import ViewBookingHolidayDetails from 'frontend/components/renderings/ViewBooking/components/ViewBookingHolidayDetails';
import { ViewBookingAnchors } from 'frontend/components/renderings/ViewBooking/components/ViewBookingNavigation/ViewBookingNavigation';
import { IViewBookingFields } from 'frontend/components/renderings/ViewBooking/ViewBooking';

interface ITradePortalViewBookingParams {
    FallbackImage: string;
}

export const TradePortalViewBooking: FunctionComponent<
    ISitecoreComponent<IViewBookingFields, ITradePortalViewBookingParams>
> = ({ fields, params, rendering }) => {
    const {
        isBookingCanceled,
        clearBooking,
        setSeatMapOpened,
        successfulAmendmentStatus,
        isB2BAmendmentAllowed,
        isMicroAppAmendSeatsAllowed,
        redirectToMicroAppChangeSeatsPage,
    } = useStore((stores: ITradePortalStores) => ({
        isBookingCanceled: stores.viewBookingStore.isBookingCanceled,
        clearBooking: stores.viewBookingStore.clearBooking,
        setSeatMapOpened: stores.seatMapStore.setSeatMapOpened,
        successfulAmendmentStatus: stores.viewBookingStore.successfulAmendmentStatus,
        isB2BAmendmentAllowed: stores.viewBookingStore.isB2BAmendmentAllowed,
        isMicroAppAmendSeatsAllowed: stores.viewBookingStore.isMicroAppAmendSeatsAllowed,
        redirectToMicroAppChangeSeatsPage: stores.routerStore.redirectToMicroAppChangeSeatsPage,
    }));

    const { booking, isLoading } = useViewBookingPageInit();

    useEffect(
        () => () => {
            clearBooking();
        },
        [],
    );

    const bookingContextValue = useMemo(() => ({ booking }), [booking]);

    if (isLoading) {
        return (
            <OverlaySpinner
                header={fields?.LoadingBookingTitle?.value}
                description={fields?.LoadingBookingSubtitle?.value}
            />
        );
    }

    if (!booking) {
        return null;
    }

    const bookingPdfLink = getPdfLinks(booking);
    const bookingPdfRequestData = getPdfRequestBody(booking);
    const bookingPdfFileName = getBookingPdfFileName();
    const isLeadLoggedIn = booking.isLoggedInAsLeadPassenger;
    const depDate = booking.package?.transport?.routes?.[0]?.depDate;
    const isTradeBooking = booking?.isExternalAgency;

    const onAmendSeatsClick = (): void => {
        if (isMicroAppAmendSeatsAllowed && isB2BAmendmentAllowed) {
            return redirectToMicroAppChangeSeatsPage();
        }

        setSeatMapOpened(true);
    };

    return (
        <BookingContext.Provider value={bookingContextValue}>
            <div className={classNames('view-booking', isBookingCanceled && 'view-booking--canceled')}>
                <div id={ViewBookingAnchors.HolidaySummary.anchorId}>
                    <Placeholder name={PlaceholderNames.HeroBannerTopSection} rendering={rendering} />

                    <ViewBookingToolbar
                        booking={booking}
                        isBookingCanceled={isBookingCanceled}
                        isLeadLoggedIn={isLeadLoggedIn}
                        rendering={rendering}
                        fields={fields}
                    />

                    <div className='wrapper-container wrapper-container--px'>
                        <ViewBookingHotel
                            booking={booking}
                            fallbackImage={params.FallbackImage}
                            rendering={rendering}
                        />
                    </div>
                </div>

                <ComponentWrapper params={{ IsGreyBackground: '1', IsTriangleEnd: '1', IsTriangleStart: '1' }}>
                    <ViewBookingHolidayDetails
                        booking={booking}
                        fields={fields}
                        rendering={rendering}
                        onAmendSeatsClick={onAmendSeatsClick}
                        showLeadEmailOnly
                    >
                        {!isBookingCanceled && (
                            <Placeholder
                                name={PlaceholderNames.AmendRestrictions}
                                rendering={rendering}
                                depDate={new Date(depDate)}
                                isExternalAgency={isTradeBooking}
                                isLeadLoggedIn={isLeadLoggedIn}
                            />
                        )}
                    </ViewBookingHolidayDetails>
                </ComponentWrapper>

                <div className='wrapper-container wrapper-container--px'>
                    <Placeholder name={PlaceholderNames.ViewBookingCost} rendering={rendering} />

                    <Placeholder
                        name={PlaceholderNames.AtolProtection}
                        rendering={rendering}
                        isBookingCanceled={isBookingCanceled}
                        bookingPdfLink={bookingPdfLink}
                        bookingPdfRequestData={bookingPdfRequestData}
                        bookingPdfFileName={bookingPdfFileName}
                        isLoggedInUserLead={isLeadLoggedIn}
                    />
                </div>

                {booking.healthEntryRequirements?.length && (
                    <ComponentWrapper params={{ IsGreyBackground: '1', IsTriangleEnd: '1', IsTriangleStart: '1' }}>
                        <Placeholder
                            name={PlaceholderNames.HealthEntryRequirements}
                            rendering={rendering}
                            requirements={booking.healthEntryRequirements}
                            id={ViewBookingAnchors.HealthEntryRequirements.anchorId}
                        />
                    </ComponentWrapper>
                )}

                {!!successfulAmendmentStatus && (
                    <Placeholder name={PlaceholderNames.SuccessfulAmendmentPopup} rendering={rendering} />
                )}
            </div>
        </BookingContext.Provider>
    );
};

export default observer(TradePortalViewBooking);
