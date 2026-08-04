import { CancelTokenSource } from 'axios';
import { action, computed, makeObservable, observable, runInAction, toJS, when } from 'mobx';

import { TIME_UNITS } from 'code/dates';
import { envAll } from 'code/env';
import bookingService from 'frontend/services/booking.service';
import { logger } from 'frontend/services/logging';
import offersService from 'frontend/services/offers.service';
import BaseBookingStore, { IBaseChangeFlightsProps } from 'frontend/store/base/booking/BaseBookingStore';
import { FLIGHTS_PLUS_HOTEL_PROVIDER } from 'frontend/store/base/queryParams/constants';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import {
    bookingTransfersError,
    cancelPaymentError,
    commitBookingError,
} from 'frontend/store/holidays/payment/payment-failures.config';
import { canPayRemainingBalance, getDateWithoutDSTOffset } from 'frontend/utils/date.utils';
import { getFreeNightsIncludedInOffer } from 'frontend/utils/freeNights.utils';
import { containsFAndHPromoCode, swapOfferAccommodations } from 'frontend/utils/offer.utils';
import { fillMDFor3DS1, removeCardNumberFor3DS2 } from 'frontend/utils/payment.utls';
import {
    getTransactionId,
    setTransactionDone,
    setTransactionProcessing,
    startNewTransaction,
} from 'frontend/utils/paymentTransaction';
import { getPromoPageDates } from 'frontend/utils/promoPageDates';
import { getFlightsReferences } from 'frontend/utils/route.utils';
import { getPaymentType } from 'frontend/utils/sitecorePersonalize.utils';
import { submitForm } from 'frontend/utils/submitForm';
import { getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import { setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { ApiError } from 'models/data/ApiError';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IBookingInfo } from 'models/data/IBookingInfo';
import {
    IApplePayBookingPaymentInfo,
    IBookingPaymentInfo,
    ICommitBookingRequestBody,
} from 'models/data/ICommitBookingRequestBody';
import { IOffer, IUnit } from 'models/data/IOffer';
import { ISpecificOfferWithAltAcc } from 'models/data/ISpecificOffer';
import { ITransfer } from 'models/data/ITransfer';
import { IValidateBookingRequestBody } from 'models/data/IValidateBookingRequestBody';
import { IValidatePackageInfo } from 'models/data/IValidPackageInfo';
import { IPaymentAuthorization } from 'models/data/payment/IPaymentAuthorization';
import { IThreeDSData } from 'models/data/payment/IThreeDSData';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import {
    AIRPORT_PARKING_UNAVAILABLE_API_ERRORS,
    AIRPORT_PARKING_VALIDATION_API_ERRORS,
    ApiErrors,
} from 'models/enum/ApiErrors';
import { Bd4TravelPlacementId } from 'models/enum/Bd4TravelListId';
import { BookingStatus } from 'models/enum/BookingStatus';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { MAP_OFFER_PROMOTION_CODES_TO_SITE_SETTINGS } from 'models/enum/OfferPromotionCodes';
import { PaymentType } from 'models/enum/PaymentType';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitePath from 'models/enum/SitePath';
import SiteSettings from 'models/enum/SiteSettings';
import { SubmitPayload } from 'models/enum/SubmitPayload';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { TransferType } from 'models/enum/transfer/TransferType';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

export interface IChangeFlightsProps extends IBaseChangeFlightsProps {
    offer: IAlternativeOffer;
}

export class BookingStore extends BaseBookingStore {
    @observable isValidatingPackage: boolean = false;
    @observable isCommittingBooking: boolean = false;
    @observable isLoadingBookingConfirmationInfo: boolean = false;
    @observable isLoadingRecommendedHotels: boolean = false;
    @observable isPaymentPriceJump: boolean = false;
    @observable priceAfterJump: number = 0;
    @observable isAirportParkingValidationError: boolean = false;

    @action clearIsCommittingBooking = (): void => {
        this.isCommittingBooking = false;
    };

    /**
     * Replace isShownMapOnMobile observable when default Setting for showing map on mobile is added to Map Visibility Setting
     * @observable isShownMapOnMobile: boolean = !!this.rootStore.layoutStore.getSetting(SiteSettings.IsMapHiddenOnMobile);
     */

    constructor(public rootStore: HolidaysRootStore) {
        super(rootStore);

        makeObservable(this);
    }

    @action setIsAirportParkingValidationError = (state: boolean): void => {
        this.isAirportParkingValidationError = state;
    };

    protected override get isPackageValidationInProgress(): boolean {
        return this.isValidatingPackage;
    }

    protected override applyPromoCodeValidationResult = (data: IValidatePackageInfo): void => {
        this.rootStore.holidayCreditStore.setCreditEnabledApiSettings(data.creditIsEnabled);
    };

    protected override runPromoCodeSuccessPaymentAction = (): void => {
        this.rootStore.paymentStore.reselectPayment();
    };

    protected override onPromoCodeErrorCleanup = (): void => {
        this.rootStore.redeemVoucherStore.cleanupRedeemStore();
    };

    /**
     * Sets total & pp prices
     *  for selected offer
     */

    @action changeFlight = async ({
        offer,
        priceDiff,
        reloadOffer = true,
        isPriceGraphEventTarget = false,
        board,
        rooms,
        isExt,
        disableLoadAlternativeFlights,
    }: IChangeFlightsProps): Promise<void> => {
        this.isLateCheckoutRoomSelected = false;
        this.lateRoomCheckout = null;

        this.changeIsClickChangeButton(true);
        const prevRoutes = this.selectedOffer?.transport?.routes;
        const { touristTax, touristTaxPP, taxesAndFees } = getTouristTaxFieldsFromOffer(this.selectedOffer);

        this.selectedOffer = {
            ...offer,
            touristTax,
            touristTaxPP,
            taxesAndFees,
            hotel: this.selectedOffer!.hotel,
        } as IOffer; // boardType & roomType are not available in IAlternativeOffer
        // which is saved in this field when changing the flight on mobile on hotel detail page
        this.notValidatedOfferPricePP = offer.pricePP;
        this.notValidatedOfferPrice = offer.price;

        const selectedTransferCode = offer?.transfers?.[0]?.code ?? '';

        if (this.selectedTransferFromUrl === selectedTransferCode) {
            this.selectedOffer.transfers = offer.transfers;
        } else {
            this.selectedTransferFromUrl = selectedTransferCode;
        }

        this.defaultTransferFromUrl = selectedTransferCode;

        if (this.rootStore.layoutStore.isExtrasPage) {
            this.togglePriceManipulating(true);
        }

        await this.clearAncillariesAndUpdateUrl();
        await this.clearFlightNumbersAndUpdateUrl();

        if (reloadOffer) {
            await this.fetchOfferAndReloadPage(
                true,
                true,
                undefined,
                board,
                rooms,
                isExt,
                disableLoadAlternativeFlights,
            );
        }

        if (this.rootStore.layoutStore.isHotelDetailsBookPage && !this.rootStore.layoutStore.isMaintenance) {
            await this.loadRecommendedHotels(Bd4TravelPlacementId.HotelBook);
        }

        const eventType = isPriceGraphEventTarget ? EventTypes.FlightChangePriceGraph : EventTypes.FlightUpdate;
        this.rootStore.trackingStore.holidayConfigChangeTrigger(eventType, priceDiff, prevRoutes);
    };

    @action changeRoom = async (index: number, unit: IUnit, priceDiff: number): Promise<void> => {
        const offerSnapshot = this.createOfferSnapshot();
        let board: string | undefined;

        this.changeIsClickChangeButton(true);

        if (this.selectedOffer) {
            // get new board code when room has a board alteration option
            board = unit.requireBoardAlteration;

            // set new board when board alteration is required to prevent offer fail after refresh
            this.selectedOffer.accom.unit[index] = {
                ...unit,
                board: board ?? this.selectedOffer.accom.unit[index].board,
                boardType: unit.boardType ?? this.selectedOffer.accom.unit[index].boardType,
            };
        }

        this.selectedOffer = swapOfferAccommodations(
            this.selectedOffer,
            this.altAccommodations,
            unit.accommodationId,
            unit.packageId,
        );

        if (this.selectedOffer) {
            this.selectedOffer.accom.isExt = unit.isExt || false;
        }

        if (this.rootStore.layoutStore.isExtrasPage) {
            this.togglePriceManipulating(true);
        }

        // Await complete router change and only then fetch offer
        await this.rootStore.routerStore.updateCurrentPage(this.rootStore.queryParamsStore.buildHotelDetailsQuery());

        // restore original rooms selection on request error
        const onFail = (): void => {
            this.setRoomUnavailablePopupShown(true);
            this.restoreDataFromOfferSnapshot(offerSnapshot);
        };

        await this.fetchOffer(true, true, onFail, board);

        this.rootStore.trackingStore.holidayConfigChangeTrigger(EventTypes.RoomUpdate, priceDiff);

        if (board) {
            this.rootStore.trackingStore.holidayConfigChangeTrigger(EventTypes.BoardBasisUpdate, priceDiff);
        }
    };

    @action changeTransfer = async (transfer?: ITransfer): Promise<void> => {
        const { layoutStore, trackingStore, routerStore, queryParamsStore } = this.rootStore;

        if (
            transfer &&
            transfer.type !== TransferType.NoTransfer &&
            this.extraLuggage.sportEquipmentNumber &&
            !this.isEnoughTimeForAddSETransfer
        ) {
            this.setTransferCandidate(transfer);
            this.setIsTransferRemoveSE(true);

            return;
        }

        this.changeIsClickChangeButton(true);

        if (layoutStore.isExtrasPage) {
            this.togglePriceManipulating(true);
        }

        const oldTransfer = this.transfer;
        const newTransfer = transfer || this.transferCandidate;

        if (!newTransfer) {
            return;
        }

        this.selectedTransferFromUrl = newTransfer.code;
        this.selectedOffer!.transfers = [newTransfer];

        await this.fetchOffer(true);

        if (!this.failedToLoadData) {
            this.setTransferCandidate(null);

            if (transfer) {
                trackingStore.trackTransferChange(transfer, EventTypes.AddToBasket);
            }

            if (oldTransfer) {
                trackingStore.trackTransferChange(oldTransfer, EventTypes.RemoveFromBasket);
            }

            routerStore.updateCurrentPage(
                queryParamsStore.buildHotelDetailsQuery(undefined, {
                    [QueryParamName.DefaultTransfer]: this.defaultTransferFromUrl,
                    [QueryParamName.Transfer]: newTransfer.code,
                }),
            );
        }
    };

    get validateBookingRequestBody(): IValidateBookingRequestBody {
        let airportParking = {};

        if (this.rootStore.airportParkingStore.selectedAirportParking) {
            airportParking = { airportParking: this.rootStore.airportParkingStore.selectedAirportParking };
        }

        return {
            ...this.validateBookingBaseRequestBody,
            ...airportParking,
        };
    }

    @action validatePackage = async (
        callback?: () => void,
        disableLoader = false,
        failSilently = false,
        onSuccess?: () => void,
        onError?: (e: any) => void,
        isApplyingPromoCode = false,
    ): Promise<void> => {
        if (!disableLoader) {
            this.rootStore.appStore.setLoading(true);
        }

        if (this.isValidatingPackage) {
            await when(() => this.isValidatingPackage === false);

            return;
        }

        /** Get promo code from local storage if needed */
        runInAction(() => this.parsePromocode());

        if (!disableLoader) {
            // <PackageValidatingOverlay /> show loading screen when isValidatingPackage is true
            this.isValidatingPackage = true;
        }

        if (this.rootStore.guestDetailsStore.guestsDetails.length === 0) {
            this.rootStore.guestDetailsStore.createGuestsDetails();
        }

        if (this.applyingPromoCode) {
            this.applyingPromoCode = false;
        }

        try {
            this.previousPrice = this.currentSavedPrice;

            const result = await bookingService.validatePackage(this.validateBookingRequestBody);

            if (this.rootStore.layoutStore.isFullMaintenance) {
                runInAction(() => {
                    this.isPackageValid = true;
                });

                return;
            }

            runInAction(() => {
                this.rootStore.holidayCreditStore.setCreditEnabledApiSettings(result.data.creditIsEnabled);
                this.rootStore.flightsPassengersStore.setPassengersStore(result.data);

                if (this.rootStore.seatMapStore.isEnabledToBookSeats) {
                    this.rootStore.seatMapStore.setValidatedSelectedSeats(result.data?.seatSelection || []);
                }

                if (result.data?.extraLuggageInfo) {
                    this.extraLuggage.setExtraLuggageInfo(result.data.extraLuggageInfo);
                }

                this.packageInfo = result.data;
                this.isPackageValid = true;

                if (this.selectedOffer) {
                    this.selectedOffer.transfers = result.data.transfers;
                    this.updateTransfersVisibility(result.data.transfers);
                }

                if (this.priceManipulating) {
                    this.previousPrice = this.totalPrice;
                }

                this.updateTransactionPrice(); // always store current price in transaction just in case

                onSuccess?.();
                this.applyingPromoCode = isApplyingPromoCode;
            });
        } catch (error) {
            await this.handleValidatePackageException(
                error,
                callback,
                disableLoader,
                failSilently,
                onSuccess,
                onError,
                isApplyingPromoCode,
            );
        } finally {
            runInAction(() => {
                if (callback) {
                    callback();
                } else {
                    this.isValidatingPackage = false;
                }

                this.togglePriceManipulating(false);
                this.rootStore.appStore.setLoading(false);
            });
        }
    };

    private readonly handleValidatePackageException = async (
        error: any,
        callback?: () => void,
        disableLoader = false,
        failSilently = false,
        onSuccess?: () => void,
        onError?: (e: any) => void,
        isApplyingPromoCode = false,
    ): Promise<void> => {
        const apiError = error as ApiError;

        if (apiError.response) {
            const errors = apiError.response.data.innerErrors?.map(x => x.code);

            if (errors && this.isEveryErrorAirportParkingError(errors)) {
                runInAction(() => {
                    logger.info(`Airport parking validation errors`, errors);
                    this.isAirportParkingValidationError = true;
                });

                this.endHandleValidatePackageException(onError, error);

                return;
            }
        }

        if (error.errorCode === ApiErrors.NotAllSeatsForFlightSelected) {
            // try to validate the package without seats
            await this.handleNotAllSeatsSelectedApiError(
                callback,
                disableLoader,
                failSilently,
                onSuccess,
                onError,
                isApplyingPromoCode,
            );

            return;
        }

        if (!failSilently) {
            this.rootStore.seatMapStore.setIsSelectedSeatsUnavailableError(
                error.errorCode === ApiErrors.SelectedSeatsNotAvailable,
            );

            runInAction(() => {
                this.isPackageValid = false;
                this.rootStore.paymentStore.clearPaymentStore();
            });
        }

        this.endHandleValidatePackageException(onError, error);
    };

    @action updateOfferInfo = (selectedOffer: ISpecificOfferWithAltAcc): void => {
        this.updateOfferInfoBase(selectedOffer);

        const { airportParking } = selectedOffer.offers[0];

        if (airportParking) {
            this.rootStore.airportParkingStore.setSelectedAirportParking(airportParking);
        }
    };

    // Fix for SEATS-166
    // to avoid possibility to book not all seats for one flight if the user
    // didn't specify all seats via URL
    private handleNotAllSeatsSelectedApiError = async (
        callback?: () => void,
        disableLoader = false,
        failSilently = false,
        onSuccess?: () => void,
        onError?: (e: any) => void,
        isApplyingPromoCode = false,
    ): Promise<void> => {
        await this.rootStore.seatMapStore.clearSelectedSeatsAndUpdateUrl();
        runInAction(() => {
            this.isValidatingPackage = false; // for recursion call allowance
        });
        await this.validatePackage(callback, disableLoader, failSilently, onSuccess, onError, isApplyingPromoCode);
    };

    handleCommitBookingError = (error: ApiError): void => {
        if (error.innerErrors?.[0]?.code === ApiErrors.CommitBookingPriceJump) {
            this.setIsPaymentPriceJump(true);
            this.setPriceAfterJump(Number(error.innerErrors?.[0]?.message ?? 0));

            return;
        }

        this.rootStore.payStore.setPaymentError({
            ...commitBookingError,
            ...{ correlationId: error.correlationId },
        });
    };

    private createBookingBody = (threeDSData: Nullable<IThreeDSData>): ICommitBookingRequestBody => {
        const bookingBody = this.commitBookingRequestBody;

        bookingBody.sessionId = this.rootStore.payStore.sessionId || undefined;
        bookingBody.bookingReference = this.rootStore.paymentStore.bookingReference || undefined;
        bookingBody.deviceId = this.guestsInfoPayload?.deviceId;

        const selectedPaymentType = this.rootStore.payStore.selectedPaymentType;

        if (threeDSData?.threeDSEventType && selectedPaymentType === PaymentType.Card) {
            const bookingRequestPaymentInfo = bookingBody.paymentInfo as IBookingPaymentInfo;
            const { threeDSServerTransID } = this.rootStore.payStore;
            bookingRequestPaymentInfo.threeDSServerTransID = threeDSServerTransID || '';
            bookingRequestPaymentInfo.transactionReference = threeDSData.transactionReference;

            bookingRequestPaymentInfo.md = threeDSData.md;
            bookingRequestPaymentInfo.paRes = threeDSData.paRes;
            bookingRequestPaymentInfo.issuerUrl = threeDSData.issuerUrl;
            bookingRequestPaymentInfo.challengeComplete = threeDSData.challengeComplete;
            bookingRequestPaymentInfo.transStatus = threeDSData.transStatus;
            // 3DS errors
            bookingRequestPaymentInfo.authenticationError = threeDSData.authenticationError;
            bookingRequestPaymentInfo.fingerprintError = threeDSData.fingerprintError;
            bookingRequestPaymentInfo.fingerprintTimeout = threeDSData.fingerprintTimeout;

            bookingRequestPaymentInfo.challengeError = threeDSData.challengeError;

            bookingBody.bookingReference = threeDSData.bookingReference || undefined;
            bookingBody.requestId = threeDSData.requestId || undefined;
            bookingBody.sessionId = threeDSData.sessionId || undefined;
        }

        removeCardNumberFor3DS2(this.rootStore.payStore, bookingBody);
        fillMDFor3DS1(this.rootStore.payStore, bookingBody);

        return bookingBody;
    };

    @action
    commitBooking = async (threeDSData?: IThreeDSData, force?: boolean): Promise<void> => {
        const { setSessionId } = this.rootStore.payStore;
        const { clearPaymentUI, canPay, setBookingReference } = this.rootStore.paymentStore;

        try {
            if (!force) {
                if (this.isCommittingBooking) return;

                if (!canPay) {
                    this.rootStore.payStore.onForceErrors(true);

                    return;
                }
            }

            this.isCommittingBooking = true;
            clearPaymentUI(false);
            setTransactionProcessing();

            const transactionId = getTransactionId(this.rootStore.routerStore.search);
            const bookingBody = this.createBookingBody(threeDSData);
            const result = await bookingService.commitBooking(bookingBody, transactionId);

            setSessionId(null);
            setBookingReference(null);

            const { resultCode } = result.data as IPaymentAuthorization;

            if (resultCode) {
                this.rootStore.payStore.setPaymentAuthorization(result);
            } else {
                // save promoCode before clearing state
                bookingBody.discount = this.promoCode.value;
                this.handleBookingSuccess(result.data as IBookingInfo);
                await this.redirectToBookingConfirmation(bookingBody);
            }
        } catch (e) {
            this.handleBookingError(e as ApiError);
            runInAction(() => {
                this.isCommittingBooking = false;
            });
        } finally {
            // For Trade Portal: always turn off spinner (original behavior).
            // For non-Trade Portal: spinner stays active until the payment gateway (ThreeDS)
            // mounts (cleared via clearIsCommittingBooking) or the page navigates away (redirect path).
            if (this.rootStore.layoutStore.isTradePortal) {
                runInAction(() => {
                    this.isCommittingBooking = false;
                });
            }
        }
    };

    private readonly handleBookingSuccess = (bookingData: IBookingInfo): void => {
        logger.info(`Booking committed: ${bookingData.bookingReference}`);

        runInAction(() => {
            this.booking = bookingData;
            this.rootStore.payStore.setFailedToPay(false);
            this.rootStore.paymentStore.clearPaymentUI();
            this.rootStore.payStore.clearCardInfo();
            this.clearPromoCode();
            sessionStorage.removeItem(WebStorageKeys.IsVoucherRedeemedBookingFlow);
            this.rootStore.redeemVoucherStore.cleanupRedeemStore();
        });

        this.rootStore.hotelsStore.clearPrefillParams();
        setTransactionDone();
    };

    private readonly handleBookingError = (apiError: ApiError): void => {
        const { setSessionId, setPaymentError } = this.rootStore.payStore;
        const { clearPaymentUI, setBookingReference } = this.rootStore.paymentStore;

        startNewTransaction(decodeURIComponent(this.rootStore.routerStore.search), this.totalPrice);

        const data = apiError.additionalData;

        if (data) {
            setSessionId(data.sessionId);
            setBookingReference(data.bookingReference);
        }

        runInAction(() => {
            this.rootStore.payStore.setFailedToPay(true);

            const airportParkingError = apiError.innerErrors?.some(err =>
                AIRPORT_PARKING_UNAVAILABLE_API_ERRORS.includes(err.code as ApiErrors),
            );

            if (apiError.errorCode === ApiErrors.OfferNotAvailable && airportParkingError) {
                this.rootStore.airportParkingStore.setIsSelectedParkingUnavailableError(true);
            } else if (
                apiError.errorCode === ApiErrors.OfferNotAvailable ||
                this.isPriceChangeToleranceError(apiError)
            ) {
                this.isPackageValid = false;
            }

            if (
                apiError.errorCode === ApiErrors.WrongDiscount ||
                apiError.innerErrors?.some(e => e.code === ApiErrors.WrongSystemDiscount)
            ) {
                this.clearPromoCode();
            }

            if (apiError.errorCode !== ApiErrors.BookingTransferIsNotAvailable) {
                clearPaymentUI();
            }

            switch (apiError.errorCode) {
                case ApiErrors.CommitBookingError:
                    this.handleCommitBookingError(apiError);
                    break;
                case ApiErrors.CancelPaymentError:
                    setPaymentError({ ...cancelPaymentError, correlationId: apiError.correlationId });
                    break;
                case ApiErrors.BookingTransferIsNotAvailable:
                    setPaymentError({ ...bookingTransfersError, correlationId: apiError.correlationId });
                    this.validatePackage();
                    break;
                case ApiErrors.MaxPriceJumpExceeded:
                case ApiErrors.PriceNotValid:
                    setPaymentError({ ...commitBookingError, correlationId: apiError.correlationId });
                    this.validatePackage();
                    break;
                default:
                    if (!airportParkingError) {
                        this.rootStore.payStore.setPaymentErrors(apiError);
                    }
            }
        });
    };

    @action loadBookingConfirmationInfo = async (): Promise<void> => {
        this.isLoadingBookingConfirmationInfo = true;

        await this.rootStore.userStore.setUserDetails();

        const result = await bookingService.viewBooking(
            this.bookingInfoPayload.date,
            this.bookingInfoPayload.bookingReference,
            this.bookingInfoPayload.lastName,
        );

        runInAction(() => {
            if (!result.data) {
                return;
            }

            this.booking = result.data as IBookingInfo;
            this.extraLuggage.setExtraLuggageInfo(this.booking.extraLuggageInfo);
            this.rootStore.flightsPassengersStore.setPassengersStore(this.booking);

            if (this.booking.isLoggedInAsLeadPassenger) {
                const hidePromotionNames: string[] =
                    this.rootStore.layoutStore.getSetting<string[]>(SiteSettings.HideBookingsWithPromotion) ?? [];

                const hiddenPromoCodes = hidePromotionNames
                    .map(name => MAP_OFFER_PROMOTION_CODES_TO_SITE_SETTINGS[name])
                    .filter(Boolean);

                const shouldHideBooking = hiddenPromoCodes.some(code => this.booking?.promoCollections?.includes(code));

                if (!shouldHideBooking) {
                    setWebStorageItem(WebStorageKeys.LatestConfirmedBooking, this.bookingInfoPayload, sessionStorage);
                }
            }

            this.isLoadingBookingConfirmationInfo = false;
        });
    };

    // ApplePay
    @action commitApplePayBooking = async (payment: ApplePayJS.ApplePayPayment): Promise<ICommitBookingRequestBody> => {
        const { setSessionId } = this.rootStore.payStore;
        const { clearPaymentUI, setBookingReference } = this.rootStore.paymentStore;

        try {
            this.isCommittingBooking = true;

            clearPaymentUI(false);
            setTransactionProcessing();

            const transactionId = getTransactionId(this.rootStore.routerStore.search);
            const bookingBody = this.buildApplePayCommitBookingRequestBody(payment);
            const result = await bookingService.commitBooking(bookingBody, transactionId);

            setSessionId(null);
            setBookingReference(null);

            // save promoCode before clearing state
            bookingBody.discount = this.promoCode.value;

            this.handleBookingSuccess(result.data as IBookingInfo);
            await this.redirectToBookingConfirmation(bookingBody);

            return bookingBody;
        } catch (e) {
            this.handleBookingError(e as ApiError);
            runInAction(() => {
                this.isCommittingBooking = false;
            });

            throw e;
        } finally {
            if (this.rootStore.layoutStore.isTradePortal) {
                runInAction(() => {
                    this.isCommittingBooking = false;
                });
            }
        }
    };

    @computed get isFlightAndHotelPackage(): boolean {
        return containsFAndHPromoCode(this.selectedOffer?.promoCollections ?? this.booking?.promoCollections ?? []);
    }

    @action redirectToBookingConfirmation = (bookingBody: ICommitBookingRequestBody): Promise<void> | void => {
        console.log('redirectToBookingConfirmation', !this.booking);

        if (!this.booking) {
            if (!this.rootStore.layoutStore.isTradePortal) {
                this.isCommittingBooking = false;
            }

            return;
        }

        const bookingPayload = getBookingPayload(this.booking);
        const paymentInfo = bookingBody.paymentInfo;
        const paymentType = getPaymentType(
            this.rootStore.payStore.selectedPaymentType,
            this.rootStore.payStore.amountToPay,
            this.rootStore.payStore.paymentInfo.creditAmount,
        );

        if (bookingPayload.lastName) {
            const ecpSuffix = this.rootStore.queryParamsStore.isFlightPlusHotelFunnel
                ? `?${QueryParamName.ExperienceContextProvider}=${FLIGHTS_PLUS_HOTEL_PROVIDER}`
                : '';

            console.log('submit form');
            submitForm(
                `${this.rootStore.layoutStore.basePath}${SitePath.BookingConfirmation}${ecpSuffix}`,
                SubmitPayload.BookingInfo,
                {
                    ...bookingPayload,
                    billingInfo: bookingBody.paymentInfo.billingInfo,
                    promoCode: bookingBody.discount,
                    freeNightsIncluded: getFreeNightsIncludedInOffer(this.selectedOffer),
                    avail: this.availableRooms,
                    cardType: (paymentInfo as IBookingPaymentInfo).cardType ?? '',
                    paymentType,
                },
            );

            // For non-Trade Portal: keep spinner visible during page unload/navigation.
            // The finally block in commitBooking/commitApplePayBooking will never run
            // for this path, so isCommittingBooking stays true until the page navigates away.
            if (!this.rootStore.layoutStore.isTradePortal) {
                return new Promise(() => {});
            }
        }
    };

    @action
    buildApplePayCommitBookingRequestBody = (payment: ApplePayJS.ApplePayPayment): ICommitBookingRequestBody => {
        const base = this.commitBookingRequestBodyBase;
        const transactionId = getTransactionId(this.rootStore.routerStore.search);
        const billingInfo = toJS(base?.paymentInfo?.billingInfo ?? this.rootStore.payStore.billingInfo);

        if (!billingInfo?.fullName) {
            throw new Error('[ApplePay] Billing info is missing from base booking body');
        }

        // Persist card network in store. It is needed for display after booking flow completion
        const cardType =
            payment.token.paymentMethod.network.toLowerCase() === 'amex'
                ? 'AmericanExpress'
                : payment.token.paymentMethod.network;

        const newPaymentInfo = {
            billingInfo,
            transactionId,
            amount: this.rootStore.payStore.amountToPay,
            currency: this.rootStore.paymentStore.currency,
            creditAmount: this.rootStore.payStore.paymentInfo.creditAmount,
            token: payment.token,
            cardType,
            paymentType: PaymentType.ApplePay,
        };

        return {
            ...base,
            paymentInfo: newPaymentInfo as IApplePayBookingPaymentInfo,
        };
    };

    // clear promocode for current active package
    @action clearActivePromocode = (): void => {
        if (this.isRemovingPromocode) {
            return;
        }

        if (this.promoCode?.value) {
            const onEndValidation = (): void => {
                this.clearPromoCode();
                this.isRemovingPromocode = false;
            };

            this.isRemovingPromocode = true;
            this.togglePriceManipulating(true);
            this.validatePackage(undefined, true, false, onEndValidation, onEndValidation);
        }
    };

    @action setIsPaymentPriceJump = (value: boolean): void => {
        this.isPaymentPriceJump = value;
    };

    @action setPriceAfterJump = (value: number): void => {
        this.priceAfterJump = value;
    };

    @action loadRecommendedHotels = async (
        placementId: Bd4TravelPlacementId,
        cancelSource?: CancelTokenSource,
    ): Promise<void> => {
        const { layoutStore, searchStore, promoPageStore } = this.rootStore;
        const { from: promoPageFrom, to: promoPageTo } = promoPageStore;

        if (this.isLoadingRecommendedHotels) {
            await when(() => this.isLoadingRecommendedHotels);

            return;
        }

        const rooms: IQueryRoom[] = this.roomsAllocation.map(el => ({
            adults: el.adults.length,
            children: el.children.length,
            infants: el.infants.length,
            roomCode: '', // should be empty
            childrenAges: el.children.map(c => c.age),
        }));

        runInAction(() => {
            this.clearRecommendedHotels();
        });

        if (layoutStore.isMaintenance) {
            return;
        }

        let startDate = this.selectedOffer
            ? new Date(this.selectedOffer.date)
            : (this.from as Date) || (searchStore.searchWhen.from as Date);
        let endDate;
        let duration = [(this.selectedNumberOfNights || searchStore.searchWhen.selectedNumberOfNights).toString()];

        if (layoutStore.isPromoPage && this.selectedNumberOfNights === 0) {
            const promoPagesDates =
                layoutStore.isDynamicPromoPage && promoPageFrom
                    ? { startDate: promoPageFrom, endDate: promoPageTo }
                    : getPromoPageDates(layoutStore.layout, promoPageFrom, promoPageTo);

            if (promoPagesDates) {
                startDate = promoPagesDates.startDate;
                endDate = promoPagesDates.endDate;
            }

            duration = [];
        }

        try {
            this.rootStore.trackingStore.setBd4RecommenderPlacementId(placementId);

            runInAction(() => {
                this.isLoadingRecommendedHotels = true;
            });

            const isPromo = layoutStore.isPromoPage;
            const promoPageId = isPromo ? layoutStore.layoutId : undefined;
            const offers = searchStore.searchWho.isKidsGoFree ? FilterGroupCodes.FreeForKidsOnly : '';

            const recommendedOffers = await offersService.fetchRecommendedOffers(
                startDate,
                this.flexDays,
                duration,
                this.origins.join(',') || (searchStore.searchFrom.origins || []).join(','),
                this.selectedDestinationCodesQuery,
                this.isAutoAllocation,
                rooms,
                layoutStore.pageName,
                offers,
                layoutStore.isApplySpecialFilter(SiteSettings.ShowSuperDeals, this.rootStore.layoutStore.pageName),
                placementId,
                this.selectedOffer?.accom.code ?? searchStore.searchTo.selectedAccommodationCodes,
                endDate,
                cancelSource,
                isPromo,
                promoPageId,
                searchStore.selectedDestinationsQuery,
            );

            runInAction(() => {
                envAll.ENABLE_BD4_LOGGING &&
                    logger.info(`Frontend get recomended hotels: ${JSON.stringify(recommendedOffers)}`);

                this.rootStore.trackingStore.setBd4RecommenderTracking(recommendedOffers?.status?.tracking || null);
                this.recommendedHotels = recommendedOffers?.offers || null;
                !this.recommendedHotels?.length && this.rootStore.trackingStore.trackRecommenderNotLoaded();
            });
        } catch (e) {
            runInAction(() => {
                this.clearRecommendedHotels();
                envAll.ENABLE_BD4_LOGGING && logger.info(`Error while getting recomended: ${JSON.stringify(e)}`);
                this.rootStore.trackingStore.trackRecommenderNotLoaded(e?.message);
            });
        } finally {
            runInAction(() => {
                this.isLoadingRecommendedHotels = false;
            });
        }
    };

    get commitBookingRequestBody(): ICommitBookingRequestBody {
        const { payStore, airportParkingStore } = this.rootStore;
        let airportParking = {};

        if (airportParkingStore.selectedAirportParking) {
            airportParking = { airportParking: airportParkingStore.selectedAirportParking };
        }

        return {
            ...this.commitBookingRequestBodyBase,
            paymentInfo: {
                ...payStore.paymentInfo,
            },
            ...airportParking,
        } as ICommitBookingRequestBody;
    }

    payRemainingBalance = (): void => {
        if (!this.booking) {
            return;
        }

        const bookingPayload = getBookingPayload(this.booking);

        startNewTransaction(this.booking.bookingReference);
        this.rootStore.trackingStore.setPreviousPage();

        submitForm(`${this.rootStore.layoutStore.basePath}${SitePath.PayBalance}`, SubmitPayload.PayBalanceInfo, {
            ...bookingPayload,
            billingInfo: this.bookingInfoPayload?.billingInfo,
        });
    };

    isCheckInAvailable = (booking: IBookingInfo): boolean => {
        const routes = booking.package?.transport?.routes || [];
        const flightReferences = getFlightsReferences(routes);

        // Don't allow to check in if there is no flight reference
        if (flightReferences.length === 1 && !flightReferences[0]) return false;

        const depDate = routes[0]?.depDate;
        const returnDate = routes[1]?.depDate;
        const { paymentInfo } = booking;

        if (returnDate && depDate && paymentInfo?.balanceDueAmount === 0) {
            const minDaysBeforeCheckIn = this.rootStore.layoutStore.getSettingAsNumber(
                SiteSettings.CheckInButtonHideMoreThanDays,
            );
            const minTimeBeforeCheckIn = minDaysBeforeCheckIn * TIME_UNITS.millisecondsInDay;
            const now = Date.now();

            // Check-in is available if a holiday is upcoming and less then N days left before departure
            // (N - SiteSettings.CheckInButtonHideMoreThanDays)
            return (
                new Date(returnDate).getTime() > now &&
                getDateWithoutDSTOffset(depDate).getTime() - now <= minTimeBeforeCheckIn
            );
        }

        return false;
    };

    /**
     * logic to show a payment reminder on the view booking and view holiday pages (see https://jira.build.easyjet.com/browse/EJH-15400)
     */

    isPaymentReminderVisible = (booking: IBookingInfo): boolean => {
        const { balanceDueDate, balanceDueAmount, allowPayBalanceDueDate } = booking?.paymentInfo || {};
        const canPay = canPayRemainingBalance(allowPayBalanceDueDate);

        if (
            !balanceDueDate ||
            booking?.isExternalAgency ||
            booking?.bookingStatus === BookingStatus.Canceled ||
            balanceDueAmount === 0 ||
            !canPay
        ) {
            return false;
        }

        const minDaysToShowReminder =
            this.rootStore.layoutStore.getSettingAsNumber(SiteSettings.BookingPaymentReminderHideMoreThanDays) ||
            TIME_UNITS.daysInTwoWeeks;

        const minTimeBeforeShow = minDaysToShowReminder * TIME_UNITS.millisecondsInDay;

        return getDateWithoutDSTOffset(balanceDueDate).getTime() - Date.now() <= minTimeBeforeShow;
    };

    protected getAdditionalOfferParams = (): { airportParkingCode?: string } => {
        const { queryParamsStore, airportParkingStore } = this.rootStore;
        const { parkingCodeFromUrl } = queryParamsStore;

        return {
            airportParkingCode:
                parkingCodeFromUrl || airportParkingStore.selectedAirportParking?.bookingDetails.productCode,
        };
    };

    protected isAirportParkingError = (errorCode: string): boolean =>
        Object.values<string>(AIRPORT_PARKING_VALIDATION_API_ERRORS).includes(errorCode);

    protected isEveryErrorAirportParkingError = (errorCodes: string[]): boolean =>
        errorCodes.length > 0 && errorCodes.every(error => this.isAirportParkingError(error));

    protected endHandleValidatePackageException = (onError?: (e: any) => void, error?: any): void => {
        runInAction(() => {
            if (onError) {
                onError(error);
            }

            this.clearPromoCode();
        });
    };
}
