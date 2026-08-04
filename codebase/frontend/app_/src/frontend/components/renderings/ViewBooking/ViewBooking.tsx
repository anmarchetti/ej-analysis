import { FC, useEffect, useMemo, useState } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { BookingContext } from 'frontend/context/BookingContext';
import useStore from 'frontend/hooks/useStore';
import { useViewBookingPageInit } from 'frontend/hooks/viewBooking.hooks';
import { logger } from 'frontend/services/logging';
import { IHolidaysStores } from 'frontend/store/holidays';
import { calculatePriceBreakdown } from 'frontend/utils/priceBreakdown.utils';
import {
    getBookingPdfFileName,
    getBookingRoute,
    getPdfLinks,
    getPdfRequestBody,
} from 'frontend/utils/viewBooking.utils';
import { AmendEventActions, AmendEventLabels } from 'models/data/tracking/AmendEvent';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import SiteSettings from 'models/enum/SiteSettings';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import OtherDepartureAirportsPopup from 'frontend/components/renderings/AmendFlights/components/OtherDepartureAirportsPopup/OtherDepartureAirportsPopup';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';
import AmendBookingErrorPopup from 'frontend/components/renderings/ViewBooking/components/AmendBookingErrorPopup';
import ViewBookingHotel from 'frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel';
import ViewBookingToolbar from 'frontend/components/renderings/ViewBooking/components/Toolbar/ViewBookingToolbar';
import ViewBookingHolidayDetails from 'frontend/components/renderings/ViewBooking/components/ViewBookingHolidayDetails';
import ViewBookingInventoryError from 'frontend/components/renderings/ViewBooking/components/ViewBookingInventoryError/ViewBookingInventoryError';
import ViewBookingNavigation, {
    ViewBookingAnchors,
} from 'frontend/components/renderings/ViewBooking/components/ViewBookingNavigation/ViewBookingNavigation';
import ViewBookingCost from 'frontend/components/renderings/ViewBooking/HolidayCost/components/ViewBookingCost';

import ManageHolidayEntry from './ManageHoliday/ManageHolidayEntry';

export interface IViewBookingFields {
    Icon: ISitecoreField<ISitecoreImage>;
    Limit: ISitecoreField<string>;
    LuggageIcon: ISitecoreField<ISitecoreImage>;
    Name: ISitecoreField<string>;
    SportsEquipmentIcon: ISitecoreField<ISitecoreImage>;
    SportsEquipmentTitle: ISitecoreField<string>;
    Storage: ISitecoreField<string>;
    TerminalLabel: ISitecoreField<string>;
    TerminalTooltipText: ISitecoreField<string>;
    YourHolidayQuoteLabel: ISitecoreField<string>;
    AmendDatesLabel?: ISitecoreField<string>;
    AmendHotelLabel?: ISitecoreField<string>;
    LoadingBookingSubtitle?: ISitecoreField<string>;
    LoadingBookingTitle?: ISitecoreField<string>;
    LuggageDisabledCTA?: ISitecoreField<ISitecoreLink>;
    LuggageDisabledDescription?: ISitecoreField<string>;
    LuggageDisabledHeader?: ISitecoreField<string>;
    LuggageInternalDescription?: ISitecoreField<string>;
    LuggageInternalHeader?: ISitecoreField<string>;
    ManageBookingLabel?: ISitecoreField<string>;
    ManageHotelAndDatesLabel?: ISitecoreField<string>;
    ManageHubLabel?: ISitecoreField<string>;
    ReadMoreLink?: ISitecoreField<ISitecoreLink>;
    ScrollToSeeFullReferences?: ISitecoreField<string>;
}

export interface IViewBookingProps extends ISitecoreComponent<IViewBookingFields>, IComponentWithDictionary {}

