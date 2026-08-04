import { action, computed, makeObservable, observable, runInAction, toJS, when } from 'mobx';

import { CurrencyCode } from 'code/currency';
import { DATE_FORMATS, TIME_UNITS } from 'code/dates';
import bookingService from 'frontend/services/booking.service';
import { logger } from 'frontend/services/logging';
import offersService from 'frontend/services/offers.service';
import { ExtraLuggage } from 'frontend/store/base/booking/ExtraLuggage';
import { OrderCheckoutPayment } from 'frontend/store/base/tracking/sitecore/constants';
import { priceChangeToleranceError } from 'frontend/store/holidays/payment/payment-failures.config';
import { ISssrStore, TRootStore } from 'frontend/store/IStores';
import {
    addDays,
    formatDateL10n,
    formatDateToQuery,
    getDate,
    getDateWithoutDSTOffset,
    getDaysDifference,
    parseDateL10n,
} from 'frontend/utils/date.utils';
import { getNumberOfGuestsByCategory, validateChildrenAgesInRoom } from 'frontend/utils/guestsValidation';
import isBackend from 'frontend/utils/isBackend';
import isStaticPage from 'frontend/utils/isStaticPath';
import { checkIfExtrasCategoryExists } from 'frontend/utils/luggage.utils';
import {
    containsLuxuryPromoCode,
    getFirstOffer,
    replaceRoomCodeInOfferRoomsAllocation,
    swapAccommodationParams,
    swapOfferAccommodations,
} from 'frontend/utils/offer.utils';
import { getBrowserInfo } from 'frontend/utils/payment.utls';
import { getTransaction, updateTransaction } from 'frontend/utils/paymentTransaction';
import { trimPhoneNumber } from 'frontend/utils/phoneNumber.utils';
import { getFlightDigitalNumber } from 'frontend/utils/route.utils';
import { cloneRoomAllocationArray, getRoomAllocationFromUnit } from 'frontend/utils/search/search.utils';
import { generateSeatsSelectedStructure, getOfferWithPopulatedData } from 'frontend/utils/seatAndBags.utils';
import { getIsRoomAlterationNeeded } from 'frontend/utils/tracking/boardsAndRooms.utils';
import { resolveBoardBasis } from 'frontend/utils/tracking/tracking.utils';
import { isTransferHidden } from 'frontend/utils/transfer.utils';
import { buildLCBQuery, buildRoomAllocationFromOfferUnitParams } from 'frontend/utils/url.utils';
import { getWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { ApiError } from 'models/data/ApiError';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { ICommitBookingRequestBody } from 'models/data/ICommitBookingRequestBody';
import { IDisplayValue } from 'models/data/IDisplayValue';
import { ILateRoomCheckout } from 'models/data/IExtras';
import { IFeaturedFacility } from 'models/data/IFeaturedFacility';
import { IBookingGuestDetailsInfo, IGuestsInfoPayload } from 'models/data/IGuestsInfoPayload';
import { IBoardType, IHotel, IHotelHighlight, IRoomType } from 'models/data/IHotel';
import {
    IAltAccommodation,
    IAltBoard,
    IOffer,
    IOfferInfo,
    IOfferWithoutAltBoards,
    IOfferWithShortenHotelData,
    ITransferOffer,
    IUnit,
    TAllBoards,
} from 'models/data/IOffer';
import { IPaymentInfo } from 'models/data/IPaymentInfo';
import { ISinglePromotionInfo } from 'models/data/IPromocode';
import { IResortInfo } from 'models/data/IResortInfo';
import { IRoute } from 'models/data/IRoute';
import { ISearchParams } from 'models/data/ISearchOffers';
import { ISpecificOffer, ISpecificOfferWithAltAcc } from 'models/data/ISpecificOffer';
import { IPackageTaxesAndFees } from 'models/data/ITouristTax';
import { ITransfer } from 'models/data/ITransfer';
import { IValidateBookingRequestBody } from 'models/data/IValidateBookingRequestBody';
import { IPriceBreakdownItem, IValidatePackageInfo } from 'models/data/IValidPackageInfo';
import { BillingInfo } from 'models/data/payment/BillingInfo';
import { Promocode } from 'models/data/Promocode';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { ApiErrors } from 'models/enum/ApiErrors';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { PriceBreakdownCode } from 'models/enum/PriceBreakdownCode';
import { QueryParamName } from 'models/enum/QueryParamName';
import SiteSettings from 'models/enum/SiteSettings';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { TransferType } from 'models/enum/transfer/TransferType';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { GuestInfo } from 'models/GuestInfo';
import { RoomAllocation } from 'models/RoomAllocation';
import { getAdultsQuantity, getChildrenQuantity, getInfantsQuantity } from 'models/RoomAllocation.utils';

import { afterCallFetchOffer, beforeCallFetchOffer, callFetchOffer } from './BaseBookingStore.utils';
import { HoldLuggageStore } from './HoldLuggageStore';

export const FLIGHT_EXTRA_CATEGORY_CODE_CABIN_BAGS = 'CABI';
const FLIGHT_EXTRA_DEPARTURE_INDEX = 0;
const FLIGHT_EXTRA_RETURN_INDEX = 1;

export interface IOfferSnapshot {
    alternativeBoards: IAltBoard[];
    alternativeFlights: IAlternativeOffer[];
    alternativeRooms: IUnit[][];
    alternativeTransfers: ITransfer[];
    lateRoomCheckout: Nullable<ILateRoomCheckout>;
    notValidatedOfferPrice: number;
    notValidatedOfferPricePP: number;
    packageInfo: Nullable<IValidatePackageInfo>;
    previousPrice: number;
    selectedOffer: Nullable<IOfferWithoutAltBoards>;
}

export interface IBaseBookingStoreInitialState {
    // offer price ignoring the /validate-package request
    accommodationIdFromUrl: string;
    boardTypeFromUrl: string;
    bookingInfoPayload: {
        avail: number;
        bookingReference: string;
        date: string;
        lastName: string;
        billingInfo?: BillingInfo;
        promoCode?: string;
    };
    defaultTransferFromUrl: string;
    inboundFlightIdFromUrl: string;
    isExtFromUrl: boolean;
    isLateCheckoutRoomSelected: boolean;
    notValidatedOfferPrice: number;
    notValidatedOfferPricePP: number;
    outboundFlightIdFromUrl: string;
    packageIdFromUrl: string;
    selectedOffer: Nullable<IOfferWithoutAltBoards>;
    selectedTransferFromUrl: string;
    guestsInfoPayload?: IGuestsInfoPayload;
    otherRoutesFromUrl?: string[];
}

export interface IBaseChangeFlightsProps {
    priceDiff: number;
    board?: string;
    disableLoadAlternativeFlights?: boolean;
    isExt?: boolean;
    isPriceGraphEventTarget?: boolean;
    reloadOffer?: boolean;
    rooms?: IQueryRoom[];
}

interface IBookingInfoPayloadProps {
    avail: number;
    bookingReference: string;
    date: string;
    lastName: string;
    billingInfo?: BillingInfo;
    cardType?: string;
    freeNightsIncluded?: number;
    paymentInfo?: {
        currency: string;
        totalPrice: number;
    };
    paymentType?: OrderCheckoutPayment;
    promoCode?: string;
}

abstract class BaseBookingStore implements ISssrStore<IBaseBookingStoreInitialState> {
    guestsInfoPayload?: IGuestsInfoPayload;
    bookingInfoPayload: IBookingInfoPayloadProps;

    // When it's true, all api calls should be made without promocode field. (in this case UI will look like there is still promocode)
    @observable isRemovingPromocode = false;

    @observable applyingPromoCode: boolean = false;

    @observable booking: Nullable<IBookingInfo>;
    @observable selectedOffer: Nullable<IOfferWithoutAltBoards>;
    @observable previousPrice: number = 0;
    @observable notValidatedOfferPricePP: number = 0;
    @observable notValidatedOfferPrice: number = 0;
    @observable isPackageValid: Nullable<boolean>;
    @observable packageInfo: Nullable<IValidatePackageInfo>;
    @observable featuredFacilities: Nullable<IFeaturedFacility[]> = [];
    @observable resortInfo: Nullable<IResortInfo>;
    @observable hotelHighlightsInfo: Nullable<IHotelHighlight[]> = null;
    @observable transferCandidate: Nullable<ITransfer> = null;
    @observable prevTransfer: Nullable<ITransfer> = null;

    @observable isLoadingOffersAlterations: boolean = false;
    @observable isLoadingExtras: boolean = false;
    @observable alternativeTransfers: ITransfer[] = [];
    @observable lateRoomCheckout: Nullable<ILateRoomCheckout> = null;
    @observable isLoadingAlternativeFlights: boolean = false;
    @observable isRoomUnavailablePopupShown = false;
    @observable isClickChangeButton: boolean = false;
    @observable priceManipulating: boolean = false;
    @observable isTransfersHidden: boolean = false;
    @observable disableBasketAnimation = false;
    @observable selectBoardTypeError: boolean = false;
    @observable isLoadingOffer: boolean = false;
    @observable isBookingSidebarLoaded: boolean = false;

    @observable failedLoadingAlternativeFlights: boolean = false;
    @observable.ref alternativeFlights: IAlternativeOffer[] = [];
    @observable alternativeRooms: IUnit[][] = [];
    @observable recommendedHotels: Nullable<IOffer[]>;

    @observable isBookingFailed: boolean = false;
    @observable failedToLoadData: boolean = false;
    @observable failedLoadingOffersAlterations: boolean = false;
    @observable failedLoadingExtras: boolean = false;
    @observable isFlightExtrasFailed: boolean = false;
    @observable extraLuggageCategoriesExist: boolean = true;
    @observable cabinBagsCategoriesExist: boolean = true;
    @observable showInvalidLuggageInUrlPopup: boolean = false;
    @observable boardCodeError: Nullable<string>;

    // transfer vs sport equipment accommodation fails
    @observable isTransferNotAccommodatingSE: boolean = false;
    @observable isTransferRemoveSE: boolean = false;
    @observable isSERemoveTransfer: boolean = false;
    @observable isTransferRemoveLargeSE: boolean = false;
    @observable isLargeSERemoveTransfer: boolean = false;

    /**
     * Values from query params
     */
    @observable accommodationIdFromUrl: string;
    @observable outboundFlightIdFromUrl: string;
    @observable inboundFlightIdFromUrl: string;
    @observable packageIdFromUrl: string;
    @observable boardTypeFromUrl: string;
    @observable defaultTransferFromUrl: string;
    @observable selectedTransferFromUrl: string;
    @observable otherRoutesFromUrl?: string[];
    @observable isExtFromUrl: boolean;
    @observable isLateCheckoutRoomSelected: boolean = false;

    @observable alternativeBoards: IAltBoard[] = [];

    /**
     * Last actual search params
     */
    @observable public from: Date | null;
    @observable public to: Date | null;
    @observable public isMonthSearch: boolean;
    @observable public monthSearchDuration: number;
    @observable public flexDays: number;
    @observable public origins: string[];
    @observable public selectedDestinationCodesQuery: string;
    @observable public roomsAllocation: RoomAllocation[] = [new RoomAllocation()];
    @observable public selectedDestinationCodes: string[];
    @observable public isAutoAllocation: boolean;
    @observable public destinationsDisplayValue: IDisplayValue = { main: '' };

    cacheOfferPrice: Nullable<number>;
    cacheOfferPricePP: Nullable<number>;

    cacheOfferPriceExcludingTouristTax: Nullable<number>;
    cacheOfferPricePPExcludingTouristTax: Nullable<number>;

    @observable extraLuggage: ExtraLuggage;
    @observable holdLuggage: HoldLuggageStore;
    @observable promoCode: Promocode;

    // map settings
    @observable isShownDestinationMapOnDesktop: boolean = !!this.rootStore.layoutStore.getSetting(
        SiteSettings.IsDestinationMapHiddenOnDesktop,
    );

    @observable isShownMapOnDesktop: boolean = !!this.rootStore.layoutStore.getSetting(
        SiteSettings.IsMapHiddenOnDesktop,
    );

    @observable isShownDestinationMapOnMobile: boolean = false;
    @observable isShownMapOnMobile: boolean = false;

    public newBoardType?: string;

    constructor(public rootStore: TRootStore) {
        this.extraLuggage = new ExtraLuggage(rootStore);
        this.holdLuggage = new HoldLuggageStore();
        this.promoCode = new Promocode(rootStore);

        makeObservable(this);

        // get search values from search store on init
        runInAction(() => {
            this.grabSearchValuesFromSearchStore();
        });
    }

    public serialize(): IBaseBookingStoreInitialState {
        return {
            selectedOffer: toJS(this.selectedOffer),
            notValidatedOfferPricePP: this.notValidatedOfferPricePP,
            notValidatedOfferPrice: this.notValidatedOfferPrice,
            accommodationIdFromUrl: this.accommodationIdFromUrl,
            outboundFlightIdFromUrl: this.outboundFlightIdFromUrl,
            inboundFlightIdFromUrl: this.inboundFlightIdFromUrl,
            packageIdFromUrl: this.packageIdFromUrl,
            boardTypeFromUrl: this.boardTypeFromUrl,
            guestsInfoPayload: this.guestsInfoPayload,
            bookingInfoPayload: this.bookingInfoPayload,
            defaultTransferFromUrl: this.defaultTransferFromUrl,
            selectedTransferFromUrl: this.selectedTransferFromUrl,
            otherRoutesFromUrl: this.otherRoutesFromUrl,
            isExtFromUrl: this.isExtFromUrl,
            isLateCheckoutRoomSelected: this.isLateCheckoutRoomSelected,
        };
    }

    public deserialize(initialState?: IBaseBookingStoreInitialState | undefined): void {
        if (initialState) {
            this.accommodationIdFromUrl = initialState.accommodationIdFromUrl;
            this.outboundFlightIdFromUrl = initialState.outboundFlightIdFromUrl;
            this.inboundFlightIdFromUrl = initialState.inboundFlightIdFromUrl;
            this.packageIdFromUrl = initialState.packageIdFromUrl;
            this.boardTypeFromUrl = initialState.boardTypeFromUrl;
            this.guestsInfoPayload = initialState.guestsInfoPayload;
            this.bookingInfoPayload = initialState.bookingInfoPayload;
            this.selectedTransferFromUrl = initialState.selectedTransferFromUrl;
            this.otherRoutesFromUrl = initialState.otherRoutesFromUrl;
            this.defaultTransferFromUrl = initialState.defaultTransferFromUrl;
            this.isExtFromUrl = initialState.isExtFromUrl;
            this.isLateCheckoutRoomSelected = initialState.isLateCheckoutRoomSelected;
        }
    }

    @computed get outboundFlight(): IRoute | undefined {
        return this.booking?.package?.transport?.routes?.[0] ?? this.selectedOffer?.transport?.routes?.[0];
    }

    @computed get inboundFlight(): IRoute | undefined {
        return this.booking?.package?.transport?.routes?.[1] ?? this.selectedOffer?.transport?.routes?.[1];
    }

    @computed get outboundFlightNumber(): string {
        return getFlightDigitalNumber(this.outboundFlight);
    }

    @computed get availableRooms(): number {
        return this.selectedOffer?.accom?.unit[0]?.avail ?? 0;
    }

    @computed get isHolidayDataAvailable(): boolean {
        return !!(this.selectedOffer && this.isPackageValid && !this.failedToLoadData);
    }

    @computed get allAlternativeRooms(): IUnit[] {
        return toJS(this.alternativeRooms).flat();
    }

    @computed get isTransferIncluded(): boolean {
        return !!this.transfers?.length;
    }

    @computed get hotel(): Nullable<IHotel> {
        return this.selectedOffer?.hotel;
    }

    @computed get priceBreakdown(): Nullable<IPriceBreakdownItem[]> {
        if (!(this.isPackageValid && this.packageInfo)) return undefined;

        return this.packageInfo.priceBreakdown;
    }

    @computed get room(): Nullable<IRoomType> {
        return this.offerUnits[0]?.roomType || null;
    }

    @computed get boardType(): Nullable<IBoardType> {
        return this.offerUnits[0]?.boardType || null;
    }

    @computed get departureDate(): Date | null {
        return this.selectedOffer ? new Date(this.selectedOffer.date) : null;
    }

    @computed get allBoardTypes(): TAllBoards {
        let boards: TAllBoards = [];

        if (this.selectedOffer?.accom?.unit) {
            const boardTypeFormOffer = this.selectedOffer.accom?.unit
                ?.map(unit => {
                    if (!unit.boardType) return undefined;

                    return {
                        ...unit.boardType,
                        price: 0,
                        pricePP: 0,
                        isFreeBoardUpgrade: unit.isFreeBoardUpgrade,
                    };
                })
                .filter(Boolean);

            boards = boards.concat(toJS(boardTypeFormOffer) as IBoardType[]);
            boards = boards.concat(toJS(this.alternativeBoards) || []);
        }

        return boards.filter((el, idx, array) => array.findIndex(room => room.code === el.code) === idx);
    }

    @action clearBooking = (): void => {
        this.booking = undefined;
        this.rootStore.seatMapStore.clearValidatedSeats();
    };

    @action setShowInvalidLuggageInUrlPopup = (value: boolean): void => {
        this.showInvalidLuggageInUrlPopup = value;
    };

    @action setIsTransferNotAccommodatingSE = (value: boolean): void => {
        this.isTransferNotAccommodatingSE = value;
    };

    @action setIsTransferRemoveSE = (value: boolean): void => {
        this.isTransferRemoveSE = value;
    };

    @action setIsSERemoveTransfer = (value: boolean): void => {
        this.isSERemoveTransfer = value;
    };

    @action setIsTransferRemoveLargeSE = (value: boolean): void => {
        this.isTransferRemoveLargeSE = value;
    };

    @action setIsLargeSERemoveTransfer = (value: boolean): void => {
        this.isLargeSERemoveTransfer = value;
    };

    @action setBookingSidebarLoaded = (value: boolean): void => {
        this.isBookingSidebarLoaded = value;
    };

    @action clearSEAccommodationFails = (): void => {
        this.setIsTransferNotAccommodatingSE(false);
        this.setIsTransferRemoveSE(false);
        this.setIsSERemoveTransfer(false);
        this.setIsTransferRemoveLargeSE(false);
        this.setIsLargeSERemoveTransfer(false);
    };

    @action setTransferCandidate = (transfer: ITransfer | null): void => {
        this.transferCandidate = transfer;
    };

    @action setPrevTransfer = (transfer: ITransfer | null): void => {
        this.prevTransfer = transfer;
    };

    @action clearAncillariesAndUpdateUrl = async (): Promise<void> => {
        const { buildHotelDetailsQuery, emptyAncillariesParams } = this.rootStore.queryParamsStore;

        if (Object.keys(emptyAncillariesParams).length) {
            const newQuery = buildHotelDetailsQuery(undefined, emptyAncillariesParams);

            await this.rootStore.routerStore.updateCurrentPage(newQuery, true);
        }

        this.clearAncillaries();
    };

    @action clearFlightNumbersAndUpdateUrl = async (): Promise<void> => {
        const { outboundFlightNumber, inboundFlightNumber, clearFlightNumberValues } =
            this.rootStore.searchFiltersStore;

        if (outboundFlightNumber || inboundFlightNumber) {
            clearFlightNumberValues();
        }
    };

    @action clearBookingFlow = (): void => {
        this.clearSelectedOffer();
        this.notValidatedOfferPricePP = 0;
        this.notValidatedOfferPrice = 0;
        this.failedToLoadData = false;
        this.isBookingFailed = false;
        this.alternativeFlights = [];
        this.alternativeRooms = [];
        this.alternativeBoards = [];
        this.alternativeTransfers = [];
        this.lateRoomCheckout = null;
        this.accommodationIdFromUrl = '';
        this.outboundFlightIdFromUrl = '';
        this.inboundFlightIdFromUrl = '';
        this.packageIdFromUrl = '';
        this.boardTypeFromUrl = '';
        this.selectedTransferFromUrl = '';
        this.otherRoutesFromUrl = undefined;
        this.defaultTransferFromUrl = '';
        this.isExtFromUrl = false;
        this.recommendedHotels = null;
        this.isLateCheckoutRoomSelected = false;

        this.rootStore.engageStore.clearContentOrder();
        this.rootStore.guestDetailsStore.clearGuestDetails();
        this.rootStore.alternativeFlightsStore.clearStore();
        this.clearAncillaries();
        this.isFlightExtrasFailed = false;
        this.extraLuggageCategoriesExist = true;
        this.cabinBagsCategoriesExist = true;
    };

    @action clearAncillaries = (): void => {
        this.rootStore.seatMapStore.clearValidatedSeats();
        this.extraLuggage.clearExtraLuggage();
        this.rootStore.flightsPassengersStore.clearAllPassengersLCB();

        // Airport parking is only available in Holidays store. Ideally we would extract this method to the specific Booking and Trade Portal stores.
        // Many methods depend on clearAncillaries so extracting the behavior to Booking and Trade Portal stores is complex. For now, we chose to add this check.
        if ('airportParkingStore' in this.rootStore) {
            this.rootStore.airportParkingStore.clearAirportParking();
        }
    };

    @action clearPackageValidation = (): void => {
        this.isPackageValid = null;
    };

    @action resetBookingStore = (): void => {
        this.clearBookingFlow();
        this.clearPackageValidation();
    };

    @action onFetchOfferError = (failSilently: boolean): void => {
        if (failSilently) {
            return;
        }

        const { layoutStore, queryParamsStore, routerStore } = this.rootStore;

        // if we came from iframe then we should redirect to search page if no hotel found (http://jra.europe.easyjet.local/browse/EJH-6747 Scenario 3)
        if (layoutStore.isHotelDetailsBookPage && queryParamsStore.isPromotingIframe()) {
            this.resetBookingStore();
            routerStore.onClickBackButton(routerStore.backToSearchUrl);
        } else {
            this.failedToLoadData = true;
        }
    };

    @action updatePreviousPriceFormOffer = (): void => {
        this.previousPrice = this.totalPrice;
        this.packageInfo = undefined;
    };

    @computed get inboundFlightNumber(): string {
        return getFlightDigitalNumber(this.inboundFlight);
    }

    @computed protected get altAccommodations(): IAltAccommodation[] {
        return (
            (this.activeOffer?.altAcc?.length && this.activeOffer.altAcc) ||
            this.rootStore.queryParamsStore.altAccommodationsFromUrl
        );
    }

    @computed get offerUnits(): IUnit[] {
        return this.selectedOffer?.accom?.unit || [];
    }

    @computed get packageTaxesAndFees(): Nullable<IPackageTaxesAndFees[]> {
        if (!(this.isPackageValid && this.packageInfo)) {
            return undefined;
        }

        return this.packageInfo.taxesAndFees;
    }

    @computed get paymentInfo(): Nullable<IPaymentInfo> {
        if (!(this.isPackageValid && this.packageInfo)) {
            return undefined;
        }

        return this.packageInfo.paymentInfo;
    }

    get totalPrice(): number {
        const { isHotelDetailsBookPage } = this.rootStore.layoutStore;

        if (this.paymentInfo && !isHotelDetailsBookPage) {
            return this.paymentInfo.totalPrice;
        }

        return this.selectedOffer ? this.selectedOffer.priceExcludingTouristTax : 0;
    }

    @computed get flightPlusHotelDiscount(): number | undefined {
        const { isFlightPlusHotelFunnel, fphDiscountPriceFromUrl } = this.rootStore.queryParamsStore;
        const offerPrice = this.cacheOfferPriceExcludingTouristTax ?? this.selectedOffer?.priceExcludingTouristTax;
        const holidayAmount = this.packageInfo?.extraPriceBreakdown?.find(
            x => x.code === PriceBreakdownCode.Holiday,
        )?.amount;
        const priceWithoutExtras = holidayAmount ?? this.totalPrice;

        if (
            !isFlightPlusHotelFunnel ||
            !fphDiscountPriceFromUrl ||
            fphDiscountPriceFromUrl <= 0 ||
            !offerPrice ||
            offerPrice !== Math.ceil(priceWithoutExtras)
        ) {
            return undefined;
        }

        return fphDiscountPriceFromUrl;
    }

    get totalPriceWithTouristTax(): number {
        const { isHotelDetailsBookPage, isTouristTaxEnabled } = this.rootStore.layoutStore;

        if (this.paymentInfo && !isHotelDetailsBookPage) {
            return (
                this.paymentInfo.totalPrice + (isTouristTaxEnabled ? Math.ceil(this.selectedOffer?.touristTax ?? 0) : 0)
            );
        }

        if (this.selectedOffer) {
            return isTouristTaxEnabled ? this.selectedOffer.price : this.selectedOffer.priceExcludingTouristTax;
        }

        return 0;
    }

    get totalPricePP(): number {
        const { isHotelDetailsBookPage } = this.rootStore.layoutStore;

        if (this.paymentInfo && !isHotelDetailsBookPage) {
            return this.paymentInfo.pricePP;
        }

        return this.selectedOffer ? this.selectedOffer.pricePPExcludingTouristTax : 0;
    }

    get totalPricePPWithTouristTax(): number {
        const { isHotelDetailsBookPage, isTouristTaxEnabled } = this.rootStore.layoutStore;

        if (this.paymentInfo && !isHotelDetailsBookPage) {
            return (
                this.paymentInfo.pricePP + (isTouristTaxEnabled ? Math.ceil(this.selectedOffer?.touristTaxPP ?? 0) : 0)
            );
        }

        if (this.selectedOffer) {
            return isTouristTaxEnabled ? this.selectedOffer.pricePP : this.selectedOffer.pricePPExcludingTouristTax;
        }

        return 0;
    }

    /**
     * Used when user is working with particular offer,
     * but haven't selected it
     */
    @computed protected get activeOffer(): Nullable<IOfferWithoutAltBoards> {
        if (this.selectedOffer) {
            return this.selectedOffer;
        }

        const { activeOfferId, offers } = this.rootStore.hotelsStore;

        if (activeOfferId) {
            return offers.find((el: IOfferWithoutAltBoards) => el.id === activeOfferId);
        }

        return null;
    }

    // these two fields are used for the BasketPriceCell component
    // we should count total price with seats manually because seats price isn't considered
    // in the /offers request so selectedOffer doesn't contain any info about seats
    @computed get totalPriceForExtras(): number {
        const { isHotelDetailsBookPage } = this.rootStore.layoutStore;
        const { selectedSeatsPrice } = this.rootStore.seatMapStore;
        const { extraLuggagePriceTotal } = this.extraLuggage;

        if (!isHotelDetailsBookPage) {
            return this.totalPrice;
        }

        const totalPriceFromSessionStorage =
            getWebStorageItem<IOfferWithoutAltBoards>(WebStorageKeys.OriginalBooking, true, sessionStorage)?.price ?? 0;

        // when navigating between pages in the booking flow,
        // (for example, from Extras back to HD book page)
        // requests sometimes don’t complete in time,
        // and the user sees 0 on the first render instead of the actual price.
        // to avoid this, if selectedOffer is unavailable,
        // we try to retrieve the data from session storage.
        let totalPrice = this.totalPrice || totalPriceFromSessionStorage;

        if (selectedSeatsPrice) {
            totalPrice += Math.ceil(selectedSeatsPrice);
        }

        if (extraLuggagePriceTotal) {
            totalPrice += Math.ceil(extraLuggagePriceTotal);
        }

        return totalPrice;
    }

    @computed get totalPricePPForExtras(): number {
        return (
            this.totalPricePP + this.rootStore.seatMapStore.selectedSeatsPricePP + this.extraLuggage.extraLuggagePricePP
        );
    }

    @computed get isFlightExternal(): boolean {
        return (
            !!this.selectedOffer?.transport?.routes[0]?.isExt || !!this.booking?.package?.transport?.routes[0]?.isExt
        );
    }

    @action setSelectedOfferPrices = (): void => {
        if (this.selectedOffer) {
            this.selectedOffer.price = this.totalPrice;
            this.selectedOffer.pricePP = this.totalPricePP;
        }
    };

    @action clearSelectedOffer = (): void => {
        this.selectedOffer = undefined;
    };

    @action loadExtras = async (): Promise<void> => {
        if (this.isLoadingExtras) {
            await when(() => this.isLoadingExtras);

            return;
        }

        if (!this.selectedOffer || !this.rootStore.layoutStore.isExtrasPage) {
            return;
        }

        try {
            this.isLoadingExtras = true;

            const offer = this.selectedOffer || {};
            const transferOffers = {
                ...offer,
            } as ITransferOffer;
            transferOffers.hotel = null;

            if (this.defaultTransferFromUrl) {
                transferOffers.defaultTransferCode = this.defaultTransferFromUrl;
            }

            const extras = await bookingService.loadExtras(transferOffers);

            runInAction(() => {
                this.alternativeTransfers = extras.transfers;
                this.lateRoomCheckout = extras.lateRoomCheckout;
                this.failedLoadingExtras = false;
            });
        } catch (e) {
            runInAction(() => {
                this.failedLoadingExtras = true;
                this.alternativeTransfers = [];
                this.lateRoomCheckout = null;
            });
        } finally {
            runInAction(() => {
                this.isLoadingExtras = false;
            });
        }
    };

    @computed get packageId(): string {
        return this.activeOffer?.accom?.packageId || this.packageIdFromUrl;
    }

    @action loadOffersAlterations = async (offer: IOfferWithoutAltBoards): Promise<void> => {
        if (this.isLoadingOffersAlterations) {
            await when(() => this.isLoadingOffersAlterations);

            return;
        }

        try {
            this.isLoadingOffersAlterations = true;

            const { offerRoomsAllocationFromUrl } = this.rootStore.queryParamsStore;
            const offerRoomsAllocation = offerRoomsAllocationFromUrl.length
                ? offerRoomsAllocationFromUrl
                : buildRoomAllocationFromOfferUnitParams(offer.accom?.unit || []);
            const transferCode = offer.transfers?.length ? offer.transfers[0].code : '';

            const offersAlterations = await bookingService.fetchOffersAlterations(
                this.flightDate as Date,
                this.rootStore.searchStore.searchWhen.flexDays,
                (
                    this.numberOfNightsFromOffer || this.rootStore.searchStore.searchWhen.selectedNumberOfNights
                ).toString(),
                offer.transport.routes[0].depPt || (this.rootStore.searchStore.searchFrom.origins || []).join(','),
                offerRoomsAllocation,
                this.accommodationId,
                this.outboundFlightId,
                this.inboundFlightId,
                this.packageId,
                this.boardTypeCode,
                this.isExtFromUrl,
                this.altAccommodations,
                transferCode,
                this.rootStore.queryParamsStore.ecp,
            );

            if (!offersAlterations.rooms || !offersAlterations.boards) {
                throw new Error();
            }

            runInAction(() => {
                this.alternativeRooms = offersAlterations.rooms;
                this.alternativeBoards = offersAlterations.boards;
                this.failedLoadingOffersAlterations = false;
            });
        } catch (e) {
            runInAction(() => {
                this.failedLoadingOffersAlterations = true;
                this.alternativeRooms = [];
                this.alternativeBoards = [];
            });
        } finally {
            runInAction(() => {
                this.isLoadingOffersAlterations = false;
            });
        }
    };

    @action loadAdditionalData = async (disableLoadAlternativeFlights: boolean = false): Promise<void> => {
        !disableLoadAlternativeFlights && this.loadAlternativeFlights();
        this.activeOffer && this.loadOffersAlterations(this.activeOffer);
        this.loadExtras();
    };

    private get flightDate(): Date | null {
        return this.activeOffer ? getDate(this.activeOffer.date) : this.rootStore.searchStore.searchWhen.from;
    }

    @computed get selectedNumberOfNights(): number {
        if (!this.from || !this.to) {
            return 0;
        }

        if (this.isMonthSearch && this.from && this.to) {
            return this.monthSearchDuration;
        }

        return getDaysDifference(this.to, this.from);
    }

    /**
     * Will return holiday duration
     */
    @computed get numberOfNightsFromOffer(): number {
        return this.activeOffer && this.activeOffer?.stay !== this.selectedNumberOfNights
            ? this.activeOffer?.stay
            : this.selectedNumberOfNights;
    }

    @computed get accommodationId(): string {
        return this.activeOffer?.accom?.id || this.accommodationIdFromUrl;
    }

    @computed get boardTypeCode(): string {
        return this.activeOffer?.accom?.unit[0].board || this.boardTypeFromUrl;
    }

    @computed get roomsWithAllocation(): IQueryRoom[] {
        return this.activeOffer?.accom?.unit?.length
            ? buildRoomAllocationFromOfferUnitParams(this.activeOffer.accom.unit)
            : this.rootStore.queryParamsStore.offerRoomsAllocationFromUrl;
    }

    @computed get outboundFlightId(): string {
        return this.activeOffer?.transport?.routes[0].id || this.outboundFlightIdFromUrl;
    }

    @computed get inboundFlightId(): string {
        return this.activeOffer?.transport?.routes[1].id || this.inboundFlightIdFromUrl;
    }

    @computed get transfers(): Nullable<ITransfer[]> {
        return this.selectedOffer?.transfers;
    }

    @computed get transfer(): Nullable<ITransfer> {
        return this.transfers?.length ? this.transfers[0] : null;
    }

    @computed get selectedTransferCode(): Nullable<string> {
        return this.transfer?.code || '';
    }

    @computed get isExternalHotel(): boolean {
        return !!this.selectedOffer?.accom?.isExt;
    }

    @computed get isEligibleToAddSpecialRequest(): boolean {
        const { layoutStore } = this.rootStore;

        if (this.isExternalHotel === undefined) {
            return layoutStore.isSpecialRequestEnabled;
        }

        return this.isExternalHotel ? layoutStore.isEligibleToAddSSRForHBG : layoutStore.isEligibleToAddSSRForDC;
    }

    @computed get travelDate(): Date | null {
        const date = this.selectedOffer?.transport?.routes?.[0]?.depDate;

        return date ? getDateWithoutDSTOffset(date) : null;
    }

    @computed get isEnoughTimeForAddSETransfer(): boolean {
        const daysForAddSETransfer = this.rootStore.layoutStore.SEAccommodationNoticePeriod;

        if (this.selectedOffer && daysForAddSETransfer && this.travelDate) {
            const now = +new Date();
            const bookingDeparture = this.travelDate.getTime();

            if (bookingDeparture - now < daysForAddSETransfer * TIME_UNITS.millisecondsInDay) {
                return false;
            }
        }

        return true;
    }

    @action updateTransactionPrice = (): void => {
        const transaction = getTransaction();

        if (transaction && transaction.p !== this.totalPrice) {
            transaction.p = this.totalPrice;
            updateTransaction(transaction);
        }
    };

    @action updateTransfersVisibility(transfers: ITransfer[]): void {
        this.isTransfersHidden = this.isTransfersHidden || !!isTransferHidden(transfers);
    }

    @action restoreDataFromOfferSnapshot = (snapshot: IOfferSnapshot, shouldDisableAnimation?: boolean): void => {
        if (!snapshot) {
            return;
        }

        if (shouldDisableAnimation) {
            this.disableBasketAnimation = true;
        }

        this.selectedOffer = snapshot.selectedOffer;
        this.notValidatedOfferPricePP = snapshot.notValidatedOfferPricePP;
        this.notValidatedOfferPrice = snapshot.notValidatedOfferPrice;
        this.alternativeFlights = snapshot.alternativeFlights;
        this.alternativeTransfers = snapshot.alternativeTransfers;
        this.lateRoomCheckout = snapshot.lateRoomCheckout;
        this.alternativeRooms = snapshot.alternativeRooms;
        this.alternativeBoards = snapshot.alternativeBoards;
        this.packageInfo = snapshot.packageInfo;
        this.previousPrice = snapshot.previousPrice;

        if (this.selectedOffer) {
            this.updateTransfersVisibility(this.selectedOffer.transfers);
        }

        this.updateTransactionPrice();

        this.rootStore.routerStore.updateCurrentPage(this.rootStore.queryParamsStore.buildHotelDetailsQuery());

        if (shouldDisableAnimation) {
            setTimeout(
                () =>
                    runInAction(() => {
                        this.disableBasketAnimation = false;
                    }),
                TIME_UNITS.millisecondsInSecond,
            );
        }
    };

    @action loadAlternativeFlights = async ({
        alternativeDate,
        boardCode,
        rooms,
        newAccommodationId,
        saveEmptyOffers = true,
        newInboundRouteId,
        newOutboundRouteId,
    }: {
        alternativeDate?: Date;
        boardCode?: string;
        newAccommodationId?: string;
        newInboundRouteId?: string;
        newOutboundRouteId?: string;
        rooms?: IQueryRoom[];
        saveEmptyOffers?: boolean;
    } = {}): Promise<IAlternativeOffer[] | void> => {
        if (this.isLoadingAlternativeFlights) {
            await when(() => this.isLoadingAlternativeFlights === false);

            return;
        }

        let result: IAlternativeOffer[] = [];

        try {
            runInAction(() => {
                this.isLoadingAlternativeFlights = true;
            });

            const offersResult = await bookingService.loadAlternativeFlights(
                alternativeDate ? alternativeDate : (this.flightDate as Date),
                0, // should get information from search store when we will have a story for flexible flights
                (
                    this.numberOfNightsFromOffer || this.rootStore.searchStore.searchWhen.selectedNumberOfNights
                ).toString(),
                this.getOriginsWithOtherRoutes(),
                rooms ?? this.roomsWithAllocation,
                newAccommodationId || this.accommodationId,
                boardCode ?? this.boardTypeCode,
                newOutboundRouteId ?? this.outboundFlightId,
                newInboundRouteId ?? this.inboundFlightId,
                this.selectedTransferCode !== this.defaultTransferFromUrl ? this.selectedTransferCode || '' : '',
                true,
                this.outboundFlight?.depPt,
                this.rootStore.queryParamsStore.ecp,
            );

            runInAction(() => {
                result = offersResult?.offers || [];

                if (result.length || saveEmptyOffers) {
                    this.alternativeFlights = result;
                }

                this.failedLoadingAlternativeFlights = false;
            });
        } catch (e) {
            runInAction(() => {
                this.failedLoadingAlternativeFlights = true;
                this.alternativeFlights = [];
            });
        } finally {
            runInAction(() => {
                this.isLoadingAlternativeFlights = false;
            });
        }

        return result;
    };

    public createRoomAllocation = (): IQueryRoom[] =>
        this.roomsAllocation.map(el => ({
            adults: el.adults.length,
            children: el.children.length,
            infants: el.infants.length,
            roomCode: '',
            childrenAges: el.children.map(c => c.age),
        }));

    @action loadFlightExtras = async (): Promise<void> => {
        const { selectedOffer, isFlightExternal } = this;
        const { layoutStore, guestDetailsStore } = this.rootStore;
        const {
            isExtraLuggageEnabled,
            isHotelDetailsBookPage,
            isCabinBagsEnabled,
            extraLuggageCategoryCodes,
            largeCabinBagsCategoryCode,
        } = layoutStore;
        const { guestsDetails, createGuestsDetails } = guestDetailsStore;
        const { bookingExtras, setBookingExtra, setLuggagePricesAndTypes } = this.extraLuggage;

        if (
            isHotelDetailsBookPage ||
            !selectedOffer ||
            !(isExtraLuggageEnabled || isCabinBagsEnabled) ||
            !!bookingExtras?.length ||
            !isFlightExternal
        ) {
            return;
        }

        if (guestsDetails.length === 0) {
            createGuestsDetails();
        }

        try {
            const result = await bookingService.fetchBookingExtras({
                offer: selectedOffer,
                guests: guestDetailsStore.guestsDetails,
            });

            if (!checkIfExtrasCategoryExists(result, extraLuggageCategoryCodes)) {
                this.extraLuggageCategoriesExist = false;
            }

            if (!checkIfExtrasCategoryExists(result, largeCabinBagsCategoryCode)) {
                this.cabinBagsCategoriesExist = false;
            }

            if (!result.length) {
                setBookingExtra([]);
            }

            runInAction(() => {
                setBookingExtra(result);
                setLuggagePricesAndTypes();
            });
        } catch (error) {
            setBookingExtra([]);

            this.isFlightExtrasFailed = true;
        }
    };

    @action setRoomUnavailablePopupShown = (state: boolean): void => {
        this.isRoomUnavailablePopupShown = state;
    };

    @action createOfferSnapshot = (): IOfferSnapshot => ({
        selectedOffer: toJS(this.selectedOffer),
        alternativeFlights: toJS(this.alternativeFlights),
        alternativeTransfers: toJS(this.alternativeTransfers),
        lateRoomCheckout: toJS(this.lateRoomCheckout),
        alternativeRooms: toJS(this.alternativeRooms),
        alternativeBoards: toJS(this.alternativeBoards),
        packageInfo: toJS(this.packageInfo),
        previousPrice: this.previousPrice,
        notValidatedOfferPricePP: this.notValidatedOfferPricePP,
        notValidatedOfferPrice: this.notValidatedOfferPrice,
    });

    @action grabSearchValuesFromSearchStoreWithoutDestination = (): void => {
        this.from = this.rootStore.searchStore.searchWhen.from;
        this.to = this.rootStore.searchStore.searchWhen.to;
        this.isMonthSearch = this.rootStore.searchStore.searchWhen.isMonthSearch;
        this.monthSearchDuration = this.rootStore.searchStore.searchWhen.monthSearchDuration;
        this.flexDays = this.rootStore.searchStore.searchWhen.flexDays;
        this.origins = this.rootStore.searchStore.searchFrom.origins || [];
        this.isAutoAllocation = this.rootStore.searchStore.searchWho.isAutoAllocation;
        this.roomsAllocation = cloneRoomAllocationArray(
            this.rootStore.searchStore.searchWho.roomsAllocation,
            this.rootStore.layoutStore.isTradePortal,
        );
    };

    @action clearResortInfo = (): void => {
        this.resortInfo = null;
    };

    @action loadResortInfo = async (): Promise<void> => {
        const { layoutStore } = this.rootStore;

        const idToLoadResortInfo = layoutStore.isHotelDetailsBrowsePage
            ? layoutStore.accommodationOrDestinationCode
            : this.accommodationId;

        if (!idToLoadResortInfo) {
            return;
        }

        try {
            const resortInfo = await bookingService.loadResortInfo(idToLoadResortInfo);

            runInAction(() => {
                this.resortInfo = resortInfo;
            });
        } catch (e) {
            logger.info({ e, message: 'failed to load resort info' });
            this.clearResortInfo();
        }
    };

    @action clearHotelHighlightsInfo = (): void => {
        this.hotelHighlightsInfo = null;
    };

    @action loadHotelHighlightsInfo = async (): Promise<void> => {
        const idToLoadHighlightsInfo = this.accommodationId;

        if (!idToLoadHighlightsInfo) {
            return;
        }

        try {
            const highlightsInfo = await bookingService.loadHotelHighlightsInfo(idToLoadHighlightsInfo);

            runInAction(() => {
                this.hotelHighlightsInfo = highlightsInfo;
            });
        } catch (e) {
            logger.info({ 'failed to load hotel highlights': e });
            this.clearHotelHighlightsInfo();
        }
    };

    @action loadFeaturedFacilities = async (): Promise<void> => {
        if (!this.accommodationId) {
            return;
        }

        try {
            const featuredFacilities = await offersService.getFeaturedFacilities(this.accommodationId);

            runInAction(() => {
                this.featuredFacilities = featuredFacilities;
            });
        } catch (e) {
            runInAction(() => {
                this.featuredFacilities = [];
            });
        }
    };

    @action changeIsClickChangeButton = (show: boolean): boolean => (this.isClickChangeButton = show);

    @action togglePriceManipulating = (state: boolean): void => {
        this.priceManipulating = state;
    };

    @action toggleMapVisibilityOnDesktop = (state: boolean): void => {
        this.isShownMapOnDesktop = state;
    };

    @action toggleMapVisibilityOnMobile = (state: boolean): void => {
        this.isShownMapOnMobile = state;
    };

    @action toggleDestinationMapVisibilityOnDesktop = (state: boolean): void => {
        this.isShownDestinationMapOnDesktop = state;
    };

    @action toggleDestinationMapVisibilityOnMobile = (state: boolean): void => {
        this.isShownDestinationMapOnMobile = state;
    };

    addSpecialRequest = (code: string): string[] => {
        const { queryParamsStore } = this.rootStore;

        return [...queryParamsStore.specialRequests, code];
    };

    removeSpecialRequest = (code: string): string[] => {
        const { queryParamsStore } = this.rootStore;

        return queryParamsStore.specialRequests.filter(sc => sc !== code);
    };

    replaceSpecialRequest = (code: string, contradictoryCode: string): void => {
        this.updateSpecialRequestQuery([...this.removeSpecialRequest(contradictoryCode), code]);
    };

    toggleSpecialRequest = (code: string): void => {
        const { queryParamsStore } = this.rootStore;

        const specialRequests = [...queryParamsStore.specialRequests];

        const newQuery = specialRequests.includes(code)
            ? this.removeSpecialRequest(code)
            : this.addSpecialRequest(code);

        this.updateSpecialRequestQuery(newQuery);
    };

    addSpecialRequests = (codes: string[], shouldReplace = false): void => {
        const { queryParamsStore, routerStore } = this.rootStore;

        // get current special requests
        const specialRequests = shouldReplace ? [] : [...queryParamsStore.specialRequests];

        codes.forEach(code => {
            // add new special requests to codes array
            if (!specialRequests.includes(code)) {
                specialRequests.push(code);
            }
        });

        const currentQuery = { ...queryParamsStore.query };

        if (specialRequests.length) {
            // add special requests to query if there are any
            currentQuery[QueryParamName.SpecialRequests] = specialRequests.join(',');
        } else if (shouldReplace) {
            // delete special requests query param if no special requests need to be replace the current ones
            delete currentQuery[QueryParamName.SpecialRequests];
        } else {
            return;
        }

        routerStore.updateCurrentPage(queryParamsStore.stringifyQuery(currentQuery));
    };

    /**
     * update url with correct roomCode if code that comes from offer request if different from what in url (see https://jira.build.easyjet.com/browse/EJH-16445)
     */
    public updateHotelDetailsUrlIfOfferRoomChanged = async (): Promise<void> => {
        const { layoutStore, queryParamsStore, routerStore } = this.rootStore;
        const { offerRoomsAllocationFromUrl, buildHotelDetailsQuery } = queryParamsStore;

        if (
            layoutStore.isHotelDetailsBookPage &&
            offerRoomsAllocationFromUrl[0].roomCode !== this.selectedOffer?.accom?.unit?.[0]?.code
        ) {
            await routerStore.updateCurrentPage(buildHotelDetailsQuery());
        }
    };

    private updateSpecialRequestQuery = (specialRequests: string[]) => {
        const { queryParamsStore, routerStore } = this.rootStore;
        const currentQuery = { ...queryParamsStore.query };

        if (specialRequests.length) {
            currentQuery[QueryParamName.SpecialRequests] = specialRequests.join(',');
        } else {
            delete currentQuery[QueryParamName.SpecialRequests];
        }

        routerStore.updateCurrentPage(queryParamsStore.stringifyQuery(currentQuery));
    };

    @computed get isTransferNotAccommodateSE(): boolean {
        return (
            this.transfer?.smallSeSurcharge === undefined &&
            this.transfer?.largeSeSurcharge === undefined &&
            this.transfer?.type === TransferType.Shared &&
            Boolean(this.extraLuggage.sportEquipmentNumber)
        );
    }

    @computed get isTransferNotAccommodateLargeSE(): boolean {
        return (
            this.transfer?.smallSeSurcharge !== undefined &&
            this.transfer?.largeSeSurcharge === undefined &&
            this.transfer?.type === TransferType.Shared &&
            Boolean(this.extraLuggage.largeSportEquipmentNumber)
        );
    }

    protected clearSearchPriceFromUrl = async (): Promise<void> => {
        const { routerStore, queryParamsStore, layoutStore } = this.rootStore;

        if (layoutStore.isHotelDetailsBookPage && routerStore.state?.searchPrice) {
            await routerStore.updateCurrentPage(queryParamsStore.buildHotelDetailsQuery());
        }
    };

    checkSEAndTransferCorrespondence = (): void => {
        const { transfer } = this;
        const { sportEquipmentNumber, largeSportEquipmentNumber } = this.extraLuggage;

        if (!transfer || !sportEquipmentNumber) {
            return;
        }

        const { type, smallSeSurcharge, largeSeSurcharge } = transfer;

        if (type !== TransferType.NoTransfer && !this.isEnoughTimeForAddSETransfer) {
            this.setIsTransferNotAccommodatingSE(true);
        } else if (type === TransferType.Shared) {
            if (smallSeSurcharge === undefined) {
                return this.setIsTransferNotAccommodatingSE(true);
            }

            if (largeSeSurcharge === undefined && largeSportEquipmentNumber) {
                this.setIsTransferNotAccommodatingSE(true);
            }
        }
    };

    showSEAccommodationPopupIfNeeded = (
        afterAddingTransfer: boolean = false,
        prevTransfer?: ITransfer | null,
    ): void => {
        if (this.isTransferNotAccommodateSE) {
            prevTransfer && this.setPrevTransfer(prevTransfer);

            return afterAddingTransfer ? this.setIsTransferRemoveSE(true) : this.setIsSERemoveTransfer(true);
        }

        if (this.isTransferNotAccommodateLargeSE) {
            prevTransfer && this.setPrevTransfer(prevTransfer);
            afterAddingTransfer ? this.setIsTransferRemoveLargeSE(true) : this.setIsLargeSERemoveTransfer(true);
        }
    };

    @computed get alterativeFlightsDate(): string | null {
        return this.alternativeFlights.length > 0 ? this.alternativeFlights[0].date : null;
    }

    // guests validation
    @computed get isChildrenAgeValid(): boolean {
        const invalidRoom = this.roomsAllocation.find(room => !!validateChildrenAgesInRoom(room.children));

        return !invalidRoom;
    }

    @computed get isTotalGuestQuantityValid(): boolean {
        const maxNumberOfGuests = this.rootStore.searchStore.searchWho.maxNumberOfGuests;

        return this.totalGuestsQuantity <= maxNumberOfGuests;
    }

    @computed private get isGuestQuantityPerRoomValid(): boolean {
        return this.roomsAllocation.every(
            room => room.totalCount <= this.rootStore.searchStore.searchWho.maxNumberOfGuestsPerRoom,
        );
    }

    @computed get isGuestsParametersValid(): boolean {
        return this.isTotalGuestQuantityValid && this.isGuestQuantityPerRoomValid && this.isChildrenAgeValid;
    }

    @computed get currency(): CurrencyCode | undefined {
        return this.paymentInfo?.currency ?? this.selectedOffer?.currency?.code;
    }

    @computed get isAllSearchParametersSelected(): boolean {
        if (this.rootStore.layoutStore.isPromoPage) {
            return true;
        }

        return this.origins.length > 0 && !!this.selectedDestinationCodes && !!this.from && !!this.to;
    }

    @computed get isLateRoomCheckoutAvailable(): boolean {
        const { timeForLateRoomCheckout } = this.rootStore.layoutStore;

        const returnFlight = this.selectedOffer?.transport?.routes?.[1];

        if (returnFlight && timeForLateRoomCheckout && this.lateRoomCheckout) {
            const flightTime = new Date(returnFlight.depDate);

            return (
                timeForLateRoomCheckout.getHours() < flightTime.getUTCHours() ||
                (timeForLateRoomCheckout.getHours() === flightTime.getUTCHours() &&
                    timeForLateRoomCheckout.getMinutes() < flightTime.getUTCMinutes())
            );
        }

        return false;
    }

    // Search Guests quantity
    @computed get adultsQuantity(): number {
        return getAdultsQuantity(this.roomsAllocation);
    }

    @computed get childrenQuantity(): number {
        return getChildrenQuantity(this.roomsAllocation);
    }

    @computed get infantsQuantity(): number {
        return getInfantsQuantity(this.roomsAllocation);
    }

    @computed get totalGuestsQuantity(): number {
        return this.adultsQuantity + this.childrenQuantity + this.infantsQuantity;
    }

    // get current total price from local storage if we on payment page and total price is 0 or undefined
    get currentSavedPrice(): number {
        if (!!this.totalPrice || (this.totalPrice === 0 && !this.rootStore.layoutStore.isCommitBookingPage)) {
            if (this.totalPrice !== this.totalPriceForExtras) {
                return this.totalPriceForExtras;
            }

            return this.totalPrice || 0;
        }

        if (isBackend()) {
            return 0;
        }

        return getTransaction()?.p || 0;
    }

    get whoValueOnlyGuests(): string {
        const { getPhrase } = this.rootStore.layoutStore;

        return getNumberOfGuestsByCategory(getPhrase, this.adultsQuantity, this.childrenQuantity, this.infantsQuantity);
    }

    get canLoadOffer(): boolean {
        return !!(
            this.from &&
            this.selectedNumberOfNights.toString() &&
            this.origins.length > 0 &&
            this.adultsQuantity > 0 &&
            this.roomsAllocation.length > 0 &&
            this.accommodationId &&
            this.outboundFlightId &&
            this.inboundFlightId &&
            this.packageId
        );
    }

    get lastActualSearchParams(): ISearchParams {
        return {
            from: this.from,
            to: this.to,
            flexDays: this.flexDays,
            origins: this.origins,
            selectedDestinationCodesQuery: this.selectedDestinationCodesQuery,
            roomsAllocation: this.roomsAllocation,
            selectedDestinationCodes: this.selectedDestinationCodes,
            isAutoAllocation: this.isAutoAllocation,
        };
    }

    get commitBookingRequestBodyBase(): ICommitBookingRequestBody {
        const { extraLuggageInfo } = this.extraLuggage;
        const guestInfo = this.guestsInfoPayload ?? this.commitBookingGuestsInfo;
        const { leadPassenger } = guestInfo;

        const body = {
            ...this.commitBookingOfferInfo,
            leadPassenger: {
                ...leadPassenger,
                dateOfBirth: '1989-07-10',
            },
            guests: guestInfo.guests,
            seatSelection: generateSeatsSelectedStructure(this.rootStore.seatMapStore.selectedSeats),
            extraLuggageInfo,
            browserInfo: {
                ...getBrowserInfo(this.rootStore.layoutStore.lang),
            },
        } as ICommitBookingRequestBody;

        if (this.promoCode.value && !this.isRemovingPromocode) {
            body.discount = this.promoCode.value;
        }

        const { specialRequests } = this.rootStore.queryParamsStore;

        if (specialRequests.length) {
            body.specialRequests = specialRequests.join(',');
        }

        return body;
    }

    get commitBookingGuestsInfo(): IBookingGuestDetailsInfo {
        const { leadPassenger, guestsDetails } = this.rootStore.guestDetailsStore;

        const info: IBookingGuestDetailsInfo = {
            leadPassenger: leadPassenger
                ? {
                      email: leadPassenger.email || '',
                      dateOfBirth: formatDateToQuery(leadPassenger.dateOfBirthObject),
                      address: leadPassenger.address || '',
                      address2: leadPassenger.address2 || '',
                      townCity: leadPassenger.city || '',
                      postCode: leadPassenger.postCode || '',
                      phone: trimPhoneNumber(leadPassenger.phone, leadPassenger.dialingCode),
                      dialingCode: leadPassenger.dialingCode || '',
                      countryCode: leadPassenger.countryCode || '',
                  }
                : {},
            guests: guestsDetails.map(
                guest =>
                    ({
                        ...guest,
                        dateOfBirth: formatDateToQuery(guest.dateOfBirthObject),
                    } as GuestInfo),
            ),
        };

        if (this.promoCode?.value && !this.isRemovingPromocode) {
            info.promoCode = this.promoCode.value;
        } else {
            const { pageName } = this.rootStore.layoutStore;

            logger.info({ message: `${pageName}: NO PROMO CODE` });
            console.error(`${pageName}: NO PROMO CODE`);
        }

        return info;
    }

    get commitBookingOfferInfo(): IOfferInfo {
        const info = toJS({
            offer: {
                ...(this.selectedOffer || {}),
                hotel: {
                    hotelType: this.selectedOffer?.hotel?.hotelType,
                },
                defaultTransferCode: this.defaultTransferFromUrl,
            } as IOfferWithShortenHotelData,
        });

        if (info.offer?.accom?.unit) {
            info.offer.accom.hotelName = this.selectedOffer?.hotel?.name;
            info.offer.accom.unit.forEach(unit => {
                unit.boardType = {
                    code: unit.boardType.code,
                    title: unit.boardType.title,
                } as IBoardType;

                unit.roomType = {
                    code: unit.roomType.code,
                    title: unit.roomType.title,
                } as IRoomType;
            });
        }

        return info;
    }

    get validateBookingBaseRequestBody(): IValidateBookingRequestBody {
        const { guestDetailsStore, layoutStore, seatMapStore } = this.rootStore;
        const body = {
            offer: {
                ...this.selectedOffer,
                hotel: {
                    country: this.selectedOffer?.hotel?.country,
                    giataCode: this.selectedOffer?.hotel?.giataCode,
                    hotelType: this.selectedOffer?.hotel?.hotelType,
                    location: this.selectedOffer?.hotel?.location,
                    name: this.selectedOffer?.hotel?.name,
                    resort: this.selectedOffer?.hotel?.resort,
                },
                defaultTransferCode: this.defaultTransferFromUrl,
                price: this.cacheOfferPrice || this.selectedOffer?.price,
                pricePP: this.cacheOfferPricePP || this.selectedOffer?.pricePP,
                priceExcludingTouristTax:
                    this.cacheOfferPriceExcludingTouristTax || this.selectedOffer?.priceExcludingTouristTax,
                pricePPExcludingTouristTax:
                    this.cacheOfferPricePPExcludingTouristTax || this.selectedOffer?.pricePPExcludingTouristTax,
                seatSelection: undefined,
            },
            guests: guestDetailsStore.guestsDetails,
            norounding: layoutStore.isNoRoundingPage,
        } as IValidateBookingRequestBody;

        if (this.promoCode.value && !this.isRemovingPromocode) {
            body.discount = this.promoCode.value;
        }

        if (seatMapStore.selectedSeats.length) {
            body.seatSelection = generateSeatsSelectedStructure(seatMapStore.selectedSeats);
        }

        body.extraLuggageInfo = this.extraLuggage.extraLuggageInfo;

        return body;
    }

    get validateBookingRequestBody(): IValidateBookingRequestBody {
        return this.validateBookingBaseRequestBody;
    }

    // Parse promoCode from guestsInfoPayload necessary for Payment/Confirm page only
    get promoCodeFromPayload(): string | undefined {
        return this.rootStore.layoutStore.isCommitBookingPage && this.guestsInfoPayload?.promoCode
            ? this.guestsInfoPayload.promoCode
            : undefined;
    }

    get merchandisedPromotion(): ISinglePromotionInfo | undefined {
        const packagePromotion = this.packageInfo?.promotion;
        const offerPromotion = this.selectedOffer?.promotion;

        if (!offerPromotion && !packagePromotion) {
            return undefined;
        }

        if (!!this.promoCode?.value && this.packageInfo?.priceBreakdown) {
            const promotionBreakdown = this.packageInfo.priceBreakdown.find(item => item.code === 'Promotions');

            if (promotionBreakdown && offerPromotion) {
                const discountAmount = Math.abs(promotionBreakdown.amount);

                return {
                    ...offerPromotion,
                    discountAmountPerBooking: discountAmount,
                };
            }
        }

        return {
            ...offerPromotion,
            ...packagePromotion,
        } as ISinglePromotionInfo;
    }

    @action updateRoomsAllocationFromSearchStore = (): void => {
        const { roomsAllocation, isGuestsParametersValid } = this.rootStore.searchStore.searchWho;

        if (isGuestsParametersValid) {
            this.roomsAllocation = cloneRoomAllocationArray(roomsAllocation, this.rootStore.layoutStore.isTradePortal);
        }
    };

    // set values for dates without arguments will set values from queryParams
    @action updateSearchDates = (from?: Date | null | '', to?: Date | null | ''): void => {
        this.from = (from ?? this.rootStore.queryParamsStore.fromDateFromUrl) || null;
        this.to = (to ?? this.rootStore.queryParamsStore.toDateFromUrl) || null;
    };

    // set value for origins
    @action updateSearchOrigins = (origins?: string[]): void => {
        this.origins = origins || this.rootStore.queryParamsStore.originFromUrl;
    };

    // used for prevent use searchPod values that were not applied
    @action grabSearchValuesFromSearchStore = (): void => {
        this.grabSearchValuesFromSearchStoreWithoutDestination();

        this.selectedDestinationCodes = this.rootStore.searchStore.searchTo.selectedDestinationCodes;
        this.selectedDestinationCodesQuery = this.rootStore.searchStore.searchTo.selectedDestinationCodesQuery;
        this.destinationsDisplayValue = this.rootStore.searchStore.searchTo.destinationsDisplayValue;
    };

    @action updateOfferInfoBase = ({ offers, hotel, altAcc }: ISpecificOfferWithAltAcc): void => {
        // `Incorrect Sold out` fix (EJH-7091)
        const selectedOffer = offers?.[0];

        if (selectedOffer) {
            const { accom, extraLuggageInfo } = selectedOffer;

            if (accom?.packageId !== this.packageId) {
                // prevent duplicated logging messages
                logger.info(`Package Selected: ${accom.packageId}`);
            }

            selectedOffer.hotel = hotel;
            const { isSeatMapFlowEnabled, seatSelectionFromUrl, setValidatedSelectedSeats } =
                this.rootStore.seatMapStore;

            if (selectedOffer.seatSelection && isSeatMapFlowEnabled) {
                const populatedData = getOfferWithPopulatedData(selectedOffer, seatSelectionFromUrl);

                if (populatedData?.length) {
                    selectedOffer.seatSelection = populatedData;
                }

                setValidatedSelectedSeats(selectedOffer.seatSelection);
            }

            if (altAcc?.length) {
                selectedOffer.altAcc = altAcc;
            }

            if (extraLuggageInfo) {
                this.extraLuggage.setExtraLuggageInfo(extraLuggageInfo);
            }
        }

        this.updateTransfersVisibility(selectedOffer?.transfers);
        this.selectedOffer = selectedOffer || null;
        this.failedToLoadData = false;
        this.selectBoardTypeError = false;
    };

    @action setDestinationsDisplayValue = (): void => {
        this.destinationsDisplayValue = this.rootStore.searchStore.searchTo.destinationsDisplayValue;
    };

    @action setOtherRoutesValue = (value?: string[]): void => {
        this.otherRoutesFromUrl = value;
    };

    /**
     * Set search values by query string.
     * Used for opening links to SearchResults/HotelBook pages with query params
     * On default if search values already exist in store, they override query params.
     * Therefore need to force update store values by query.
     */
    @action setSearchValuesByQueryString = (query: string): void => {
        const { searchStore, queryParamsStore, searchFiltersStore } = this.rootStore;

        this.resetBookingStore();

        // Clear available codes/dates.
        searchStore.clearAvailableCodesAndDates();
        // Clear search values with noUpdate = true,
        // as availability requests should be sent after updating search values from query
        searchStore.clearSearchValues(true);

        // force set query in queryParamsStore
        queryParamsStore.parseBrowserQuery(query);

        // update search values from queryParamsStore
        searchStore.getValuesFromQueryParamsStore(true);

        // update search filters from queryParamsStore
        searchFiltersStore.onClearAllSelectedFilters();
        searchFiltersStore.getFiltersParamsFromQueryParamsStore();

        // update booking search values
        this.grabSearchValuesFromSearchStore();
    };

    /**
     * Set selectedOffer and search params by offer
     * (used for opening Hotel Book from page without search (e.g. shortlists))
     */
    @action setOfferAndSearchValues = (offer: IOffer): void => {
        const { searchStore, layoutStore } = this.rootStore;
        const { pricePP, date, stay, accom, transfers, altBoards, transport } = offer;

        this.selectedOffer = offer;
        this.notValidatedOfferPricePP = pricePP;
        this.notValidatedOfferPrice = offer.price;

        const startDate = parseDateL10n(date, DATE_FORMATS.query) as Date;
        const endDate = addDays(stay, startDate);
        const accommodationId = accom?.id;
        const transfer = transfers?.[0]?.code || '';

        this.alternativeBoards = altBoards;

        searchStore.clearSearchValues();

        this.from = startDate;
        this.to = endDate;
        this.flexDays = 0;
        this.origins = [transport.routes[0].depPt];
        this.selectedDestinationCodes = [accommodationId];
        searchStore.searchTo.setSelectedAccommodationCodes(accommodationId);
        this.selectedDestinationCodesQuery = '';
        this.isAutoAllocation = searchStore.searchWho.defaultIsAutoAllocation;
        this.roomsAllocation = (accom?.unit || []).map(u => getRoomAllocationFromUnit(layoutStore.isTradePortal, u));
        this.defaultTransferFromUrl = transfer;
        this.selectedTransferFromUrl = transfer;
    };

    @action clearRecommendedHotels = (): void => {
        this.recommendedHotels = null;
    };

    @action clearSearchParams = (): void => {
        this.from = null;
        this.to = null;
        this.isMonthSearch = false;
        this.monthSearchDuration = 0;
        this.flexDays = 0;
        this.origins = [];
        this.selectedDestinationCodes = [];
        this.isAutoAllocation = this.rootStore.searchStore.searchWho.defaultIsAutoAllocation;
        this.roomsAllocation = [];
        this.selectedDestinationCodesQuery = '';
        this.destinationsDisplayValue = { main: '' };
    };

    @action clearPromoCode = (): void => {
        this.promoCode.clear(this.packageId, this.offerUnits);
    };

    /**
     * Check if package validation is in progress.
     * Subclasses override to return true if validation is in progress.
     */
    protected get isPackageValidationInProgress(): boolean {
        return false;
    }

    /**
     * Called when promo code is successfully validated and applied.
     * Subclasses override to apply result (e.g. setCreditEnabledApiSettings).
     */
    protected applyPromoCodeValidationResult = (data: IValidatePackageInfo): void => {
        if (data) {
            return;
        }
    };

    /**
     * Called when promo code is successfully validated and applied.
     * Subclasses implement to run payment action (e.g. reselectPayment / selectFullPayment).
     */
    protected abstract runPromoCodeSuccessPaymentAction(): void;

    /**
     * Called when promo code is successfully validated and applied.
     * Subclasses override for extra cleanup (e.g. redeem store).
     */
    protected onPromoCodeErrorCleanup = (): void => {
        // hook
    };

    public abstract updateOfferInfo(o: ISpecificOfferWithAltAcc): void;
    public abstract validatePackage(
        callback?: () => void,
        disableLoader?: boolean,
        failSilently?: boolean,
        onSuccess?: () => void,
        onError?: (e: any) => void,
        isApplyingPromoCode?: boolean,
    ): Promise<void>;

    /**
     * Validate promo code.
     * Subclasses override to apply result (e.g. setCreditEnabledApiSettings).
     */
    @action validatePromoCode = async (
        onSuccess?: () => void,
        onError?: (e: any) => void,
        disableLoader = true,
    ): Promise<void> => {
        if (!disableLoader) {
            this.rootStore.appStore.setLoading(true);
        }

        if (this.isPackageValidationInProgress) {
            await when(() => !this.isPackageValidationInProgress);

            return;
        }

        runInAction(() => this.parsePromocode());

        if (this.applyingPromoCode) {
            this.applyingPromoCode = false;
        }

        try {
            this.previousPrice = this.currentSavedPrice;
            await bookingService.validatePromoCode(this.validateBookingRequestBody);

            if (this.rootStore.layoutStore.isFullMaintenance) {
                runInAction(() => {
                    this.isPackageValid = true;
                });

                return;
            }

            const result = await bookingService.validatePackage(this.validateBookingRequestBody);

            runInAction(() => {
                this.packageInfo = result.data;
                this.applyPromoCodeValidationResult(result.data);

                if (this.priceManipulating) {
                    this.previousPrice = this.totalPrice;
                }

                this.updateTransactionPrice(); // always store current price in transaction just in case
                onSuccess?.();
                this.applyingPromoCode = true;
            });
        } catch (error) {
            onError?.(error);
        } finally {
            runInAction(() => {
                this.togglePriceManipulating(false);
                this.rootStore.appStore.setLoading(false);
            });
        }
    };

    @action onApplyPromoCode = (code: string, onSuccessEvent?: () => void, onErrorEvent?: (e: any) => void): void => {
        if (!code) {
            return;
        }

        this.promoCode.value = code;

        const onSuccess = (): void => {
            this.promoCode.setInLocalStorage(this.packageId, this.offerUnits);
            this.runPromoCodeSuccessPaymentAction();
            this.rootStore.trackingStore.applyPromoCodeTrigger(true);
            onSuccessEvent?.();
        };

        const onError = (e: any): void => {
            onErrorEvent?.(e);
            this.clearPromoCode();
            this.rootStore.trackingStore.applyPromoCodeTrigger(false);
        };

        this.togglePriceManipulating(true);
        this.validatePromoCode(onSuccess, onError);
    };

    @action onErrorPromoCode = (e: ApiError): void => {
        this.promoCode.onPromocodeErrorCallback(e);
        this.onPromoCodeErrorCleanup();
    };

    @action changeBoardCodeError = (boardCode?: Nullable<string>): void => {
        this.boardCodeError = boardCode;
    };

    @action onSelectRecommendedOffer = (offer: IOffer, url: string): void => {
        let query = url.split('?')[1];

        if (!query) {
            const { transfers, date, stay, hotel, transport, accom } = offer;
            const transfer = transfers?.length ? transfers[0].code : '';
            const startDate = parseDateL10n(date, DATE_FORMATS.query) as Date;
            const endDate = addDays(stay, startDate);
            const dest = hotel?.country?.code;

            /** Add offer detail to the url params. */
            const additionalParams = {
                [QueryParamName.Transfer]: transfer,
                [QueryParamName.DefaultTransfer]: transfer,
                [QueryParamName.From]: formatDateL10n(startDate),
                [QueryParamName.To]: formatDateL10n(endDate),
                [QueryParamName.Destination]: dest,
                [QueryParamName.Geog]: dest,
                [QueryParamName.Origin]: [transport.routes[0].depPt],
                [QueryParamName.Rooms]: buildRoomAllocationFromOfferUnitParams(accom?.unit),
                [QueryParamName.SelectedSeats]: '',
            };

            query = this.rootStore.queryParamsStore.buildHotelDetailsQuery(offer, additionalParams);
        }

        this.setSearchValuesByQueryString(query);
    };

    // Try to populate empty promoCode with data from Payload or from LocalStorage
    @action parsePromocode = (): void => {
        if (this.promoCode.value) {
            return;
        }

        if (!this.promoCodeFromPayload) {
            this.promoCode.parseFromLocalStorage(this.packageId, this.offerUnits);

            return;
        }

        this.promoCode.value = this.promoCodeFromPayload;
    };

    @action getOfferParamsFromQueryParamsStore = (): void => {
        const {
            accommodationIdFromUrl,
            outboundFlightIdFromUrl,
            inboundFlightIdFromUrl,
            packageIdFromUrl,
            boardTypeFromUrl,
            selectedTransferFromUrl,
            otherRoutesFromUrl,
            defaultTransferFromUrl,
            isExtFromUrl,
            isLateRoom,
        } = this.rootStore.queryParamsStore;

        this.accommodationIdFromUrl = this.accommodationIdFromUrl || accommodationIdFromUrl;
        this.outboundFlightIdFromUrl = this.outboundFlightIdFromUrl || outboundFlightIdFromUrl;
        this.inboundFlightIdFromUrl = this.inboundFlightIdFromUrl || inboundFlightIdFromUrl;
        this.packageIdFromUrl = this.packageIdFromUrl || packageIdFromUrl;
        this.boardTypeFromUrl = this.boardTypeFromUrl || boardTypeFromUrl;
        this.selectedTransferFromUrl = this.selectedTransferFromUrl || selectedTransferFromUrl;
        this.otherRoutesFromUrl = this.otherRoutesFromUrl || otherRoutesFromUrl;
        this.defaultTransferFromUrl = this.defaultTransferFromUrl || defaultTransferFromUrl;
        this.isExtFromUrl = this.isExtFromUrl || isExtFromUrl;
        this.isLateCheckoutRoomSelected = this.isLateCheckoutRoomSelected || isLateRoom;
    };

    getOriginsWithOtherRoutes = (): string => {
        const selectedOrigins = this.origins?.length ? this.origins : this.rootStore.searchStore.searchFrom.origins;
        const otherRoutes = this.otherRoutesFromUrl ?? [];

        const combinedOrigins = new Set([...(selectedOrigins ?? []), ...otherRoutes]);

        return Array.from(combinedOrigins).join(',');
    };

    getOfferParamsFromQueryIfNeeded = (): void => {
        const areRequiredParamsDefined =
            !!this.accommodationId && !!this.outboundFlightId && !!this.inboundFlightId && !!this.packageId;

        if (!areRequiredParamsDefined) {
            this.getOfferParamsFromQueryParamsStore();
        }
    };

    handleOfferPrices = (offers: ISpecificOffer | undefined): void => {
        const firstOffer = getFirstOffer(offers);

        runInAction(() => {
            this.cacheOfferPrice = firstOffer?.price;
            this.cacheOfferPricePP = firstOffer?.pricePP;
            this.cacheOfferPriceExcludingTouristTax = firstOffer?.priceExcludingTouristTax;
            this.cacheOfferPricePPExcludingTouristTax = firstOffer?.pricePPExcludingTouristTax;
            this.notValidatedOfferPricePP = firstOffer?.pricePP || 0;
            this.notValidatedOfferPrice = firstOffer?.price || 0;
        });

        // TO DO investigate how it works
        if (isStaticPage(this.rootStore.routerStore.pathname) && firstOffer) {
            firstOffer.price = 0;
            firstOffer.pricePP = 0;
            firstOffer.priceExcludingTouristTax = 0;
            firstOffer.pricePPExcludingTouristTax = 0;
        }
    };

    isPriceChangeToleranceError = ({ errorCode, innerErrors }: ApiError): boolean => {
        if ([ApiErrors.CanNotCreateBooking, ApiErrors.CommitBookingError].includes(errorCode as ApiErrors)) {
            return (innerErrors || []).some(error => error.code === priceChangeToleranceError);
        }

        return false;
    };

    protected getAdditionalOfferParams(): { airportParkingCode?: string } {
        return {};
    }

    protected readonly loadOffer = (
        packageId: string,
        accommodationId: string,
        isExt: boolean,
        altAccommodations: IAltAccommodation[],
        boardType?: string,
        rooms?: IQueryRoom[],
    ): Promise<ISpecificOffer> | undefined => {
        if (!this.canLoadOffer) {
            return undefined;
        }

        const { queryParamsStore, searchStore, flightsPassengersStore, seatMapStore, searchFiltersStore, routerStore } =
            this.rootStore;

        const { convertExtraLuggage } = this.extraLuggage;
        const {
            offerRoomsAllocationFromUrl,
            luggageSelectionFromUrl,
            sportEquipmentSelectionFromUrl,
            outboundLCBSelectionFromUrl,
            inboundLCBSelectionFromUrl,
        } = queryParamsStore;

        const holdLuggageInfo = convertExtraLuggage(
            rooms || offerRoomsAllocationFromUrl,
            false,
            luggageSelectionFromUrl,
        );

        const sportItemsInfo = convertExtraLuggage(
            rooms || offerRoomsAllocationFromUrl,
            true,
            sportEquipmentSelectionFromUrl,
        );

        const { airportParkingCode } = this.getAdditionalOfferParams();

        const searchPrice = routerStore.state?.searchPrice ? +routerStore.state?.searchPrice : 0;

        return offersService.fetchOffer(
            this.selectedOffer ? getDate(this.selectedOffer.date) : this.from || searchStore.searchWhen.from,
            this.flexDays,
            (this.selectedNumberOfNights || searchStore.searchWhen.selectedNumberOfNights).toString(),
            this.origins.join(',') || (searchStore.searchFrom.origins || []).join(','),
            rooms || queryParamsStore.offerRoomsAllocationFromUrl,
            accommodationId,
            this.outboundFlightId,
            this.inboundFlightId,
            packageId,
            boardType || this.boardTypeCode,
            this.selectedTransferFromUrl,
            this.selectedDestinationCodesQuery,
            isExt,
            this.isLateCheckoutRoomSelected,
            altAccommodations,
            seatMapStore.selectedSeats,
            holdLuggageInfo?.adultsLuggage,
            holdLuggageInfo?.childrenLuggage,
            sportItemsInfo?.adultsLuggage,
            sportItemsInfo?.childrenLuggage,
            searchFiltersStore.hotelTypesFilters || '',
            searchPrice,
            buildLCBQuery(flightsPassengersStore.outBoundPassengers) || outboundLCBSelectionFromUrl,
            buildLCBQuery(flightsPassengersStore.inBoundPassengers) || inboundLCBSelectionFromUrl,
            airportParkingCode,
            this.rootStore.queryParamsStore.ecp,
        );
    };

    public callFetchOffer = async (
        isExt = false,
        boardType?: string,
        rooms?: IQueryRoom[],
    ): Promise<ISpecificOffer | undefined> => {
        const { layoutStore, routerStore } = this.rootStore;

        this.getOfferParamsFromQueryIfNeeded();

        const offers = await this.loadOffer(
            this.packageId,
            this.accommodationId,
            isExt,
            this.altAccommodations,
            boardType,
            rooms,
        );

        if (!offers && layoutStore.shouldRedirectToHome) {
            routerStore.redirectToHomePage();

            return;
        }

        this.handleOfferPrices(offers);

        return offers;
    };

    @action fetchNewOfferContract = async (
        packageId: string,
        accommodationId: string,
        selectedRoomIdx: number,
        newRoomCode: string,
        isExt = false,
        newBoardTypeCode?: string,
    ): Promise<IOfferWithoutAltBoards | undefined> => {
        if (this.isLoadingOffer) {
            await when(() => this.isLoadingOffer === false);

            return undefined;
        }

        try {
            this.isLoadingOffer = true;

            const rooms = replaceRoomCodeInOfferRoomsAllocation(
                this.rootStore.queryParamsStore?.offerRoomsAllocationFromUrl,
                selectedRoomIdx,
                newRoomCode,
            );

            const altAccommodations = swapAccommodationParams(
                this.altAccommodations,
                this.accommodationId,
                this.packageId,
                accommodationId,
            );

            const offers = await this.loadOffer(
                packageId,
                accommodationId,
                isExt,
                altAccommodations,
                newBoardTypeCode || this.boardTypeCode,
                rooms,
            );

            return getFirstOffer(offers);
        } catch {
            this.onFetchOfferError(true);

            return undefined;
        } finally {
            runInAction(() => {
                this.isLoadingOffer = false;
            });
        }
    };

    @computed get availableDepartureCabinBags(): number {
        return this.getAvailableCabinBags(FLIGHT_EXTRA_DEPARTURE_INDEX);
    }

    @computed get availableReturnCabinBags(): number {
        return this.getAvailableCabinBags(FLIGHT_EXTRA_RETURN_INDEX);
    }

    @action storeOriginalBooking = (): void => {
        if (!this.selectedOffer) return;

        setWebStorageItem(WebStorageKeys.OriginalBooking, this.selectedOffer, sessionStorage);
    };

    private readonly getAvailableCabinBags = (index: number): number => {
        const bookingExtras = this.extraLuggage.bookingExtras ?? [];

        const flightExtraCategories = bookingExtras[index]?.flightExtraCategories;

        if (flightExtraCategories) {
            const flightExtraCategory = flightExtraCategories.filter(
                category => category.categoryCode === FLIGHT_EXTRA_CATEGORY_CODE_CABIN_BAGS,
            );

            if (flightExtraCategory) {
                const flightExtra = flightExtraCategory.flatMap(category => category.flightExtras)?.[0];

                if (flightExtra && !isNaN(flightExtra.availableQuantity)) {
                    return flightExtra.availableQuantity;
                }
            }
        }

        return Infinity;
    };

    @computed get isLuxuryPackage(): boolean {
        return containsLuxuryPromoCode(this.selectedOffer?.promoCollections || this.booking?.promoCollections);
    }

    @computed get isNotEnoughLCBForLuxBooking(): boolean {
        const { isLuxuryPackage, cabinBagsCategoriesExist } = this.rootStore.bookingStore;
        const isLCBUnavailable =
            this.extraLuggage.isLCBFull || this.extraLuggage.isLCBAlmostFull || !cabinBagsCategoriesExist;

        return isLuxuryPackage && isLCBUnavailable;
    }

    @action onMapCardButtonClick = ({ booking, url, data }: { booking: boolean; data: IOffer; url?: string }): void => {
        if (data.accom) {
            this.rootStore.trackingStore.trackSearchProductClick(data, -1, false, true);
        }

        if (booking) {
            const {
                appStore: { isScreenExtraSmall },
                layoutStore: { isHotelDetailsBookPage },
                routerStore,
                bookingStore,
                searchStore,
            } = this.rootStore;

            if (isHotelDetailsBookPage) {
                this.updatePreviousPriceFormOffer();
                routerStore.redirectToExtrasPage();
                bookingStore.validatePackage();
            } else if (!searchStore.validateSearchParameters()) {
                this.grabSearchValuesFromSearchStore();
                searchStore.setSelectedOfferIndex(-1);
                routerStore.redirectToSearchResultsPage();
                // edge case for mobile view and HD Browse page:
                // if 'when' field isn’t filled in, the map should be closed
                // so the user can work with SP
            } else if (isScreenExtraSmall) {
                bookingStore.toggleMapVisibilityOnMobile(false);
            }
        } else {
            const { hotelsStore, routerStore } = this.rootStore;

            this.resetBookingStore();
            hotelsStore.selectSpecificOffer(undefined as any);
            routerStore.redirectTo(url as string);
        }
    };

    @action fetchOfferOnPageLoad = async (showLoadingIndicator: boolean = false): Promise<void> => {
        const { isHotelDetailsBookPage, isExtrasPage, isGuestDetailsPage: isGuestDetails } = this.rootStore.layoutStore;
        const isGuestDetailsPage = isGuestDetails && !this.selectedOffer;

        if (isHotelDetailsBookPage || isExtrasPage || isGuestDetailsPage) {
            const { appStore } = this.rootStore;
            showLoadingIndicator && appStore.setLoading(true);
            this.grabSearchValuesFromSearchStore();

            await this.fetchOffer(true);
            await this.clearSearchPriceFromUrl();

            isExtrasPage && this.checkSEAndTransferCorrespondence();
            appStore.setNavigationBooking(false);
            showLoadingIndicator && appStore.setLoading(false);
        }
    };

    @action fetchOffer = async (
        force: boolean = false,
        failSilently: boolean = false,
        onValidateFail?: () => void,
        boardType?: string,
        rooms?: IQueryRoom[],
        isExt?: boolean,
        disableLoadAlternativeFlights?: boolean,
    ): Promise<void> => {
        if (this.isLoadingOffer) {
            await when(() => !this.isLoadingOffer);

            return;
        }

        try {
            const preventStart = await beforeCallFetchOffer({ ctx: this, force });

            if (preventStart) return;

            const offer = await callFetchOffer({ ctx: this, isExt, boardType, rooms });

            const preventEnd = await afterCallFetchOffer({
                ctx: this,
                offer,
                failSilently,
                onValidateFail,
                disableLoadAlternativeFlights,
            });

            if (preventEnd) return;
        } catch (e) {
            if (e?.response?.data?.code === ApiErrors.LargeCabinBagAllowanceExceeded) {
                this.setShowInvalidLuggageInUrlPopup(true);

                return;
            }

            this.onFetchOfferError(failSilently);
        } finally {
            runInAction(() => {
                this.isLoadingOffer = false;
            });
        }
    };

    @action fetchOfferAndReloadPage = async (
        force: boolean = false,
        isChangeUrl: boolean = true,
        onFail?: () => void,
        board?: string,
        rooms?: IQueryRoom[],
        isExt?: boolean,
        disableLoadAlternativeFlights?: boolean,
    ): Promise<void> => {
        if (onFail) {
            await this.fetchOffer(force, true, onFail);
        } else {
            await this.fetchOffer(force, false, undefined, board, rooms, isExt, disableLoadAlternativeFlights);
        }

        if (!this.failedToLoadData && isChangeUrl) {
            this.rootStore.routerStore.updateCurrentPage(this.rootStore.queryParamsStore.buildHotelDetailsQuery());
        }
    };

    @action setLateRoomCheckoutToBooking = async (state: boolean): Promise<void> => {
        this.togglePriceManipulating(true);

        this.isLateCheckoutRoomSelected = state;

        await this.fetchOffer(true);

        if (!this.failedToLoadData) {
            const eventType = this.isLateCheckoutRoomSelected ? EventTypes.AddToBasket : EventTypes.RemoveFromBasket;

            this.rootStore.trackingStore.trackLateCheckoutChange(eventType);
            this.rootStore.routerStore.updateCurrentPage(
                this.rootStore.queryParamsStore.buildHotelDetailsQuery(undefined, {
                    [QueryParamName.LateRoomCheckout]: this.isLateCheckoutRoomSelected ? 1 : 0,
                }),
            );
        }
    };

    @action changeBoardType = async (boardType: string, priceDiff: number, onSuccess?: () => void): Promise<void> => {
        this.changeIsClickChangeButton(true);

        if (this.isLoadingOffer) {
            await when(() => !this.isLoadingOffer);

            return;
        }

        try {
            this.isLoadingOffer = true;

            /** Board to change */
            const board = this.allBoardTypes?.find(x => x.code === boardType);

            if (!board) {
                return;
            }

            /** Room allocation object from url */
            const rooms = this.rootStore.queryParamsStore?.offerRoomsAllocationFromUrl;

            /** Update rooms codes for alternative board if needed */
            rooms?.forEach(x => {
                x.roomCode = board?.unitCodes?.[x.roomCode] || x.roomCode;
            });

            this.selectedOffer = swapOfferAccommodations(
                this.selectedOffer,
                this.altAccommodations,
                board.accommodationId,
                board.packageId,
            );

            if (this.selectedOffer) {
                this.selectedOffer.accom.isExt = board.isExt || false;
            }

            /** Change board type based on new board and new room codes */
            const offer = await this.callFetchOffer(board.isExt, boardType, rooms);

            if (!offer) {
                return;
            }

            this.newBoardType = boardType;
            /** Set altAcc to the incoming offer: bug FIX of https://jira.build.easyjet.com/browse/EDI-189 */
            this.updateOfferInfo({ ...offer, altAcc: toJS(this.altAccommodations) });
            this.changeBoardCodeError();
            this.newBoardType = undefined;

            // Await complete router change and only then validate packages
            await this.rootStore.routerStore.updateCurrentPage(
                this.rootStore.queryParamsStore.buildHotelDetailsQuery(),
            );

            if (this.rootStore.layoutStore.isExtrasPage && this.hotel) {
                this.togglePriceManipulating(true);
                await this.validatePackage();
                runInAction(() => this.setSelectedOfferPrices());
            }

            this.rootStore.trackingStore.holidayConfigChangeTrigger(EventTypes.BoardBasisUpdate, priceDiff);
            this.rootStore.engageStore.sendCustomEvent('BOARD_BASIS_BOOK_FLOW_CHANGE', {
                boardBasis: resolveBoardBasis(
                    board.code,
                    this.rootStore.searchFiltersStore.filters.find(f => f.code === FilterGroupCodes.BoardType)
                        ?.options || [],
                ),
            });

            if (board.roomAlterations && getIsRoomAlterationNeeded(board.roomAlterations)) {
                this.rootStore.trackingStore.holidayConfigChangeTrigger(EventTypes.RoomUpdate, priceDiff);
            }

            await this.loadAdditionalData();
            onSuccess?.();
        } catch {
            runInAction(() => {
                this.selectBoardTypeError = true;
                this.changeBoardCodeError(boardType);
            });
        } finally {
            runInAction(() => {
                this.isLoadingOffer = false;
            });
        }
    };

    addExtrasToPrice = (price: number): number => {
        if (!this.rootStore.layoutStore.isHotelDetailsBookPage) {
            return price;
        }

        return (
            price +
            Math.ceil(this.rootStore.seatMapStore.selectedSeatsPrice) +
            Math.ceil(this.extraLuggage.extraLuggagePriceTotal)
        );
    };
}

export default BaseBookingStore;
