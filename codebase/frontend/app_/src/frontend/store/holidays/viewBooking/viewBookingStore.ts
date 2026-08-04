import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import { DATE_FORMATS, TIME_UNITS } from 'code/dates';
import bookingService from 'frontend/services/booking.service';
import { logger } from 'frontend/services/logging';
import { AMEND_SEATS_DISABLED_STATUSES } from 'frontend/store/base/amend/amendSeats/constants';
import { FLIGHTS_PLUS_HOTEL_PROVIDER } from 'frontend/store/base/queryParams/constants';
import BaseViewBookingStore, { IViewBookingPayload } from 'frontend/store/base/viewBooking/BaseViewBookingStore';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { hasIntersection } from 'frontend/utils/array.utils';
import { formatDateL10n, formatDateToQuery } from 'frontend/utils/date.utils';
import { containsFAndHPromoCode } from 'frontend/utils/offer.utils';
import { goPayRemainingBalance } from 'frontend/utils/payment.utls';
import { getFlightDigitalNumber } from 'frontend/utils/route.utils';
import { submitForm } from 'frontend/utils/submitForm';
import { buildFlightPlusHotelUrl, matchesPathname } from 'frontend/utils/url.utils';
import {
    getBookingPayload,
    getDaysBeforeDeparture,
    getViewBookingRedirectLink,
    matchGuestsToAssistedTravelRequest,
} from 'frontend/utils/viewBooking.utils';
import { getWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IGuestWithAssistedTravelRequest } from 'models/data/assistedTravelRequest';
import { GuestBookingInfo } from 'models/data/GuestBookingInfo';
import {
    AmendmentType,
    BookingAllowanceRestrictions,
    DisruptionLevel,
    IBookingInfo,
    TViewBookingRestrictions,
} from 'models/data/IBookingInfo';
import { IAmendSeatsPayload } from 'models/data/ISeatMapStore';
import { IBookingTransfers } from 'models/data/ITransfer';
import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';
import { ACCESS_TO_PRIVATE_BOOKING, BookingErrorCodes, BookingStatus, FRAUD_CODE } from 'models/enum/BookingStatus';
import { GuestType } from 'models/enum/GuestType';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitePath from 'models/enum/SitePath';
import { SubmitPayload } from 'models/enum/SubmitPayload';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ViewBookingPageStates } from 'models/enum/ViewBookingPageStates';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

export class ViewBookingStore extends BaseViewBookingStore {
    @observable isLoading: boolean = false;
    @observable isLoadingBookingPrivacy: boolean = false;
    @observable isLoadingTransfers: boolean = false;
    @observable guestBookingInfo: GuestBookingInfo = new GuestBookingInfo();
    @observable bookingTransfers: Nullable<IBookingTransfers> = null;

    @observable errorMessage: Nullable<BookingErrorCodes> = null;
    @observable isLoadingBookingFromPayload: boolean = false;

    @observable isAmendSSRLoading: boolean = false;
    @observable isAmendSSRFailed: boolean = false;

    @observable isViewBookingStatusPage: boolean = false;

    // Temp decision before the correct Popup will be build
    @observable isManageHolidayPopupOpened = false;

    @observable dimension66: Nullable<string> = null;
    @observable paymentMethod: Nullable<string> = null;
    @observable guestWithAssistedTravelRequest: Nullable<IGuestWithAssistedTravelRequest[]> = null;
    @observable isAssistedTravelRequestsFailedToLoad: boolean = false;
    @observable isAssistedTravelRequestsLoading: boolean = true;

    constructor(public rootStore: HolidaysRootStore) {
        super(rootStore);
        makeObservable(this);
    }

    @action setIsManageHolidayPopupOpened = (value: boolean): void => {
        this.isManageHolidayPopupOpened = value;
    };

    @computed get isLeadLoggedIn(): boolean {
        return !!this.booking?.isLoggedInAsLeadPassenger;
    }

    @computed get amendBookingStatuses(): AmendBookingStatus[] {
        return this.booking?.amendmentInfo?.amendBookingStatus || [];
    }

