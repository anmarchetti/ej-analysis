import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import { Tokens } from 'code/tokens';
import bookingService from 'frontend/services/booking.service';
import { logger } from 'frontend/services/logging';
import {
    BaseAmendPaymentStore,
    IAmendPaymentPayload,
    PaymentOption,
    RefundPaymentMethod,
} from 'frontend/store/base/amend/BaseAmendPaymentStore';
import { IViewBookingPayload } from 'frontend/store/base/viewBooking/BaseViewBookingStore';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { cancelPaymentError, commitBookingError } from 'frontend/store/holidays/payment/payment-failures.config';
import { canPayRemainingBalance } from 'frontend/utils/date.utils';
import { isDefined } from 'frontend/utils/object.utils';
import { containsFAndHPromoCode } from 'frontend/utils/offer.utils';
import { getBrowserInfo } from 'frontend/utils/payment.utls';
import {
    getTransaction,
    getTransactionId,
    isTransactionProcessing,
    setTransactionDone,
    setTransactionProcessing,
    startNewTransaction,
} from 'frontend/utils/paymentTransaction';
import { submitForm } from 'frontend/utils/submitForm';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import { setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { AmendStoreKey } from 'models/data/AmendInfo';
import { ApiError } from 'models/data/ApiError';
import { IAmendDatesResponseItem } from 'models/data/bookingAmendment/AmendDates';
import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import { IRoomVariant } from 'models/data/bookingAmendment/AmendRoomAndBoard';
import { IAmendBookingPromoBreakDown, IAmendPaymentInfo, IAmendTransport } from 'models/data/IAmendBookingFlights';
import { IAmendBookingRequestBody } from 'models/data/IAmendBookingRequestBody';
import { TAmendTaxesAndFees } from 'models/data/IAmendTaxAndFeeItem';
import { AmendmentType, IBookingInfo, IBookingRefund } from 'models/data/IBookingInfo';
import { IPaymentGAParams } from 'models/data/IPaymentInfo';
import { ITransfer, ITransferWithAmendmentCharges } from 'models/data/ITransfer';
import { BillingInfo } from 'models/data/payment/BillingInfo';
import { IPaymentAuthorization } from 'models/data/payment/IPaymentAuthorization';
import { IThreeDSData } from 'models/data/payment/IThreeDSData';
import { AmendmentValidationErrors } from 'models/enum/amend/AmendmentValidationErrors';
import { AMEND_SEATS_UNAVAILABLE_API_ERRORS, ApiErrors } from 'models/enum/ApiErrors';
import { CreditType } from 'models/enum/CreditType';
import { PaymentType } from 'models/enum/PaymentType';
import SitePath from 'models/enum/SitePath';
import { SubmitPayload } from 'models/enum/SubmitPayload';
import { TermsAndConditionsMessageTypes } from 'models/enum/TermsAndConditionsMessageTypes';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { getAmendPaymentConfig } from 'frontend/components/renderings/AmendPayment/AmendPayment.utils';
import { IPaymentLabelsFields } from 'frontend/components/renderings/AmendPayment/interfaces';
import {
    gaApplePayButtonClickedWithoutAcceptingTermsAndConditions,
    gaBalancePaymentSuccess,
    gaRefundAmendmentsSuccess,
} from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';

import { findChosenRoomVariant } from './amendRoomAndBoard/AmendRoomAndBoardStore.utils';

export class AmendPaymentStore extends BaseAmendPaymentStore {
    @observable refundData: IBookingRefund | undefined;
    @observable isCreditRefund: boolean = true;
    @observable confirmPolicy: boolean = false;
    @observable isLoadingData: boolean = true;
    @observable isLoadingDataError: boolean = false;
    @observable paymentOption: PaymentOption = PaymentOption.Part;
    @observable isErrorPopupShown = false;
    @observable isAmendItemUnavailable: boolean = false;
    @observable selectedItemPrice?: number;
    @observable prevSelectedItemPrice?: number;
    @observable amendmentPaymentInfo?: IAmendPaymentInfo;

    constructor(public rootStore: HolidaysRootStore) {
        super(rootStore);
        makeObservable(this);
    }

    @computed get storeKey(): AmendStoreKey {
        return getAmendPaymentConfig(this.amendmentType)?.storeKey;
    }

    get totalPrice(): number {
        // Go into the relevant store and grab totalPrice
        return this.rootStore[this.storeKey]?.totalPrice ?? 0;
    }

    @computed get promocodeBreakdown(): Nullable<IAmendBookingPromoBreakDown> {
        if (this.storeKey === AmendStoreKey.Seats) {
            return null;
        }

        return this.rootStore[this.storeKey]?.promocodeBreakdown;
    }

    @computed get shouldConfirmPolicy(): boolean {
        return this.rootStore.payStore.forceFieldErrors && !this.confirmPolicy;
    }

    @computed get isOnlyCreditRefund(): boolean {
        return this.isRefund && !this.refundData?.refund?.cash && !!this.refundData?.refund?.credit;
    }

    @computed get isFromAmendFlight(): boolean {
        return !!this.amendPaymentPayload?.selectedFlight || this.rootStore.layoutStore.isAmendFlightsPage;
    }

    @computed get isFromAmendTransfer(): boolean {
        return !!this.amendPaymentPayload?.selectedTransfer || this.rootStore.layoutStore.isAmendTransfersPage;
    }

    @computed get isFromAmendRoomAndBoard(): boolean {
        return !!this.amendPaymentPayload?.amendRoomAndBoardOffer;
    }

    @computed get isFromAmendHotel(): boolean {
        return !!this.amendPaymentPayload?.amendHotelOffer;
    }

    @computed get amendmentType(): Nullable<AmendmentType> {
        if (this.isFromAmendFlight) {
            return AmendmentType.Flight;
        }

        if (this.isFromAmendTransfer) {
            return AmendmentType.Transfer;
        }

        if (this.isFromAmendRoomAndBoard) {
            return AmendmentType.RoomAndBoard;
        }

        if (this.isFromAmendDates) {
            return AmendmentType.Dates;
        }

        if (this.isFromAmendSeats) {
            return AmendmentType.Seats;
        }

        if (this.isFromAmendHotel) {
            return AmendmentType.Hotel;
        }

        return null;
    }

    @computed get canPay(): boolean {
        if (!(this.rootStore.payStore.canPay && this.confirmPolicy)) {
            return false;
        }

        if (this.totalPrice === 0) {
            return true;
        }

        // person should not be able to pay nothing when choose to pay in part (add to balance options should be checked in this case)
        if (!this.isRefund && this.paymentOption === PaymentOption.Part) {
            return this.rootStore.payStore.amount !== 0;
        }

        return true;
    }

    @computed get isFlightAndHotelPackage(): boolean {
        return containsFAndHPromoCode(this.booking?.promoCollections || []);
    }

    @computed get canRefund(): boolean {
        return this.totalPrice < 0 && !!this.refundData?.refund?.isEligible;
    }

    @computed get canCashOnlyRefund(): boolean {
        return this.canRefund && !!this.refundData?.refund?.cash && !this.refundData?.refund?.credit;
    }

    @computed get canCredit(): boolean {
        if (this.isFlightAndHotelPackage) {
            return false;
        }

        return this.totalPrice < 0 && !!this.refundData?.credit?.isEligible;
    }

    @computed get isRefund(): boolean {
        return this.totalPrice < 0;
    }

    @computed get isBalanceLessThanAmount(): boolean {
        return this.remainingToRefund > 0;
    }

    @computed get newBalanceAmount(): number {
        if (this.isRefund && this.balanceAmount) {
            return this.balanceAmount - this.amountTakenFromBalance;
        }

        return this.totalPrice - this.amountToPay + this.balanceAmount;
    }

    @computed get amountTakenFromBalance(): number {
        if (!(this.isRefund && this.balanceAmount)) {
            return 0;
        }

        const remainingBalance = this.balanceAmount - Math.abs(this.totalPrice);

        return remainingBalance < 0 ? this.balanceAmount : Math.abs(this.totalPrice);
    }

    @computed get remainingToRefund(): number {
        if (this.balanceAmount < Math.abs(this.totalPrice)) {
            return Math.abs(this.balanceAmount - Math.abs(this.totalPrice));
        }

        return 0;
    }

    /**
     * In case of remaining balance return to balance is the only option
     */
    @computed get isOnlyRefundToBalance(): boolean {
        return this.isRefund && !this.refundData;
    }

    @computed get amendPassingConditionKey(): TermsAndConditionsMessageTypes | undefined {
        if (this.totalPrice >= 0 || !this.isBalanceLessThanAmount) {
            return TermsAndConditionsMessageTypes.PayRemainingBalanceTC;
        }

        if (this.canCashOnlyRefund && !this.isCreditRefund) {
            return TermsAndConditionsMessageTypes.CashRefundOnlyTC;
        }

        if (this.canRefund || this.canCredit) {
            return TermsAndConditionsMessageTypes.CreditRefundTC;
        }

        return undefined;
    }

    @computed get hasBalance(): boolean {
        return !!this.balanceAmount;
    }

    @computed get isBalanceDueDateExpired(): boolean {
        if (this.isFlightAndHotelPackage) {
            return false; // The balance functionality is not applicable to flight and hotel packages.
        }

        return !canPayRemainingBalance(this.booking?.paymentInfo?.allowPayBalanceDueDate ?? '');
    }

    @computed get canAddToBalance(): boolean {
        if (!this.booking) {
            return false;
        }

        if (this.isPayingFeesOnly) {
            return false;
        }

        if (this.isFlightAndHotelPackage) {
            return false;
        }

        return !this.isBalanceDueDateExpired;
    }

    @computed get isPayingFeesOnly(): boolean {
        const { totalFeesAmount } = this.amendmentPaymentInfo ?? {};

        if (!totalFeesAmount || this.isRefund) {
            return false;
        }

        return totalFeesAmount >= this.totalPrice;
    }

    @computed get addToBalanceDueDate(): Date {
        if (this.isFromAmendDates && this.rootStore.amendDatesStore.offerWithPrices) {
            return new Date(this.rootStore.amendDatesStore.offerWithPrices.allowPayBalanceDueDate);
        }

        if (this.booking?.paymentInfo?.allowPayBalanceDueDate) {
            return new Date(this.booking.paymentInfo.allowPayBalanceDueDate);
        }

        return new Date();
    }

    @computed get totalPaymentAmount(): number {
        if (this.canAddToBalance || this.isPayingFeesOnly) {
            return this.totalPrice;
        }

        return this.totalPrice + this.balanceAmount;
    }

    @action onErrorPopupClose = (): void => {
        this.rootStore.routerStore.redirectToViewBookingsPage();
    };

    @action togglePolicy = (state: boolean): void => {
        this.confirmPolicy = state;
    };

    @action toggleErrorPopupVisibility = (state: boolean = false): void => {
        this.isErrorPopupShown = state;
    };

    @action validateTransfer = async (transfer: ITransferWithAmendmentCharges): Promise<ITransfer> => {
        if (!this.amendPaymentPayload) {
            throw new Error(AmendmentValidationErrors.PayloadExpected);
        }

        const result = await bookingService.validateAmendAlternativeTransfersPrice(
            this.amendPaymentPayload.bookingReference,
            [transfer.transfer],
        );

        if (!result.transfers || result.transfers[0].notAvailable === true) {
            this.isAmendItemUnavailable = true;
            throw new Error(AmendmentValidationErrors.TransferNotAvailable);
        }

        return result.transfers[0];
    };

    @action validateFlight = async (flight: IAmendTransport): Promise<any> => {
        if (!this.amendPaymentPayload) {
            throw new Error(AmendmentValidationErrors.PayloadExpected);
        }

        const transport = { transport: flight, price: flight.packagePrice, pricePP: flight.packagePricePP };
        const result = await bookingService.getAmendAlternativeFlightsWithLivePrice(
            this.amendPaymentPayload as unknown as IBookingInfo,
            [transport],
        );

        if (!result.transports.length || result.transports[0].notAvailable) {
            this.isAmendItemUnavailable = true;
            flight.notAvailable = true;

            throw new Error(AmendmentValidationErrors.FlightNotAvailable);
        }

        return result.transports[0];
    };

    @action validateRoomAndBoard = async (amendPaymentPayload: IAmendPaymentPayload): Promise<IRoomVariant> => {
        const { amendRoomAndBoardOffer, bookingReference, discountCode, isMultiroom } = amendPaymentPayload || {};
        const {
            amendRoomAndBoardStore: { loadRoomAndBoardData },
        } = this.rootStore;

        if (!amendRoomAndBoardOffer) {
            throw new Error(AmendmentValidationErrors.PayloadExpected);
        }

        //Multiroom options were validated before navigation to the payment page, and orchestrator doesn't support multiroom alternatives
        if (isMultiroom) {
            this.rootStore.amendRoomAndBoardStore.roomVariants = [amendRoomAndBoardOffer.selectedRoomVariant];

            return amendRoomAndBoardOffer.selectedRoomVariant;
        }

        await loadRoomAndBoardData();
        const { cachedRoomVariants } = this.rootStore.amendRoomAndBoardStore;

        const roomVariants = await bookingService.amendRoomAndBoardValidateOffer(
            amendRoomAndBoardOffer.selectedRoomVariant,
            cachedRoomVariants,
            bookingReference,
            discountCode,
        );

        if (!roomVariants.length) {
            this.rootStore.amendRoomAndBoardStore.setAreOptionsNotValidated(true);
            throw new Error(AmendmentValidationErrors.RoomAndBoardNotAvailable);
        }

        const chosenRoomVariant = findChosenRoomVariant(roomVariants, amendRoomAndBoardOffer.selectedRoomVariant);

        if (!chosenRoomVariant) {
            this.rootStore.amendRoomAndBoardStore.setAreOptionsNotValidated(true);
            throw new Error(AmendmentValidationErrors.RoomAndBoardNotAvailable);
        }

        return chosenRoomVariant;
    };

    @action validateHotel = async (hotelOffer: IAmendHotelOffer): Promise<Nullable<IAmendHotelOffer>> => {
        try {
            const { booking } = this.rootStore.viewBookingStore;

            if (!booking) {
                throw new Error(AmendmentValidationErrors.BookingExpected);
            }

            const { amendHotelOffer } = await bookingService.validateAlternativeAmendHotel(
                booking.bookingReference,
                hotelOffer,
            );

            // To show details for the customer behind Unavailable Popup
            return amendHotelOffer;
        } catch {
            runInAction(() => {
                this.rootStore.amendHotelStore.setIsNoAvailabilityError(true);
                this.isAmendItemUnavailable = true;
            });

            return hotelOffer;
        }
    };

    @action getAmendmentValidator = async (amendPaymentPayload: IAmendPaymentPayload) => {
        if (amendPaymentPayload.selectedTransfer) {
            return this.validateTransfer(amendPaymentPayload.selectedTransfer);
        }

        if (amendPaymentPayload.selectedFlight) {
            return this.validateFlight(amendPaymentPayload.selectedFlight);
        }

        if (amendPaymentPayload.amendRoomAndBoardOffer) {
            return this.validateRoomAndBoard(amendPaymentPayload);
        }

        if (amendPaymentPayload.amendHotelOffer) {
            return this.validateHotel(amendPaymentPayload.amendHotelOffer);
        }

        return null;
    };

    @action handleUpdatePrice = async (
        amendPaymentPayload: IAmendPaymentPayload,
        validatedAmendment,
    ): Promise<void> => {
        const {
            amendFlightsStore,
            amendTransfersStore,
            amendSeatsStore,
            amendDatesStore,
            amendRoomAndBoardStore,
            amendHotelStore,
        } = this.rootStore;

        if (amendPaymentPayload.selectedFlight) {
            amendFlightsStore.changeSelectedFlight(validatedAmendment);
            this.amendmentPaymentInfo = amendFlightsStore.selectedFlight?.amendmentPaymentInfo;
            this.prevSelectedItemPrice = amendPaymentPayload.selectedFlight.amendmentCharges;
        }

        if (amendPaymentPayload.selectedTransfer) {
            amendTransfersStore.changeSelectedTransfer(validatedAmendment);
            this.selectedItemPrice = amendTransfersStore.selectedTransfer?.amendmentCharges;
            this.prevSelectedItemPrice = amendPaymentPayload.selectedTransfer.amendmentCharges;
        }

        if (amendPaymentPayload.selectedSeats) {
            amendSeatsStore.initFromPayload();
        }

        if (amendPaymentPayload.amendDatesOffer) {
            if (!this.booking) {
                throw new Error(AmendmentValidationErrors.BookingExpected);
            }

            await amendDatesStore.initializeAmendDatesPaymentPage(this.booking, amendPaymentPayload.amendDatesOffer);
            this.prevSelectedItemPrice = amendPaymentPayload.amendDatesOffer.amendmentDatesCharges;
            this.amendmentPaymentInfo = amendDatesStore.offerWithPrices?.amendmentPaymentInfo;
        }

        if (amendPaymentPayload.amendRoomAndBoardOffer) {
            amendRoomAndBoardStore.chosenRoomVariant = validatedAmendment;
            this.amendmentPaymentInfo = validatedAmendment.amendmentPaymentInfo;
            this.prevSelectedItemPrice =
                amendPaymentPayload.amendRoomAndBoardOffer.selectedRoomVariant.fullAmendmentCharges;
        }

        if (amendPaymentPayload.amendHotelOffer) {
            amendHotelStore.newlySelectedHotelOffer = validatedAmendment;
            this.selectedItemPrice = validatedAmendment.amendmentChargesInfo.fullAmendmentCharges;
            this.prevSelectedItemPrice = amendPaymentPayload.amendHotelOffer.amendmentChargesInfo?.fullAmendmentCharges;
            this.amendmentPaymentInfo = validatedAmendment.amendmentPaymentInfo;
        }
    };

    @action getBookingAndValidateAmendment = async (amendPaymentPayload: IAmendPaymentPayload) => {
        const initRequests: Promise<any>[] = [];

        const booking = await bookingService.viewBooking(
            amendPaymentPayload.date,
            amendPaymentPayload.bookingReference,
            amendPaymentPayload.lastName,
        );

        this.rootStore.viewBookingStore.updateBookingInfo(booking?.data);

        const amendmentValidator = this.getAmendmentValidator(amendPaymentPayload);

        if (amendmentValidator) {
            initRequests.push(amendmentValidator);
        }

        if (this.rootStore.layoutStore.isCreditBookingEnabled) {
            initRequests.push(this.rootStore.payStore.getCredit());
        }

        const [validatedAmendment] = await Promise.all(initRequests);

        return { booking: booking?.data, validatedAmendment };
    };

    @action setBillingInfo = (billingInfo: BillingInfo): void => {
        this.rootStore.payStore.setBillingInfo(
            billingInfo.fullName,
            billingInfo.address,
            billingInfo.city,
            billingInfo.postCode,
            billingInfo.address2,
        );
    };

    @action handleTransaction = (bookingReference: string): void => {
        const transaction = getTransaction();

        if (isDefined(transaction) && bookingReference === transaction.q && isTransactionProcessing(transaction)) {
            this.onPay(undefined, true);

            return;
        }

        startNewTransaction(bookingReference);
    };

    @action updateAmendPaymentPayload = (
        validatedAmendment?: IAmendTransport | IRoomVariant | IAmendHotelOffer,
    ): void => {
        if (!this.amendPaymentPayload) return;

        const isFromFlight = !!this.amendPaymentPayload?.selectedFlight;
        const isFromDates =
            !!this.amendPaymentPayload?.amendDatesOffer && this.rootStore.amendDatesStore.offerWithPrices;
        const isFromRoomAndBoard =
            !!this.amendPaymentPayload?.amendRoomAndBoardOffer && !!validatedAmendment && 'units' in validatedAmendment;
        const isFromHotel =
            !!this.amendPaymentPayload?.amendHotelOffer && !!validatedAmendment && 'hotel' in validatedAmendment;

        if (isFromFlight) {
            this.amendPaymentPayload.selectedFlight = validatedAmendment as IAmendTransport;
        } else if (isFromDates) {
            this.amendPaymentPayload.amendDatesOffer = this.rootStore.amendDatesStore
                .offerWithPrices as IAmendDatesResponseItem;
        } else if (isFromRoomAndBoard) {
            this.amendPaymentPayload.amendRoomAndBoardOffer = {
                selectedRoomVariant: validatedAmendment,
            };
        } else if (isFromHotel) {
            this.amendPaymentPayload.amendHotelOffer = validatedAmendment;
        }
    };

    @action initialize = async (): Promise<void> => {
        const { payStore, routerStore, userStore } = this.rootStore;
        const { amendPaymentPayload } = this;

        payStore.clearStore();

        if (!amendPaymentPayload) {
            routerStore.redirectToHomePage();

            return;
        }

        this.setPayloadInSessionStorage();

        // if user is not logged in redirect to login page
        const isLoggedIn = await userStore.checkIfUserLoggedIn();

        if (!isLoggedIn) {
            routerStore.redirectToLoginPage(true);

            return;
        }

        this.isLoadingData = true;

        try {
            const { booking, validatedAmendment } = await this.getBookingAndValidateAmendment(amendPaymentPayload);

            runInAction(() => {
                this.booking = booking;
            });

            payStore.setCurrency(this.booking?.paymentInfo?.currency);
            await this.handleUpdatePrice(amendPaymentPayload, validatedAmendment);

            // Update the payment payload to include the validated offer to eliminate the difference in data structure between the legacy application and the micro application for analytics.
            this.updateAmendPaymentPayload(validatedAmendment);

            this.setPayloadInSessionStorage();
            const { billingInfo } = amendPaymentPayload;

            if (billingInfo) {
                this.setBillingInfo(billingInfo);
            }

            payStore.setAmount(this.totalPaymentAmount);

            this.setIsCreditRefund(true);

            if (this.isRefund) {
                await this.validateRefundAmount(amendPaymentPayload);

                if (!this.canCredit && this.canRefund) {
                    this.setIsCreditRefund(false);
                }
            }

            this.handleTransaction(amendPaymentPayload.bookingReference);
        } catch {
            runInAction(() => {
                this.isLoadingDataError = true;
            });
        } finally {
            runInAction(() => {
                this.isLoadingData = false;
            });
        }
    };

    @action setIsCreditRefund = (value: boolean): void => {
        this.isCreditRefund = value;
    };

    @action validateRefundAmount = async (amendPaymentPayload: IAmendPaymentPayload): Promise<void> => {
        let amount = Math.abs(this.totalPrice);

        if (this.balanceAmount) {
            if (!this.remainingToRefund) {
                return; // no refund
            }

            amount = this.remainingToRefund;
        }

        this.refundData = (await bookingService.validateRefundAmount(
            amendPaymentPayload.bookingReference,
            amendPaymentPayload.lastName,
            amendPaymentPayload.date,
            Math.round(amount * 100) / 100, // fix round
        )) as IBookingRefund;
    };

    @action onChangePaymentOption = (option: PaymentOption): void => {
        this.rootStore.payStore.paymentErrors = [];

        if (this.paymentOption === option) {
            return;
        }

        const { payStore } = this.rootStore;

        switch (option) {
            case PaymentOption.Full:
                payStore.setAmount(this.totalPrice + this.balanceAmount);
                break;
            case PaymentOption.Part:
                payStore.setAmount(this.totalPrice);
                break;
            case PaymentOption.AddToBalance:
                payStore.setAmount(this.amendmentPaymentInfo?.totalFeesAmount || 0);

                break;
        }

        this.paymentOption = option;
    };

    @action onForceErrors = (state: boolean): void => {
        this.rootStore.payStore.onForceErrors(state);

        if (state) {
            this.rootStore.payBalanceStore.toggleFocusAmountForPay(true);
        }
    };

    @action processPayment = async (
        bookingRequestBody: any,
        pushTrackingEvent?: (event: IPaymentGAParams) => void,
        paymentType?: PaymentType,
    ): Promise<void> => {
        const { payStore, routerStore } = this.rootStore;
        const { setPaymentAuthorization, clearCardInfo, setSessionId, clearUI, setPaymentError } = payStore;

        if (!this.amendPaymentPayload) {
            return;
        }

        try {
            runInAction(() => {
                this.isPaying = true;
            });
            clearUI(false);

            setTransactionProcessing();
            const transactionId = getTransactionId(this.amendPaymentPayload.bookingReference);
            bookingRequestBody.deviceId = transactionId;
            const result = await bookingService.amendCommitBooking(bookingRequestBody, transactionId);

            setSessionId(null);

            if ((result.data as IPaymentAuthorization).resultCode) {
                logger.info(`Payment Authorization required: ${(result.data as IPaymentAuthorization).resultCode}`);
                setPaymentAuthorization(result as any);
            } else {
                logger.info(`Booking amended: ${(result.data as IBookingInfo).bookingReference}`);

                runInAction(() => {
                    payStore.setFailedToPay(false);
                    clearUI();
                    clearCardInfo();

                    if (pushTrackingEvent) {
                        if (this.isRefund) {
                            pushTrackingEvent(gaRefundAmendmentsSuccess(this.getTypeOfRefund()));
                        } else {
                            pushTrackingEvent(
                                gaBalancePaymentSuccess(
                                    bookingRequestBody.paymentInfo,
                                    bookingRequestBody.paymentInfo.currency || result.data?.paymentInfo.currency || '',
                                    result?.data?.bookingReference,
                                    paymentType === PaymentType.ApplePay,
                                ),
                            );
                        }
                    }

                    const cardType = bookingRequestBody.paymentInfo.cardType;

                    this.goBackToViewBooking(cardType);
                });

                setTransactionDone();
            }
        } catch (e) {
            startNewTransaction(this.amendPaymentPayload.bookingReference);

            const data = (e as ApiError).additionalData;

            if (data != null) {
                setSessionId(data['sessionId']);
            }

            runInAction(() => {
                clearUI();
                payStore.setFailedToPay(true);
                const apiError = e as ApiError;

                /** Payment errors */
                if (apiError.errorCode === ApiErrors.RoutesModifyProhibited) {
                    this.goBackToPreviousPage();
                } else if (apiError.errorCode === ApiErrors.NotLeadPassengerLogged) {
                    routerStore.redirectToViewBookingsPage();

                    return;
                } else if (AMEND_SEATS_UNAVAILABLE_API_ERRORS.includes(apiError.errorCode as ApiErrors)) {
                    this.rootStore.seatMapStore.setIsSelectedSeatsUnavailableError(true);
                } else if (apiError.errorCode === ApiErrors.CommitBookingError) {
                    setPaymentError({ ...commitBookingError, correlationId: apiError.correlationId });
                } else if (apiError.errorCode === ApiErrors.CancelPaymentError) {
                    setPaymentError({ ...cancelPaymentError, correlationId: apiError.correlationId });
                } else {
                    payStore.setPaymentErrors(e);
                }

                this.toggleErrorPopupVisibility(true);
            });
        } finally {
            runInAction(() => {
                this.isPaying = false;
            });
        }
    };

    @action onPay = async (
        threeDSData?: IThreeDSData,
        force?: boolean,
        pushTrackingEvent?: (event: IPaymentGAParams) => void,
    ): Promise<void> => {
        if (this.shouldBlockPayment(force)) {
            return;
        }

        await this.processPayment(this.buildCardPaymentBody(threeDSData), pushTrackingEvent, PaymentType.Card);
    };

    @action onPayWithApplePay = async (
        applePayPayment: ApplePayJS.ApplePayPaymentAuthorizedEvent,
        pushTrackingEvent?: (event: IPaymentGAParams) => void,
    ): Promise<void> => {
        await this.processPayment(
            this.buildApplePayPaymentBody(applePayPayment),
            pushTrackingEvent,
            PaymentType.ApplePay,
        );
    };

    goBackToViewBooking = (cardType?: string, shouldOpenSeatMapWidget = false, hideAmendedSeatsPopup = false): void => {
        if (!this.booking) {
            return;
        }

        const bookingPayload = getBookingPayload(this.booking);
        const { amendDatesOffer } = this.amendPaymentPayload || {};
        const bookingDate = amendDatesOffer ? amendDatesOffer.offer.accom.date : bookingPayload.date;
        const haveSelectedSeats = !!this.rootStore.amendSeatsStore.newSelection?.length;

        const { dimension66, paymentMethod } = this.getPaymentLabels({ cardType: cardType || '' });

        const payload: IViewBookingPayload = {
            ...bookingPayload,
            date: bookingDate,
            isBackToPageClicked: true,
            shouldOpenSeatMapForced: this.rootStore.seatMapStore.shouldOpenSeatMapForced,
            dimension66: dimension66,
            paymentMethod: paymentMethod,
        };

        if (this.amendmentType !== AmendmentType.Seats) {
            payload.amendmentType = this.amendmentType;
        }

        if (!hideAmendedSeatsPopup && !shouldOpenSeatMapWidget && haveSelectedSeats) {
            payload.amendmentType = AmendmentType.Seats;
        }

        if (this.amendmentType === AmendmentType.RoomAndBoard) {
            payload.rooms = this.booking.package?.accom?.rooms;
        }

        payload.amendPaymentPayload = this.amendPaymentPayload;

        if (shouldOpenSeatMapWidget) {
            payload.shouldOpenSeatMapForced = true;
        }

        submitForm(
            `${this.rootStore.layoutStore.basePath + SitePath.ViewBooking}`,
            SubmitPayload.ViewBookingInfo,
            payload,
        );
    };

    getPaymentLabels({ cardType }: { cardType: string }): { dimension66: string; paymentMethod: Nullable<string> } {
        let dimension66: string = 'Refund';
        let paymentMethod: Nullable<string> = null;

        if (!this.isRefund) {
            const usedCredit = this.rootStore.payStore.usedCredit;

            if (usedCredit === this.totalPrice) {
                dimension66 = 'Credit';
            } else {
                const isApplePay = this.rootStore.paymentTypeStore.selectedPaymentType === PaymentType.ApplePay;
                paymentMethod = isApplePay ? `ApplePay - ${cardType}` : cardType;
                dimension66 = usedCredit > 0 ? 'Partial Credit' : 'Other';
            }
        }

        return { dimension66, paymentMethod };
    }

    goBackToPreviousPage = (byBreadcrumbs?: boolean): void => {
        this.setPayloadInSessionStorage(byBreadcrumbs);

        if (this.isFromAmendSeats) {
            this.goBackToViewBooking('', true);

            return;
        }

        const { prevPage } = getAmendPaymentConfig(this.amendmentType);

        window.open(`${this.rootStore.layoutStore.basePath + prevPage}`, '_self');
    };

    redirectFromPaymentPage = (to: SitePath): void => {
        this.setPayloadInSessionStorage();

        window.open(`${this.rootStore.layoutStore.basePath + to}`, '_self');
    };

    private setPayloadInSessionStorage(byBreadcrumbs?: boolean) {
        const bookingPayload = this.booking
            ? getBookingPayload(this.booking)
            : {
                  bookingReference: this.amendPaymentPayload?.bookingReference,
                  lastName: this.amendPaymentPayload?.lastName,
                  date: this.amendPaymentPayload?.date,
              };

        const amendRoomAndBoardOffer = this.amendPaymentPayload?.amendRoomAndBoardOffer
            ? {
                  roomVariants: this.rootStore.amendRoomAndBoardStore.roomVariants,
                  selectedRoomVariant: this.rootStore.amendRoomAndBoardStore.chosenRoomVariant,
              }
            : undefined;

        const payload = {
            ...bookingPayload,
            selectedTransfer:
                this.rootStore.amendTransfersStore.selectedTransfer || this.amendPaymentPayload?.selectedTransfer,
            selectedSeats: this.rootStore.amendSeatsStore.newSelection || this.amendPaymentPayload?.selectedSeats,
            amendDatesOffer:
                this.rootStore.amendDatesStore.offerWithPrices || this.amendPaymentPayload?.amendDatesOffer,
            amendRoomAndBoardOffer,
            amendHotelOffer:
                this.rootStore.amendHotelStore.newlySelectedHotelOffer || this.amendPaymentPayload?.amendHotelOffer,
            selectedFlight: this.rootStore.amendFlightsStore.selectedFlight || this.amendPaymentPayload?.selectedFlight,
            selectedFlightFilters: this.amendPaymentPayload?.selectedFlightFilters,
            redirectedByBreadcrumbs: byBreadcrumbs,
            isFromAmendFlight: this.isFromAmendFlight,
            isFromAmendTransfer: this.isFromAmendTransfer,
            isMultiroom: this.amendPaymentPayload?.isMultiroom,
            trackingData: this.amendPaymentPayload?.trackingData,
        };

        setWebStorageItem('amend-booking-payload', payload, sessionStorage);
    }

    private shouldBlockPayment(force?: boolean): boolean {
        if (!force && (this.isPaying || !this.canPay)) {
            if (!this.canPay) {
                this.onForceErrors(true);
            }

            return true;
        }

        return false;
    }

    public buildCardPaymentBody(threeDSData?: IThreeDSData): any {
        if (!this.amendPaymentPayload) {
            return undefined;
        }

        const paymentBody = this.buildPaymentBody();

        if (threeDSData) {
            this.addThreeDSDataToPaymentBody(paymentBody, threeDSData);
        }

        return paymentBody;
    }

    public buildApplePayPaymentBody(
        applePayPayment: ApplePayJS.ApplePayPaymentAuthorizedEvent,
    ): IAmendBookingRequestBody {
        const paymentBody: IAmendBookingRequestBody = this.buildPaymentBody();

        const cardType =
            applePayPayment.payment.token.paymentMethod.network.toLowerCase() === 'amex'
                ? 'AmericanExpress'
                : applePayPayment.payment.token.paymentMethod.network;

        paymentBody.paymentInfo = {
            billingInfo: this.rootStore.payStore.billingInfo,
            amount: this.rootStore.payStore.amountToPay,
            currency: this.rootStore.paymentStore.currency?.valueOf() ?? '',
            creditAmount: this.rootStore.payStore.paymentInfo.creditAmount,
            token: applePayPayment.payment.token,
            cardType,
            paymentType: PaymentType.ApplePay,
        };

        return paymentBody;
    }

    private buildPaymentBody(): IAmendBookingRequestBody {
        const { payStore, amendRoomAndBoardStore } = this.rootStore;
        const { selectedSeats, amendDatesOffer, amendRoomAndBoardOffer, amendHotelOffer } =
            this.amendPaymentPayload ?? {};
        const { selectedFlight } = this.rootStore.amendFlightsStore;
        const { selectedTransfer } = this.rootStore.amendTransfersStore;

        const selectedTransport =
            this.rootStore.amendFlightsStore.selectedFlight || this.rootStore.amendTransfersStore.selectedTransfer;

        const paymentBody: any = {
            browserInfo: {
                ...getBrowserInfo(this.rootStore.layoutStore.lang),
            },
            bookingReference: this.amendPaymentPayload?.bookingReference,
            lastName: this.amendPaymentPayload?.lastName,
            date: this.amendPaymentPayload?.date,
            ...this.buildPaymentInfo(),
            discountCode: selectedTransport?.promoCodeBreakDown?.promoCode,
            ...(selectedFlight && { transport: { routes: selectedFlight.routes } }),
            ...(selectedTransfer && { transfers: [selectedTransfer.transfer] }),
            ...(selectedSeats?.validatedSeatsWithPrices && { seatSelection: selectedSeats.validatedSeatsWithPrices }),
            ...(amendDatesOffer && {
                offer: amendDatesOffer.offer,
                discountCode: amendDatesOffer.promoCodeBreakDown?.promoCode,
            }),
            ...(amendRoomAndBoardOffer && {
                units: amendRoomAndBoardOffer.selectedRoomVariant.units,
                discountCode: amendRoomAndBoardStore.chosenRoomVariant?.promoCodeBreakDown?.promoCode,
            }),
            ...(amendHotelOffer && {
                amendHotelOffer,
                discountCode: amendHotelOffer.amendmentChargesInfo?.promoCodeBreakDown?.promoCode,
            }),
            sessionId: payStore.sessionId || undefined,
        };

        return paymentBody;
    }

    private buildPaymentInfo(): any {
        const { payStore } = this.rootStore;

        if (this.isRefund) {
            return {
                paymentInfo: { amount: payStore.amountToPay },
                convertType: this.isCreditRefund ? CreditType.Credit : CreditType.Refund,
            };
        }

        return {
            paymentInfo: payStore.amount === 0 ? { amount: 0 } : { ...payStore.paymentInfo },
        };
    }

    private addThreeDSDataToPaymentBody(paymentBody: any, threeDSData: IThreeDSData): any {
        const { payStore } = this.rootStore;
        const threeDSServerTransID = payStore.threeDSServerTransID || threeDSData.threeDSServerTransID;

        if (threeDSData !== null && (threeDSData.paRes || threeDSData.threeDSServerTransID)) {
            paymentBody.paymentInfo = {
                ...paymentBody.paymentInfo,
                threeDSServerTransID,
                transactionReference: threeDSData.transactionReference,
                md: threeDSData.md,
                paRes: threeDSData.paRes,
                issuerUrl: threeDSData.issuerUrl,
                challengeComplete: threeDSData.challengeComplete,
            };
            paymentBody.bookingReference = threeDSData.bookingReference;
            paymentBody.requestId = threeDSData.requestId || undefined;
            paymentBody.sessionId = threeDSData.sessionId || undefined;
        }
    }

    private getTypeOfRefund(): RefundPaymentMethod {
        if (this.isOnlyRefundToBalance) {
            return RefundPaymentMethod.Balance;
        } else if (this.canCashOnlyRefund && !this.isCreditRefund) {
            return RefundPaymentMethod.Original;
        } else if (this.isCreditRefund) {
            return RefundPaymentMethod.Credit;
        }

        return RefundPaymentMethod.Unknown;
    }

    getAmendTransportLabel = (template: string = '', labels?: IPaymentLabelsFields): string => {
        if (!template || !labels) {
            return '';
        }

        let phrase: ISitecoreField<string> | undefined;

        if (this.isFromAmendTransfer) {
            phrase = labels.TransferLabel;
        } else if (this.isFromAmendFlight) {
            phrase = labels.FlightLabel;
        } else if (this.isFromAmendSeats) {
            phrase = labels.SeatsLabel;
        } else if (this.isFromAmendDates) {
            phrase = labels.DatesLabel;
        } else if (this.isFromAmendRoomAndBoard) {
            phrase = labels.RoomAndBoardLabel;
        } else if (this.isFromAmendHotel) {
            phrase = labels.HotelLabel;
        }

        return (phrase && Tokenizer.replaceToken(template, Tokens.Transport, phrase?.value)) || '';
    };

    @computed get isProductUnavailable(): boolean {
        return (
            this.isAmendItemUnavailable ||
            this.rootStore.amendFlightsStore.isPrevSelectedFlightUnavailable ||
            this.rootStore.amendRoomAndBoardStore.areOptionsNotValidated ||
            this.rootStore.amendDatesStore.isValidatedOfferUnavailable
        );
    }

    @computed get newTaxesAndFees(): TAmendTaxesAndFees | undefined {
        if (this.isFromAmendRoomAndBoard) {
            // Multiroom amendments have a different structure for tourist tax breakdown, so we need to handle it separately
            if (this.amendPaymentPayload?.isMultiroom) {
                return this.amendPaymentPayload.amendRoomAndBoardOffer?.selectedRoomVariant?.taxesAndFees;
            }

            return this.rootStore.amendRoomAndBoardStore.chosenRoomVariant?.taxesAndFees;
        }

        if (this.isFromAmendHotel) {
            return this.rootStore.amendHotelStore.newlySelectedHotelOffer?.taxesAndFees;
        }

        if (this.isFromAmendDates) {
            return this.rootStore.amendDatesStore.offerWithPrices?.taxesAndFees;
        }

        return undefined;
    }

    @computed get newTouristTaxConverted(): number {
        return this.newTaxesAndFees?.reduce((sum, item) => sum + item.paylocalAmountConverted, 0) ?? 0;
    }

    @computed get prevTouristTax(): number {
        return this.booking?.taxesAndFees?.reduce((sum, item) => sum + item.paylocalAmountConverted, 0) ?? 0;
    }

    @computed get hasTouristTax(): boolean {
        return this.newTouristTaxConverted > 0;
    }

    formValidation = (pushTrackingEvent: (event: IPaymentGAParams) => void): boolean => {
        if (!this.confirmPolicy) {
            pushTrackingEvent(gaApplePayButtonClickedWithoutAcceptingTermsAndConditions);
        }

        if (!this.rootStore.payStore.isBillingInfoValid || !this.confirmPolicy) {
            this.onForceErrors(true);

            return false;
        }

        return true;
    };
}