const ViewBooking: FC<IViewBookingProps> = props => {
    const {
        getPhrase,
        isScreenLarge,
        isBookingCanceled,
        isLoggedIn,
        isLoginPopupShown,
        isLuxuryPackage,
        setRedirectUrl,
        toggleLoginPopup,
        payBalance,
        isAmendErrorPopupShown,
        isOtherDepartureAirportsPopupShown,
        startAmendBookingFlights,
        fetchAmendableAlternativeTransfers,
        redirectToAmendTransferPage,
        onAmendDatesButtonClick,
        setIsRedirectPreventedAfterLogin,
        startEditPassengerDetails,
        hasInventoryError,
        trackGenericAmendmentAction,
        shouldOpenSeatMapForced,
        setSeatMapOpened,
        getSetting,
        successfulAmendmentStatus,
        toggleAmendErrorPopup,
        goToAmendRoomAndBoardPage,
        loadRoomAndBoardData,
        canLoadRoomAndBoardOptions,
        canLoadTransfers,
        trackGenericAmendmentActionWithGuests,
        sitePath,
        onAmendHotelButtonClick,
        isAmendHotelCTAVisible,
        isAmendDatesCTAVisible,
        isMicroAppManageMyHolidayAllowed,
        isMicroAppAmendTransferAllowed,
        isMicroAppAmendFlightsAllowed,
        isMicroAppAmendHotelAllowed,
        isMicroAppAmendRoomAndBoardAllowed,
        isMicroAppAmendMultiRoomAndBoardAllowed,
        isMicroAppAmendDateAllowed,
        isMicroAppAmendSeatsAllowed,
        isMicroAppAmendNameAllowed,
        redirectToMicroAppChangeTransferPage,
        redirectToMicroAppChangeFlightPage,
        redirectToMicroAppChangeDatePage,
        redirectToMicroAppChangeNamePage,
        redirectToMicroAppChangeSeatsPage,
        redirectToMicroAppChangeHotelPage,
        redirectToMicroAppChangeRoomAndBoardPage,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isScreenLarge: stores.appStore.isScreenLarge,
        isBookingCanceled: stores.viewBookingStore.isBookingCanceled,
        successfulAmendmentStatus: stores.viewBookingStore.successfulAmendmentStatus,
        isLoggedIn: stores.userStore.isLoggedIn,
        isLoginPopupShown: stores.userStore.isLoginPopupShown,
        setRedirectUrl: stores.userStore.setRedirectUrl,
        toggleLoginPopup: stores.userStore.toggleLoginPopup,
        payBalance: stores.viewBookingStore.payRemainingBalance,
        isAmendErrorPopupShown: stores.viewBookingStore.isAmendErrorPopupShown,
        isLuxuryPackage: stores.viewBookingStore.isLuxuryPackage,
        isOtherDepartureAirportsPopupShown: stores.amendFlightsStore.isOtherDepartureAirportsPopupShown,
        startAmendBookingFlights: stores.amendFlightsStore.startAmendBookingFlights,
        fetchAmendableAlternativeTransfers: stores.amendTransfersStore.fetchAmendableAlternativeTransfers,
        redirectToAmendTransferPage: stores.routerStore.redirectToAmendTransferPage,
        onAmendDatesButtonClick: stores.amendDatesStore.onAmendDatesButtonClick,
        redirectToAmendDatesPage: stores.routerStore.redirectToAmendDatesPage,
        pathname: stores.routerStore.pathname,
        setIsRedirectPreventedAfterLogin: stores.userStore.setIsRedirectPreventedAfterLogin,
        startEditPassengerDetails: stores.amendPassengerStore.startEditPassengerDetails,
        hasInventoryError: stores.viewBookingStore.hasInventoryError,
        trackGenericAmendmentAction: stores.trackingStore.trackGenericAmendmentAction,
        shouldOpenSeatMapForced: stores.seatMapStore.shouldOpenSeatMapForced,
        setSeatMapOpened: stores.seatMapStore.setSeatMapOpened,
        startToChangeTransferClick: stores.amendTransfersStore.startToChangeTransferClick,
        getSetting: stores.layoutStore.getSetting,
        toggleAmendErrorPopup: stores.viewBookingStore.toggleAmendErrorPopup,
        isMicroAppManageMyHolidayAllowed: stores.viewBookingStore.isMicroAppManageMyHolidayAllowed,
        goToAmendRoomAndBoardPage: stores.amendRoomAndBoardStore.goToAmendRoomAndBoardPage,
        loadRoomAndBoardData: stores.amendRoomAndBoardStore.loadRoomAndBoardData,
        isAmendRoomAndBoardCTAVisible: stores.amendRoomAndBoardStore.isAmendCTAVisible,
        canLoadRoomAndBoardOptions: stores.amendRoomAndBoardStore.canLoadRoomAndBoardOptions,
        canLoadTransfers: stores.amendTransfersStore.canLoadTransfers,
        trackGenericAmendmentActionWithGuests: stores.trackingStore.trackGenericAmendmentActionWithGuests,
        sitePath: stores.layoutStore.sitePath,
        onAmendHotelButtonClick: stores.amendHotelStore.onAmendHotelButtonClick,
        isAmendHotelCTAVisible: stores.amendHotelStore.isAmendCTAVisible,
        isAmendDatesCTAVisible: stores.amendDatesStore.isAmendCTAVisible,
        //
        isMicroAppAmendTransferAllowed: stores.viewBookingStore.isMicroAppAmendTransferAllowed,
        isMicroAppAmendFlightsAllowed: stores.viewBookingStore.isMicroAppAmendFlightsAllowed,
        isMicroAppAmendHotelAllowed: stores.viewBookingStore.isMicroAppAmendHotelAllowed,
        isMicroAppAmendRoomAndBoardAllowed: stores.viewBookingStore.isMicroAppAmendRoomAndBoardAllowed,
        isMicroAppAmendMultiRoomAndBoardAllowed: stores.viewBookingStore.isMicroAppAmendMultiRoomAndBoardAllowed,
        isMicroAppAmendDateAllowed: stores.viewBookingStore.isMicroAppAmendDateAllowed,
        isMicroAppAmendSeatsAllowed: stores.viewBookingStore.isMicroAppAmendSeatsAllowed,
        isMicroAppAmendNameAllowed: stores.viewBookingStore.isMicroAppAmendNameAllowed,
        //
        redirectToMicroAppChangeTransferPage: stores.routerStore.redirectToMicroAppChangeTransferPage,
        redirectToMicroAppChangeFlightPage: stores.routerStore.redirectToMicroAppChangeFlightPage,
        redirectToMicroAppChangeDatePage: stores.routerStore.redirectToMicroAppChangeDatePage,
        redirectToMicroAppChangeNamePage: stores.routerStore.redirectToMicroAppChangeNamePage,
        redirectToMicroAppChangeSeatsPage: stores.routerStore.redirectToMicroAppChangeSeatsPage,
        redirectToMicroAppChangeHotelPage: stores.routerStore.redirectToMicroAppChangeHotelPage,
        redirectToMicroAppChangeRoomAndBoardPage: stores.routerStore.redirectToMicroAppChangeRoomAndBoardPage,
    }));

    const { booking, isLoading } = useViewBookingPageInit();

    const [isInventoryErrorPopupShown, setIsInventoryErrorPopupShown] = useState(false);

    useEffect(() => {
        if (canLoadTransfers) {
            fetchAmendableAlternativeTransfers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canLoadTransfers]);

    useEffect(() => {
        if (canLoadRoomAndBoardOptions) {
            loadRoomAndBoardData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canLoadRoomAndBoardOptions]);

    useEffect(() => {
        if (booking?.isLoggedInAsLeadPassenger && isLoginPopupShown) {
            //fetch transfers after login
            canLoadTransfers && fetchAmendableAlternativeTransfers();
        }
    }, [booking?.isLoggedInAsLeadPassenger, canLoadTransfers, fetchAmendableAlternativeTransfers, isLoginPopupShown]);

    // WP-473 Logging (for one sprint only to find bug)
    // should be removed till release2024.2
    useEffect(() => {
        if (booking && window?.__NEXT_DATA__?.props) {
            logger.info(
                `Page: 'View booking'`,
                `Booking Reference: ${booking.bookingReference}`,
                `Tracking Id: ${window.__NEXT_DATA__.props.pageProps.layout.sitecore.context.trackingId}`,
            );
        }
    }, [booking]);

    const bookingContextValue = useMemo(() => ({ booking }), [booking]);

    const fallbackImage = getSetting(SiteSettings.HotelFallbackImage);

    const onLoginClick = (e?: React.MouseEvent, shouldRedirectAfterLogin: boolean = true): void => {
        e?.preventDefault();
        setIsRedirectPreventedAfterLogin(!shouldRedirectAfterLogin);
        setRedirectUrl(shouldRedirectAfterLogin ? SitePath.ViewBookings : '');
        toggleLoginPopup();
    };

    const onAmendClick = (e: React.MouseEvent, callback: () => void): void => {
        e?.preventDefault();
        const isLeadLoggedIn = booking?.isLoggedInAsLeadPassenger;

        if (!isLeadLoggedIn) {
            return onLoginClick(e, false);
        }

        return callback();
    };

    const onAmendFlightsClick = (e: React.MouseEvent): void => {
        const handler = isMicroAppAmendFlightsAllowed
            ? redirectToMicroAppChangeFlightPage
            : (): void => {
                  startAmendBookingFlights(booking!);
              };

        onAmendClick(e, handler);
        trackGenericAmendmentAction(AmendEventActions.ViewBooking, AmendEventLabels.EditYourFlights);
    };

    const onAmendTransfersClick = (e: React.MouseEvent): void => {
        const handler = isMicroAppAmendTransferAllowed
            ? redirectToMicroAppChangeTransferPage
            : redirectToAmendTransferPage;

        onAmendClick(e, handler);
        trackGenericAmendmentAction(AmendEventActions.ViewBooking, AmendEventLabels.EditYourTransfer);
    };

    const onAmendPassengerClick = (e: React.MouseEvent): void => {
        if (hasInventoryError) {
            toggleInventoryErrorPopup(true);

            return;
        }

        const handler = isMicroAppAmendNameAllowed
            ? redirectToMicroAppChangeNamePage
            : (): void => startEditPassengerDetails(booking!);

        onAmendClick(e, handler);
    };

    const onAmendSeatsClick = (e: React.MouseEvent): void => {
        const handler = isMicroAppAmendSeatsAllowed
            ? redirectToMicroAppChangeSeatsPage
            : (): void => setSeatMapOpened(true);

        onAmendClick(e, handler);
    };

    const onAmendDatesClick = (e: React.MouseEvent): void => {
        const handler = isMicroAppAmendDateAllowed ? redirectToMicroAppChangeDatePage : onAmendDatesButtonClick;

        onAmendClick(e, handler);
        trackGenericAmendmentActionWithGuests(AmendEventActions.ViewBooking, AmendEventLabels.ChangeDate, {}, false);
    };

    const onAmendHotelClick = (e: React.MouseEvent): void => {
        const handler = isMicroAppAmendHotelAllowed ? redirectToMicroAppChangeHotelPage : onAmendHotelButtonClick;

        onAmendClick(e, handler);
    };

    const onAmendRoomAndBoardClick = (e: React.MouseEvent): void => {
        const isMultiRoomBooking = (booking?.package?.accom?.rooms?.length ?? 0) > 1;
        const shouldRedirectToMicroApp = isMultiRoomBooking
            ? isMicroAppAmendMultiRoomAndBoardAllowed
            : isMicroAppAmendRoomAndBoardAllowed;

        const handler = shouldRedirectToMicroApp ? redirectToMicroAppChangeRoomAndBoardPage : goToAmendRoomAndBoardPage;

        onAmendClick(e, handler);
        trackGenericAmendmentActionWithGuests(AmendEventActions.ViewBooking, AmendEventLabels.ChangeRoomAndBoard, {
            destinationUrl: sitePath + SitePath.AmendRoomAndBoard,
        });
    };

    const isTradeBooking = booking?.isExternalAgency;

    const toggleInventoryErrorPopup = (value: boolean): void => {
        setIsInventoryErrorPopupShown(value);
    };

    const closeInventoryErrorPopup = (): void => {
        toggleInventoryErrorPopup(false);
    };

    const { fields, rendering } = props;

    if (isLoading) {
        return (
            <OverlaySpinner
                header={getPhrase(SitecoreDictionary.LoginLabelsSpinnerHeader)}
                description={getPhrase(SitecoreDictionary.LoginLabelsSpinnerDescription)}
            />
        );
    }

    if (!booking) {
        return null;
    }

    const showRemainingBalance = booking.paymentInfo?.balanceDueAmount !== 0 && !isBookingCanceled;
    const bookingPdfLink = getPdfLinks(booking);
    const bookingPdfRequestData = getPdfRequestBody(booking);
    const bookingPdfFileName = getBookingPdfFileName();
    const isLeadLoggedIn = booking.isLoggedInAsLeadPassenger;

    const bookingStartDate = booking.package?.accom?.startDate;
    const depDate = booking?.package?.transport?.routes?.[0]?.depDate;
    const regionCode = booking.hotel?.location?.code;

    const { depName: depAirportName = '' } = getBookingRoute(booking, RouteDirection.Outbound) || {};

    const priceBreakdown = calculatePriceBreakdown(booking?.extraPriceBreakdown || booking?.priceBreakdown);

    const isManageHolidayCTAVisible = !isLuxuryPackage && (isAmendHotelCTAVisible || isAmendDatesCTAVisible);

    const manageBookingLabel = isMicroAppManageMyHolidayAllowed
        ? fields?.ManageHotelAndDatesLabel?.value
        : fields?.ManageBookingLabel?.value;

    return (
        <BookingContext.Provider value={bookingContextValue}>
            <div
                className={classNames('view-booking', isBookingCanceled && 'view-booking--canceled')}
                data-tid='view-booking'
            >
                {/**
                 * When we need to return on view booking page with opened seat map there is a gap between
                 * request for loading booking and loasding seat widget which leads to flashing spinner.
                 * To avoid this flashing we use this flag which will be set to false only after seat map will be opened
                 */}
                {shouldOpenSeatMapForced && (
                    <OverlaySpinner
                        header={getPhrase(SitecoreDictionary.LoginLabelsSpinnerHeader)}
                        description={getPhrase(SitecoreDictionary.LoginLabelsSpinnerDescription)}
                    />
                )}

                {!isBookingCanceled && isScreenLarge && (
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
                        booking={booking}
                        isBookingCanceled={isBookingCanceled}
                        isLeadLoggedIn={isLeadLoggedIn}
                        bookingPdfLink={bookingPdfLink}
                        bookingPdfFileName={bookingPdfFileName}
                        rendering={rendering}
                        fields={props.fields}
                    />

                    <div className='wrapper-container wrapper-container--px'>
                        <ViewBookingHotel booking={booking} fallbackImage={fallbackImage} rendering={rendering} />
                        {isManageHolidayCTAVisible && (
                            <ManageHolidayEntry
                                onAmendDatesClick={onAmendDatesClick}
                                onAmendHotelClick={onAmendHotelClick}
                                amendDatesLabel={fields?.AmendDatesLabel?.value}
                                amendHotelLabel={fields?.AmendHotelLabel?.value}
                                manageBookingLabel={manageBookingLabel}
                            />
                        )}
                    </div>
                </div>

                <div className='wrapper-component-container__inner'>
                    {!isTradeBooking && showRemainingBalance && (
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

                <div className='wrapper-component-container__inner'>
                    <Placeholder name={PlaceholderNames.ExternalExtrasBanner} rendering={rendering} />
                </div>

                <ComponentWrapper params={{ IsGreyBackground: '1', IsTriangleEnd: '1', IsTriangleStart: '1' }}>
                    <ViewBookingHolidayDetails
                        booking={booking}
                        fields={fields}
                        rendering={rendering}
                        onAmendFlightsClick={onAmendFlightsClick}
                        onAmendTransfersClick={onAmendTransfersClick}
                        onAmendPassengerClick={onAmendPassengerClick}
                        onAmendSeatsClick={onAmendSeatsClick}
                        onAmendRoomAndBoardClick={onAmendRoomAndBoardClick}
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
                    {!isTradeBooking && !showRemainingBalance && (
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
                        isBookingCanceled={isBookingCanceled}
                        bookingPdfLink={bookingPdfLink}
                        bookingPdfRequestData={bookingPdfRequestData}
                        bookingPdfFileName={bookingPdfFileName}
                        isLoggedInUserLead={isLeadLoggedIn}
                        isExternalAgency={isTradeBooking}
                        showLoginButton={!isLoggedIn}
                        onLogin={onLoginClick}
                    />

                    {isTradeBooking && (
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

                <Placeholder
                    name={PlaceholderNames.LoginPopup}
                    rendering={rendering}
                    onClose={toggleLoginPopup}
                    isShowPopup={isLoginPopupShown}
                />
                {isAmendErrorPopupShown && (
                    <AmendBookingErrorPopup onClose={(): void => toggleAmendErrorPopup(false)} />
                )}
                {isOtherDepartureAirportsPopupShown && <OtherDepartureAirportsPopup airportName={depAirportName} />}

                {!!successfulAmendmentStatus && (
                    <Placeholder name={PlaceholderNames.SuccessfulAmendmentPopup} rendering={rendering} />
                )}

                {isInventoryErrorPopupShown && (
                    <ViewBookingInventoryError rendering={rendering} onClose={closeInventoryErrorPopup} />
                )}

                <Placeholder name={PlaceholderNames.UnAvailableFlowPopup} rendering={rendering} />
            </div>
        </BookingContext.Provider>
    );
};

export default observer(ViewBooking);