    @computed get hasBookingAtcomError(): boolean {
        return this.rootStore.payStore.isAtcomError;
    }

    @computed get allowanceRestrictions(): TViewBookingRestrictions {
        return {
            [BookingAllowanceRestrictions.ByLeadPassenger]: this.amendBookingStatuses.includes(
                AmendBookingStatus.NotLoggedAsBookingLeadPassenger,
            ),
            [BookingAllowanceRestrictions.ByExternalAgency]: !!this.booking?.isExternalAgency,
        };
    }

    @computed get isAmendSeatsDisabled(): boolean {
        return hasIntersection(this.amendBookingStatuses, AMEND_SEATS_DISABLED_STATUSES);
    }

    @computed get isFlightAndHotelPackage(): boolean {
        return containsFAndHPromoCode(this.booking?.promoCollections || []);
    }

    @computed get viewBookingPageState(): ViewBookingPageStates {
        if (this.isBookingCanceled) {
            return ViewBookingPageStates.Cancelled;
        }

        const routes = this.booking?.package?.transport?.routes || [];
        const bookingStartDate = this.booking?.package?.accom?.startDate;
        const returnDate = routes[1]?.arrDate;

        if (!bookingStartDate || !returnDate) {
            return ViewBookingPageStates.Unknown;
        }

        const now = Date.now();
        const bookingStartTime = new Date(bookingStartDate).getTime();
        const returnTime = new Date(returnDate).getTime();

        const { bookingHoursPreTravelStarts, bookingHoursPostTravelStarts } = this.rootStore.layoutStore;

        const minTimeBeforeDeparture = bookingHoursPreTravelStarts * TIME_UNITS.millisecondsInHour;
        const minTimeAfterReturn = bookingHoursPostTravelStarts * TIME_UNITS.millisecondsInHour;

        const preDepartureTime = bookingStartTime - minTimeBeforeDeparture;
        const postReturnTime = returnTime + minTimeAfterReturn;

        if (now >= preDepartureTime && bookingStartTime >= now) {
            return ViewBookingPageStates.PreTravel;
        }

        if (now > bookingStartTime && now < postReturnTime) {
            return ViewBookingPageStates.InDestination;
        }

        if (now >= postReturnTime) {
            return ViewBookingPageStates.PostTravel;
        }

        return ViewBookingPageStates.ViewBooking;
    }

    @computed get isPreTravelPage(): boolean {
        return this.viewBookingPageState === ViewBookingPageStates.PreTravel;
    }

    @computed get isBookingCancellationAllowed(): boolean | undefined {
        return this.booking?.amendmentInfo?.canBookingCancelled;
    }

    @computed get isPostTravelPage(): boolean {
        return this.viewBookingPageState === ViewBookingPageStates.PostTravel;
    }

    @computed get isInDestinationPage(): boolean {
        return this.viewBookingPageState === ViewBookingPageStates.InDestination;
    }

    @computed get isCancelledBookingPage(): boolean {
        return this.viewBookingPageState === ViewBookingPageStates.Cancelled;
    }

    @computed get getBookingDisruptions(): DisruptionLevel[] {
        const itinerary = this.booking?.disruptionInfo?.itinerary ?? [];

        if (!itinerary.length) {
            return [];
        }

        return itinerary.reduce((acc: DisruptionLevel[], { disruptionLevel }) => {
            if (disruptionLevel && !acc.includes(disruptionLevel)) {
                return [...acc, disruptionLevel];
            }

            return acc;
        }, []);
    }

    @action clearGuestBookingInfo = (): void => {
        this.guestBookingInfo.clearData();
        this.booking = null;
        this.changeErrorMessage();
    };

    loadBooking = async (reloadBooking: boolean = false): Promise<void> => {
        let bookingPayload: Nullable<IViewBookingPayload>;

        if (!reloadBooking) {
            bookingPayload = this.viewBookingPayload || this.refreshBookingPayloadFromStorage;
        } else if (this.booking) {
            bookingPayload = getBookingPayload(this.booking);
        }

        this.dimension66 = bookingPayload?.dimension66;
        this.paymentMethod = bookingPayload?.paymentMethod;

        if (!(bookingPayload?.bookingReference && bookingPayload.date && bookingPayload.lastName)) {
            this.rootStore.routerStore.redirectToLoginPage();

            return;
        }

        this.guestBookingInfo.clearData();

        await this.getBooking(bookingPayload, reloadBooking);
    };

