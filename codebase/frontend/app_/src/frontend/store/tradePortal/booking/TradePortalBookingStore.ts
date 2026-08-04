import { CancelTokenSource } from 'axios';
import { action, computed, makeObservable, observable, runInAction, when } from 'mobx';

import { TIME_UNITS } from 'code/dates';
import { envAll } from 'code/env';
import bookingService from 'frontend/services/booking.service';
import { logger } from 'frontend/services/logging';
import offersService from 'frontend/services/offers.service';
import BaseBookingStore, { IBaseChangeFlightsProps } from 'frontend/store/base/booking/BaseBookingStore';
import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';
import { getDateWithoutDSTOffset } from 'frontend/utils/date.utils';
import { getFreeNightsIncludedInOffer } from 'frontend/utils/freeNights.utils';
import { swapOfferAccommodations } from 'frontend/utils/offer.utils';
import {
    getTransactionId,
    setTransactionDone,
    setTransactionProcessing,
    startNewTransaction,
} from 'frontend/utils/paymentTransaction';
import { getPromoPageDates } from 'frontend/utils/promoPageDates';
import { getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import { getWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { ApiError } from 'models/data/ApiError';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { ICommitBookingRequestBody } from 'models/data/ICommitBookingRequestBody';
import { IOffer, IUnit } from 'models/data/IOffer';
import { ISpecificOfferWithAltAcc } from 'models/data/ISpecificOffer';
import { ITransfer } from 'models/data/ITransfer';
import { IValidateBookingRequestBody } from 'models/data/IValidateBookingRequestBody';
import { IPriceBreakdownItem } from 'models/data/IValidPackageInfo';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { ApiErrors } from 'models/enum/ApiErrors';
import { Bd4TravelPlacementId } from 'models/enum/Bd4TravelListId';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { QueryParamName } from 'models/enum/QueryParamName';
import SiteSettings from 'models/enum/SiteSettings';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { TransferType } from 'models/enum/transfer/TransferType';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

interface IChangeFlightsProps extends IBaseChangeFlightsProps {
    offer: IOffer;
}

export class TradePortalBookingStore extends BaseBookingStore {
    @observable isValidatingPackage: boolean = false;
    @observable isCommittingBooking: boolean = false;
    @observable isLoadingBookingConfirmationInfo: boolean = false;
    @observable isLoadingRecommendedHotels: boolean = false;
    @observable isPaymentPriceJump: boolean = false;
    @observable priceAfterJump: number = 0;

    /**
     * Replace isShownMapOnMobile observable when default Setting for showing map on mobile is added to Map Visibility Setting
     * @observable isShownMapOnMobile: boolean = !!this.rootStore.layoutStore.getSetting(SiteSettings.IsMapHiddenOnMobile);
     */
    constructor(public rootStore: TradePortalRootStore) {
        super(rootStore);

        makeObservable(this);
    }

    @computed get accomodationDiscount(): number | undefined {
        return this.selectedOffer?.accom?.unit[0].discount || undefined;
    }

    @computed get totalAccomodationDiscount(): number | undefined {
        if (!!this.selectedOffer?.accom?.unit && this.selectedOffer?.accom?.unit?.length > 1) {
            return this.selectedOffer?.accom.unit.map(a => a.discount).reduce((a = 0, b = 0) => a + b, 0) || undefined;
        }

        if (this.selectedOffer?.accom?.unit?.length == 1) {
            return this.selectedOffer?.accom.unit[0].discount;
        }

        return undefined;
    }

    @computed get tradeAgentPriceBreakdown(): Nullable<IPriceBreakdownItem[]> {
        return !(this.isPackageValid && this.packageInfo) ? undefined : this.packageInfo.tradeAgentPriceBreakdown;
    }

    protected override get isPackageValidationInProgress(): boolean {
        return this.isValidatingPackage;
    }

    protected override runPromoCodeSuccessPaymentAction = (): void => {
        this.rootStore.paymentStore.selectFullPayment();
    };

    /**
     * Sets total & pp prices
     *  for selected offer
     */

    @action changeFlight = async (props: IChangeFlightsProps): Promise<void> => {
        const {
            priceDiff,
            offer,
            isPriceGraphEventTarget = false,
            reloadOffer = true,
            rooms,
            board,
            disableLoadAlternativeFlights,
            isExt,
        } = props;
        this.isLateCheckoutRoomSelected = false;
        this.lateRoomCheckout = null;

        this.changeIsClickChangeButton(true);
        const { touristTax, touristTaxPP, taxesAndFees } = getTouristTaxFieldsFromOffer(this.selectedOffer);
        const prevRoutes = this.selectedOffer?.transport?.routes;

        const newSelectedOffer = {
            ...offer,
            touristTax,
            touristTaxPP,
            taxesAndFees,
            hotel: this.selectedOffer!.hotel,
        };

        this.selectedOffer = newSelectedOffer;
        this.notValidatedOfferPricePP = offer.pricePP;
        this.notValidatedOfferPrice = offer.price;

        const selectedTransferCode = offer.transfers?.length ? offer.transfers[0].code : '';

        if (this.selectedTransferFromUrl === selectedTransferCode) {
            this.selectedOffer!.transfers = offer.transfers;
        } else {
            this.selectedTransferFromUrl = selectedTransferCode;
        }

        this.defaultTransferFromUrl = selectedTransferCode;

        if (this.rootStore.layoutStore.isExtrasPage) {
            this.togglePriceManipulating(true);
        }

        await this.clearAncillariesAndUpdateUrl();

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
            await this.loadRecommendedHotels(Bd4TravelPlacementId.TradeHotelBook);
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
        const onFail = () => {
            this.setRoomUnavailablePopupShown(true);
            this.restoreDataFromOfferSnapshot(offerSnapshot);
        };

        await this.fetchOffer(true, true, onFail, board);

        this.rootStore.trackingStore.holidayConfigChangeTrigger(EventTypes.RoomUpdate, priceDiff);
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
        return this.validateBookingBaseRequestBody;
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
        } catch (e) {
            if (!failSilently) {
                this.rootStore.seatMapStore.setIsSelectedSeatsUnavailableError(
                    e.errorCode === ApiErrors.SelectedSeatsNotAvailable,
                );

                runInAction(() => {
                    this.isPackageValid = false;
                    this.rootStore.paymentStore.clearPaymentStore();
                });
            }

            runInAction(() => {
                if (onError) {
                    onError(e);
                }

                // clear promo code if something goes wrong
                this.clearPromoCode();
            });
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

    private createBookingBody = (): ICommitBookingRequestBody => {
        const bookingBody = this.commitBookingRequestBody;

        bookingBody.sessionId = this.rootStore.payStore.sessionId || undefined;
        bookingBody.bookingReference = this.rootStore.paymentStore.bookingReference || undefined;
        bookingBody.deviceId = this.guestsInfoPayload?.deviceId;

        return bookingBody;
    };

    @action commitBooking = async (): Promise<void> => {
        const { setSessionId } = this.rootStore.payStore;
        const { clearPaymentUI, canPay, setBookingReference } = this.rootStore.paymentStore;
        const promoCodeValue = this.promoCode.value;

        try {
            if (this.isCommittingBooking) {
                return;
            }

            if (!canPay) {
                this.rootStore.payStore.onForceErrors(true);

                return;
            }

            this.isCommittingBooking = true;
            clearPaymentUI(false);
            setTransactionProcessing();

            const transactionId = getTransactionId(this.rootStore.routerStore.search);
            const bookingBody = this.createBookingBody();
            const result = await bookingService.commitBooking(bookingBody, transactionId);

            setSessionId(null);
            setBookingReference(null);

            logger.info(`Booking committed: ${(result.data as IBookingInfo).bookingReference}`);

            runInAction(() => {
                this.booking = result.data;
                this.clearPromoCode();
                clearPaymentUI();
            });

            this.isLoadingBookingConfirmationInfo = true;

            this.rootStore.hotelsStore.clearPrefillParams();

            setTransactionDone();

            if (!this.booking) {
                return;
            }

            const bookingPayload = getBookingPayload(this.booking);

            if (bookingPayload.lastName) {
                this.bookingInfoPayload = {
                    ...bookingPayload,
                    // Pass promo code, free nights and available rooms to track this info in google analytics on Booking Confirmation
                    promoCode: promoCodeValue,
                    freeNightsIncluded: getFreeNightsIncludedInOffer(this.selectedOffer),
                    avail: this.availableRooms,
                };

                setWebStorageItem(WebStorageKeys.BookingPayload, {
                    bookingPayload: this.bookingInfoPayload,
                    accomodationDiscount: this.accomodationDiscount,
                });

                this.rootStore.routerStore.redirectToBookingConfirmationPage();
            }
        } catch (e) {
            startNewTransaction(decodeURIComponent(this.rootStore.routerStore.search), this.totalPrice);

            const data = (e as ApiError).additionalData;

            if (data != null) {
                setSessionId(data.sessionId);
                setBookingReference(data.bookingReference);
            }

            runInAction(() => {
                clearPaymentUI();

                if (e.errorCode === ApiErrors.OfferNotAvailable || this.isPriceChangeToleranceError(e)) {
                    this.isPackageValid = false;
                } else if (
                    e.errorCode === ApiErrors.CommitBookingError &&
                    e.innerErrors?.[0].code === ApiErrors.CommitBookingPriceJump
                ) {
                    this.setIsPaymentPriceJump(true);
                    this.setPriceAfterJump(Number(e.innerErrors?.[0].message ?? 0));
                } else {
                    this.isBookingFailed = true;
                }

                /** Clear promocode from storage if it was proven to be invalid */
                if (
                    e.errorCode === ApiErrors.WrongDiscount ||
                    !!(e.innerErrors || []).find(e => e.code === ApiErrors.WrongSystemDiscount)
                ) {
                    this.clearPromoCode();
                }
            });
        } finally {
            runInAction(() => {
                this.isCommittingBooking = false;
            });
        }
    };

    @action setIsBookingFailed = (value: boolean): void => {
        this.isBookingFailed = value;
    };

    @action loadBookingConfirmationInfo = async (): Promise<void> => {
        this.isLoadingBookingConfirmationInfo = true;
        const { bookingPayload, accomodationDiscount } = getWebStorageItem(WebStorageKeys.BookingPayload, true) || {};
        this.bookingInfoPayload = bookingPayload;

        if (!this.bookingInfoPayload) {
            this.rootStore.routerStore.redirectToHomePage();

            return;
        }

        try {
            const result = await bookingService.viewBooking(
                this.bookingInfoPayload.date,
                this.bookingInfoPayload.bookingReference,
                this.bookingInfoPayload.lastName,
            );

            runInAction(() => {
                // pass avail value from the initial offer for tracking urgency message in in dataLayer on Booking Confirmation
                this.selectedOffer = {
                    accom: { unit: [{ discount: accomodationDiscount, avail: bookingPayload.avail }] },
                } as any;
                this.booking = result.data as IBookingInfo;
                this.rootStore.flightsPassengersStore.setPassengersStore(this.booking);
            });
        } catch {
            runInAction(() => {
                this.setIsBookingFailed(true);
            });
        } finally {
            runInAction(() => {
                this.isLoadingBookingConfirmationInfo = false;
            });
        }
    };

    // clear promocode for current active package
    @action clearActivePromocode = (): void => {
        if (this.isRemovingPromocode) {
            return;
        }

        if (this.promoCode?.value) {
            const onEndValidation = () => {
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
        const { layoutStore, searchStore } = this.rootStore;

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
            const promoPagesDates = getPromoPageDates(layoutStore.layout);

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
                undefined,
                offers,
                layoutStore.isApplySpecialFilter(SiteSettings.ShowSuperDeals, this.rootStore.layoutStore.pageName),
                placementId,
                this.selectedOffer?.accom.code ?? searchStore.searchTo.selectedAccommodationCodes,
                endDate,
                cancelSource,
                isPromo,
                promoPageId,
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

    @action updateOfferInfo = (selectedOffer: ISpecificOfferWithAltAcc): void => {
        this.updateOfferInfoBase(selectedOffer);
    };

    get commitBookingRequestBody(): ICommitBookingRequestBody {
        return {
            ...this.commitBookingRequestBodyBase,
            paymentInfo: {
                amount: 0,
            },
        } as ICommitBookingRequestBody;
    }

    isCheckInAvailable = (booking: IBookingInfo): boolean => {
        const routes = booking.package?.transport?.routes || [];
        const depDate = routes[0]?.depDate;
        const returnDate = routes[1]?.depDate;
        const { paymentInfo } = booking;

        if (depDate && returnDate && paymentInfo?.balanceDueAmount === 0) {
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
}