    @action changeErrorMessage = (messageCode?: BookingErrorCodes): void => {
        if (messageCode !== this.errorMessage) {
            this.errorMessage = messageCode || null;
        }
    };

    @action getBooking = async (payload?: IViewBookingPayload, isBookingReload?: boolean): Promise<void> => {
        const {
            holidayCreditStore,
            userStore,
            routerStore: { redirectToLoginPage },
            layoutStore: { isViewBookingPage },
            queryParamsStore: { buildQuery },
        } = this.rootStore;

        try {
            const date = formatDateToQuery(this.guestBookingInfo.departureDateObject);

            this.toggleLoading(true);

            if (
                userStore.isLoggedIn &&
                holidayCreditStore.isCreditBookingEnabled &&
                !holidayCreditStore.creditBalance
            ) {
                await holidayCreditStore.fetchMyCreditBalance(false, true);
            }

            const result = await bookingService.viewBooking(
                payload ? payload.date : date,
                payload ? payload.bookingReference : this.guestBookingInfo.bookingReference,
                payload ? payload.lastName : this.guestBookingInfo.lastName,
            );

            this.changeErrorMessage();

            logger.info(`Get booking: ${(result.data as IBookingInfo).bookingReference}`);

            runInAction(() => {
                this.updateBookingInfo(result.data, payload?.amendmentType);

                // added !!payload to fix http://jra.europe.easyjet.local/browse/EJH-13234
                !!payload && this.guestBookingInfo.clearData();
            });

            if (!isBookingReload) {
                this.handleViewBookingRedirects();
            }
        } catch (e) {
            switch (e.errorCode) {
                case FRAUD_CODE:
                    this.changeErrorMessage(BookingErrorCodes.Fraud);
                    break;
                case ACCESS_TO_PRIVATE_BOOKING:
                    this.changeErrorMessage(BookingErrorCodes.AccessToPrivateBooking);
                    break;
                default:
                    this.changeErrorMessage(BookingErrorCodes.NotFound);
            }

            if (isViewBookingPage) {
                redirectToLoginPage(false, buildQuery({ [QueryParamName.ViewMyBooking]: '1' }));
            }

            runInAction(() => {
                this.booking = null;
            });
        } finally {
            this.toggleLoading(false);
        }
    };

    @action loadBookingTransfers = async (
        bookingReference: string,
        lastName: string,
        startDate: string,
    ): Promise<void> => {
        this.toggleTransfersLoading(true);
        try {
            const result = await bookingService.getBookingTransfers(bookingReference, lastName, startDate);
            runInAction(() => {
                this.bookingTransfers = result.data;
            });
        } catch {
        } finally {
            this.toggleTransfersLoading(false);
        }
    };

    @action showBooking = (booking: Nullable<IBookingInfo>, clearPayStore = true): void => {
        if (!booking) {
            return;
        }

        if (clearPayStore) {
            this.rootStore.payStore.clearStore();
        }

        this.updateBookingInfo(booking);

        this.handleViewBookingRedirects();
    };

    @action handleViewBookingRedirects = (): void => {
        const {
            layoutStore: { isViewBookingRedirectsEnabled, viewBookingLinks, basePath },
            routerStore: { router, redirectTo },
        } = this.rootStore;

        const isFlightAndHotel = this.isFlightAndHotelPackage;
        const asPath = router?.asPath ?? '';
        const currentParams = new URLSearchParams(asPath.split('?')[1] || '');
        const hasEcpParam = currentParams.get(QueryParamName.ExperienceContextProvider) === FLIGHTS_PLUS_HOTEL_PROVIDER;

        const buildRedirectUrl = (redirectLink: string): string => {
            if (isFlightAndHotel) {
                return buildFlightPlusHotelUrl(redirectLink);
            }

            return redirectLink;
        };

        const redirectIfMatches = (redirectLink: string): void => {
            const isOnPage = matchesPathname({ asPath, pathname: redirectLink, basePath });

            if (!isOnPage || (isFlightAndHotel && !hasEcpParam)) {
                redirectTo(buildRedirectUrl(redirectLink));
            }
        };

        if (this.isBookingCanceled) {
            redirectIfMatches(viewBookingLinks.cancelled);

            return;
        }

        if (!isViewBookingRedirectsEnabled) {
            redirectTo(buildRedirectUrl(SitePath.ViewBooking));

            return;
        }

        const redirectLink = getViewBookingRedirectLink(this.viewBookingPageState, viewBookingLinks);

        redirectIfMatches(redirectLink);
    };

    @action updateBookingInfo = (booking: Nullable<IBookingInfo>, amendmentType?: Nullable<AmendmentType>): void => {
        this.baseUpdateBookingInfo(booking);

        this.successfulAmendmentStatus = amendmentType ?? this.successfulAmendmentStatus;
    };

    @action clearBooking = (): void => {
        this.updateBookingInfo(null);
    };

    @action toggleLoading = (state: boolean): void => {
        this.isLoading = state;
    };

    @action toggleLoadingBookingPrivacy = (state: boolean): void => {
        this.isLoadingBookingPrivacy = state;
    };

    @action toggleTransfersLoading = (state: boolean): void => {
        this.isLoadingTransfers = state;
    };

    @action amendBookingSpecialRequests = async (specialRequests: string[]): Promise<void> => {
        if (!this.booking) return;

        try {
            this.isAmendSSRFailed = false;
            this.isAmendSSRLoading = true;
            const { bookingReference, date, lastName } = getBookingPayload(this.booking);
            const res = await bookingService.amendBookingSpecialRequests(
                bookingReference,
                date,
                lastName,
                specialRequests,
            );

            if (res.data) {
                const newBooking = res.data;

                this.rootStore.trackingStore.trackBookingSpecialRequests(
                    EventTypes.SpecialRequestPb,
                    newBooking,
                    this.booking.specialRequests,
                );

                this.updateBookingInfo(newBooking);
            }
        } catch (e) {
            runInAction(() => (this.isAmendSSRFailed = true));
        } finally {
            runInAction(() => (this.isAmendSSRLoading = false));
        }
    };

    @action resetAmendSSR = (): void => {
        this.isAmendSSRFailed = false;
        this.isAmendSSRLoading = false;
    };

    payRemainingBalance = (): void => {
        this.rootStore.trackingStore.setPreviousPage();

        goPayRemainingBalance(
            this.booking as IBookingInfo,
            this.rootStore.userStore.userData,
            this.rootStore.layoutStore.basePath,
        );
    };

    @computed get hasInventoryError(): boolean {
        return !!this.booking?.amendmentInfo?.amendBookingStatus.includes(
            AmendBookingStatus.AmendPassengerDisabledByInventoryError,
        );
    }

    @action toggleBookingPrivacy = async (isPrivate: boolean): Promise<void> => {
        if (!this.booking) return;

        try {
            const { bookingReference, date, lastName } = getBookingPayload(this.booking);
            this.toggleLoadingBookingPrivacy(true);

            const result = await bookingService.toggleBookingPrivacy(isPrivate, bookingReference, lastName, date);

            runInAction(() => {
                this.updateBookingInfo(result.data);
                this.rootStore.trackingStore.trackBookingPrivacy(result?.data?.isPrivate || false);
            });
        } catch (e) {
            this.changeErrorMessage(BookingErrorCodes.Privacy);
        } finally {
            this.toggleLoadingBookingPrivacy(false);
        }
    };

    @action continueToPay = (): void => {
        if (!this.booking) {
            this.toggleAmendErrorPopup(true);

            return;
        }

        const {
            selectedFlight,
            selectedFilters: selectedFlightFilters,
            haveChosenSeatsBeenDropped,
        } = this.rootStore.amendFlightsStore;

        if (haveChosenSeatsBeenDropped) {
            return;
        }

        const { selectedTransfer } = this.rootStore.amendTransfersStore;

        if (selectedTransfer) this.rootStore.trackingStore.trackTransferAmendment(EventTypes.AmendTransferUpdate);

        const bookingPayload = getBookingPayload(this.booking);
        const { userData } = this.rootStore.userStore;

        const additionalParams = {
            billingInfo: !!userData
                ? {
                      fullName: `${userData.firstName} ${userData.lastName}`,
                      address: userData.address1,
                      address2: userData.address2,
                      city: userData.city,
                      postCode: userData.postalCode,
                  }
                : undefined,
            selectedFlight,
            selectedTransfer,
            selectedFlightFilters,
        };

        const { amendmentCharges, newSelection } = this.rootStore.amendSeatsStore;
        const { routes } = this.booking?.package?.transport || {};

        if (newSelection && routes) {
            const selectedSeats: IAmendSeatsPayload = {
                amendmentCharges: amendmentCharges || 0,
                newSeatSelection: newSelection,
                prevSeatSelection: this.booking.seatSelection || [],
                guests: this.booking.guests,
                outboundFlightNum: getFlightDigitalNumber(routes[0]),
                inboundFlightNum: getFlightDigitalNumber(routes[1]),
                validatedSeatsWithPrices: this.rootStore.seatMapStore.validatedSelectedSeats,
            };

            additionalParams['selectedSeats'] = selectedSeats;
        }

        this.rootStore.trackingStore.setPreviousPage();
        const baseUrl = this.rootStore.layoutStore.basePath + SitePath.AmendPayment;
        const separator = baseUrl.includes('?') ? '&' : '?';

        const ecpSuffix = this.rootStore.queryParamsStore.isFlightPlusHotelFunnel
            ? `${separator}${QueryParamName.ExperienceContextProvider}=${FLIGHTS_PLUS_HOTEL_PROVIDER}`
            : '';

        submitForm(`${baseUrl}${ecpSuffix}`, SubmitPayload.AmendPaymentInfo, {
            ...bookingPayload,
            ...additionalParams,
        });
    };

    handleSubmitBasket = (): void | Promise<void> => {
        const isFromTransfer = !!this.rootStore.amendTransfersStore.selectedTransfer;
        const isFromFlightChange = !!this.rootStore.amendFlightsStore.selectedFlight;

        if (isFromTransfer) {
            return this.rootStore.amendTransfersStore.submitTransfer();
        }

        if (isFromFlightChange) {
            return this.rootStore.amendFlightsStore.submitFlightChangeSelection();
        }

        return this.continueToPay();
    };

    isBookingClearRequired = (): boolean => {
        const pathsWithBookingRequired: string[] = [
            SitePath.AmendFlights,
            SitePath.AmendTransfer,
            SitePath.PassengerDetails,
            SitePath.AmendDates,
            SitePath.AmendRoomAndBoard,
            SitePath.AmendHotel,
            SitePath.ConfirmHolidayCredit,
            SitePath.ViewBooking,
            SitePath.AssistedTravel,
        ];

        return !pathsWithBookingRequired.includes(this.rootStore.routerStore.pathname);
    };

    isBookingPayloadClearRequired = (): boolean => SitePath.ViewBooking !== this.rootStore.routerStore.pathname;

    @action initBookingFromPayload = async (
        callback: (booking: IBookingInfo) => Promise<void> | void,
    ): Promise<void> => {
        const { routerStore, userStore, appStore } = this.rootStore;
        const { amendBookingItemPayload } = appStore;

        if (!amendBookingItemPayload) {
            routerStore.redirectToViewBookingsPage();

            return;
        }

        this.isLoadingBookingFromPayload = true;

        try {
            const isLoggedIn = await userStore.checkIfUserLoggedIn();

            if (!isLoggedIn) {
                routerStore.redirectToLoginPage(true);

                return;
            }

            const bookingResult = await bookingService.viewBooking(
                amendBookingItemPayload.date,
                amendBookingItemPayload.bookingReference,
                amendBookingItemPayload.lastName,
            );

            const booking = bookingResult.data;

            if (!booking) {
                routerStore.redirectToViewBookingsPage();

                return;
            }

            this.updateBookingInfo(booking);

            await callback(booking);
        } catch (e) {
            routerStore.redirectToViewBookingsPage();
        } finally {
            runInAction(() => {
                this.isLoadingBookingFromPayload = false;
            });
        }
    };

    @action setIsViewBookingStatusPage = (state: boolean): void => {
        this.isViewBookingStatusPage = state;
    };

    @action markGuestAsRequested = (passengerName: string): void => {
        this.guestWithAssistedTravelRequest = this.guestWithAssistedTravelRequest?.map(guest =>
            `${guest.passenger.firstName} ${guest.passenger.lastName}` === passengerName
                ? {
                      ...guest,
                      requestedAt: formatDateL10n(new Date().toISOString(), DATE_FORMATS.dateWithAbbrMonthName),
                  }
                : guest,
        );
    };

    @action initializeBookingFromPayload = async (): Promise<void> => {
        const bookingPayload = getWebStorageItem(WebStorageKeys.BookingPayload, true, sessionStorage);

        if (!bookingPayload) {
            this.rootStore.routerStore.redirectToViewBookingsPage();

            return;
        }

        if (!this.booking) {
            await this.rootStore.viewBookingStore.getBooking(bookingPayload, true);

            const { booking } = this.rootStore.viewBookingStore;

            if (!booking) {
                this.rootStore.routerStore.redirectToViewBookingsPage();

                return;
            }

            this.booking = booking;
        }
    };

    @computed get isPossibleToRequestAssistedTravel(): boolean {
        if (!this.booking) {
            return false;
        }

        const daysBeforeDeparture = getDaysBeforeDeparture(this.booking) || 0;

        return (
            !this.booking.isExternalAgency &&
            this.booking.bookingStatus !== BookingStatus.Canceled &&
            this.rootStore.layoutStore.isAssistedTravelOnlineFormEnabled &&
            daysBeforeDeparture >= this.rootStore.layoutStore.daysBeforeDepartureTravelAssistanceCanBeRequested &&
            !this.rootStore.layoutStore.isConfirmationPage &&
            this.rootStore.layoutStore.isSpecialAssistanceEnabled
        );
    }

    @action initializeAssistedTravelRequestsFetch = async (
        clearRequestsBeforeFetch = false,
        redirectIfNotAllowed = false,
    ): Promise<void> => {
        this.isAssistedTravelRequestsLoading = true;

        if (clearRequestsBeforeFetch) {
            this.clearAssistedTravelRequests();
        }

        if (this.booking?.bookingStatus === BookingStatus.Canceled) {
            this.isAssistedTravelRequestsLoading = false;
            this.rootStore.routerStore.redirectTo(this.rootStore.layoutStore.viewBookingLinks.cancelled);

            return;
        }

        if (!this.isPossibleToRequestAssistedTravel || !this.booking?.isLoggedInAsLeadPassenger) {
            this.isAssistedTravelRequestsLoading = false;

            if (redirectIfNotAllowed) {
                this.rootStore.routerStore.redirectToViewBookingPage();
            }

            return;
        }

        try {
            this.isAssistedTravelRequestsFailedToLoad = false;

            if (!this.booking || !!this.guestWithAssistedTravelRequest) {
                return;
            }

            const result = await bookingService.getAssistedTravelRequests(this.booking.bookingReference);
            runInAction(() => {
                if (this.booking?.guests) {
                    this.guestWithAssistedTravelRequest = matchGuestsToAssistedTravelRequest(
                        this.booking.guests.filter(guest => guest.type !== GuestType.Infant),
                        result,
                        this.rootStore.layoutStore.getPhrase,
                    );
                }
            });
        } catch {
            this.isAssistedTravelRequestsFailedToLoad = true;
        } finally {
            this.isAssistedTravelRequestsLoading = false;
        }
    };

    @action clearAssistedTravelRequests = (): void => {
        this.guestWithAssistedTravelRequest = null;
        this.isAssistedTravelRequestsFailedToLoad = false;
    };
}
