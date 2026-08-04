import Axios, { CancelTokenSource } from 'axios';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import bookingService from 'frontend/services/booking.service';
import { FLIGHTS_PLUS_HOTEL_PROVIDER } from 'frontend/store/base/queryParams/constants';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { getAmendmentRoundedPrice } from 'frontend/utils/amendBooking.utils';
import { hasIntersection } from 'frontend/utils/array.utils';
import { compare } from 'frontend/utils/sort.utils';
import { submitForm } from 'frontend/utils/submitForm';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import { IApiInnerError } from 'models/data/ApiErrorData';
import { TAmendCTAState } from 'models/data/bookingAmendment/amendCTAState';
import { IAmendRoomAndBoardSubmitPayload, IRoomVariant } from 'models/data/bookingAmendment/AmendRoomAndBoard';
import { IAmendBookingPromoBreakDown } from 'models/data/IAmendBookingFlights';
import { TAmendRoomAndBoardRestrictions } from 'models/data/IBookingInfo';
import { IBoardType } from 'models/data/IHotel';
import { IAltBoard, IUnit } from 'models/data/IOffer';
import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';
import { ApiErrors } from 'models/enum/ApiErrors';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitePath from 'models/enum/SitePath';
import { SubmitPayload } from 'models/enum/SubmitPayload';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import { findChosenRoomVariant } from './AmendRoomAndBoardStore.utils';
import { AMEND_ROOM_AND_BOARD_DISABLED_STATUSES } from './constants';

export class AmendRoomAndBoardStore {
    @observable isLoadingInitialData = false;
    @observable isLoadingValidatedOptions = false;
    @observable shouldShowRoomAndBoardPopupOnHotelChange = false;
    @observable error: Nullable<IApiInnerError> = null;
    @observable roomVariants: IRoomVariant[] = [];
    @observable chosenRoomVariant: Nullable<IRoomVariant> = null;
    @observable altBoards: (IBoardType | IAltBoard)[] = [];
    @observable areRoomAndBoardVariantsUnavailable = false;
    @observable upgradePrice = 0;
    @observable areOptionsNotValidated = false;
    @observable selectedOptionIsUnavailable = false;
    @observable isFreeChildPlaceVariantIncluded = false;
    @observable cachedRoomVariants: IRoomVariant[] = [];

    cancelToken: Nullable<CancelTokenSource> = null;

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    cancelRequests = () => {
        this.cancelToken?.cancel();
        this.cancelToken = null;
    };

    @action applyError = e => {
        if (Axios.isCancel(e)) {
            return;
        }

        const { code, errorCode, message, error } = e.response?.data || e;
        this.error = { message: message || error, code: errorCode || code };
    };

    @action initiateRoomAndBoardPage = () => {
        const { booking } = this.rootStore.viewBookingStore;
        const { redirectToViewBookingsPage } = this.rootStore.routerStore;

        if (this.rootStore.appStore.amendBookingItemPayload) {
            this.loadRoomAndBoardDataFromPayload();

            return;
        }

        if (!booking) {
            redirectToViewBookingsPage();

            return;
        }

        this.validateRoomVariants();
    };

    @action validateRoomVariants = async () => {
        const { booking } = this.rootStore.viewBookingStore;

        if (!this.chosenRoomVariant || !booking || !this.cachedRoomVariants.length) {
            return;
        }

        try {
            this.isLoadingValidatedOptions = true;
            this.rootStore.bookingStore.isLoadingOffer = true;
            this.error = null;
            this.cancelRequests();
            this.cancelToken = Axios.CancelToken.source();

            const validatedVariants = await bookingService.amendRoomAndBoardValidateOffer(
                this.chosenRoomVariant,
                this.cachedRoomVariants,
                booking.bookingReference,
                undefined,
                this.cancelToken.token,
            );

            const areOptionsDisabled = validatedVariants.length === 0;

            this.setAreOptionsNotValidated(areOptionsDisabled);

            if (areOptionsDisabled) {
                this.rootStore.trackingStore.roomAndBoard.trackNoAvailabilityError();
            }

            const populatedValidatedVariants = validatedVariants.map(variant => ({
                ...variant,
                units: variant.units.map(variantUnit => ({
                    ...variantUnit,
                    price: variant.amendmentCharges,
                })),
            }));

            runInAction(() => {
                const variants = this.defaultVariant ? [this.defaultVariant] : [];
                this.roomVariants = [...variants, ...populatedValidatedVariants].sort((aVariant, bVariant) =>
                    compare(aVariant, bVariant, 'amendmentCharges'),
                );

                this.altBoards = this.constructAltBoardsFromRoomVariants(this.roomVariants);
                this.isFreeChildPlaceVariantIncluded = !!validatedVariants.find(
                    ({ units: [unit] }) => unit.isFreeForKids,
                );
            });
        } catch (e) {
            this.applyError(e);
        } finally {
            this.isLoadingValidatedOptions = false;
            this.rootStore.bookingStore.isLoadingOffer = false;
        }
    };

    @computed get defaultVariant(): Nullable<IRoomVariant> {
        const { booking } = this.rootStore.viewBookingStore;

        if (!booking) {
            return null;
        }

        const { roomType, boardType } = booking.package.accom.rooms[0];
        const { paymentInfo } = booking;

        const amendmentCharges = getAmendmentRoundedPrice(
            paymentInfo.totalPrice - (this.chosenRoomVariant?.offerPrice ?? 0),
            true,
        );

        return {
            bookingPrice: paymentInfo.totalPrice,
            offerPrice: paymentInfo.totalPrice,
            roomType: roomType.code,
            boardType: boardType.code,
            units: booking.package.accom.rooms.map(unit => ({
                ...unit,
                pricePP: paymentInfo.pricePP,
                price: amendmentCharges,
            })),
            amendmentPaymentInfo: {
                amendmentCharges,
                amendmentChargesWithoutFees: amendmentCharges,
                feesPerPersons: [],
                packagePriceWithFees: amendmentCharges,
                packagePriceWithoutFees: amendmentCharges,
                totalFeesAmount: 0,
            },
            amendmentCharges,
            fullAmendmentCharges: 0,
        };
    }

    constructAltBoardsFromRoomVariants = (roomVariants: IRoomVariant[]): IBoardType[] => {
        const altVariants = roomVariants
            .filter(room => this.chosenRoom?.code === room.roomType)
            .map(room => ({
                ...room.units[0].boardType,
                isFreeForKids: room.units[0].isFreeForKids,
                price: room.amendmentCharges,
                pricePP: room.amendmentCharges,
            }));

        // Want the selected board to be first in the list
        // Collect uniq board types
        return [this.chosenBoard, ...altVariants].reduce((acc: IAltBoard[], variant: IAltBoard) => {
            if (!variant) {
                return acc;
            }

            const isExists = acc.find(el => el?.code === variant?.code);

            return isExists ? acc : [...acc, variant];
        }, []);
    };

    @action changeRoom = (room: IUnit | IRoomVariant) => {
        this.chosenRoomVariant = findChosenRoomVariant(this.roomVariants, room as IRoomVariant);
    };

    @computed get chosenBoard(): Nullable<IBoardType> {
        if (!this.chosenRoomVariant) {
            return null;
        }

        return {
            ...this.chosenRoomVariant.units[0].boardType,
            isFreeForKids: this.chosenRoomVariant.units[0].isFreeForKids,
        };
    }

    @computed get chosenRoom() {
        return this.chosenRoomVariant?.units[0];
    }

    @computed get feePP(): Nullable<number> {
        return this.roomVariants.find(el => el.amendmentPaymentInfo?.feesPerPersons)?.amendmentPaymentInfo
            ?.feesPerPersons?.[0]?.feesPerPersonAmount;
    }

    @action changeBoardType = async (boardType: string, priceDiff: number, onSuccess?: () => void) => {
        try {
            const board = this.altBoards?.find(x => x?.code === boardType);

            if (!board) {
                throw new Error('Board not found');
            }

            const newRoom = this.roomVariants.find(
                room => room.roomType === this.chosenRoom?.code && room.boardType === boardType,
            )?.units[0];

            if (!newRoom) {
                throw new Error('Room not found');
            }

            this.changeRoom(newRoom);

            await this.validateRoomVariants();

            onSuccess?.();
        } catch (e) {
            this.applyError(e);
        }
    };

    @action loadRoomAndBoardData = async () => {
        const { booking } = this.rootStore.viewBookingStore;

        if (!booking) {
            return;
        }

        try {
            this.isLoadingInitialData = true;

            const roomAndBoardData = await bookingService.getAmendRoomAndBoardVariants(booking.bookingReference);

            this.cachedRoomVariants = roomAndBoardData.roomVariants;
            this.upgradePrice = roomAndBoardData.upsellAmount;

            // Construct room from booking
            this.chosenRoomVariant = this.defaultVariant;

            // Construct alt boards from booking
            this.altBoards = this.constructAltBoardsFromRoomVariants(this.cachedRoomVariants);
        } catch (e) {
            this.applyError(e);
        } finally {
            this.isLoadingInitialData = false;
        }
    };

    @action loadRoomAndBoardDataFromPayload = async () => {
        const {
            appStore: { amendBookingItemPayload },
            viewBookingStore: { initBookingFromPayload },
        } = this.rootStore;

        await initBookingFromPayload(async () => {
            const { amendRoomAndBoardOffer } = amendBookingItemPayload || {};

            if (!amendRoomAndBoardOffer) {
                return;
            }

            try {
                await this.loadRoomAndBoardData();

                // Reset prices inside booking variant
                this.chosenRoomVariant = this.defaultVariant;

                await this.validateRoomVariants();
            } catch (e) {
                this.applyError(e);
            }
        });
    };

    @action goToAmendRoomAndBoardPage = async () => {
        const { redirectToAmendRoomAndBoardPage } = this.rootStore.routerStore;

        if (!this.error && this.cachedRoomVariants.length !== 0) {
            redirectToAmendRoomAndBoardPage();
        }

        if (this.error?.code === ApiErrors.RoomAndBoardVariantsUnavailable) {
            this.setAreVariantsUnavailable(true);
            this.rootStore.trackingStore.roomAndBoard.trackNoAvailabilityError();
        }
    };

    @action confirmChosenVariant = () => {
        if (!this.chosenRoomVariant) {
            return;
        }

        this.rootStore.trackingStore.roomAndBoard.trackRoomAndBoardConfirmClick(
            EventTypes.PostBookingChangeBoardUpdate,
        );

        const { billingInfo } = this.rootStore.userStore;
        const ecpSuffix = this.rootStore.queryParamsStore.isFlightPlusHotelFunnel
            ? `?${QueryParamName.ExperienceContextProvider}=${FLIGHTS_PLUS_HOTEL_PROVIDER}`
            : '';

        submitForm<IAmendRoomAndBoardSubmitPayload>(
            `${this.rootStore.layoutStore.basePath}${SitePath.AmendPayment}${ecpSuffix}`,
            SubmitPayload.AmendPaymentInfo,
            {
                ...getBookingPayload(this.rootStore.viewBookingStore.booking!),
                billingInfo,
                amendRoomAndBoardOffer: {
                    selectedRoomVariant: this.chosenRoomVariant,
                },
            },
        );
        this.rootStore.trackingStore.setPreviousPage();
    };

    @action clearStore = () => {
        this.error = null;
        this.isFreeChildPlaceVariantIncluded = false;
        this.roomVariants = [];
        this.upgradePrice = 0;
        this.cachedRoomVariants = [];
        this.setAreVariantsUnavailable(false);
        this.setAreOptionsNotValidated(false);
        this.setSelectedOptionIsUnavailable(false);
    };

    @action setAreVariantsUnavailable = (state: boolean) => {
        this.areRoomAndBoardVariantsUnavailable = state;
    };

    @action setShouldShowRoomAndBoardPopupOnHotelChange = (state: boolean) => {
        this.shouldShowRoomAndBoardPopupOnHotelChange = state;
    };

    @action setAreOptionsNotValidated = (state: boolean) => {
        this.areOptionsNotValidated = state;
    };

    @action setSelectedOptionIsUnavailable = (state: boolean) => {
        this.selectedOptionIsUnavailable = state;
    };

    @computed get allowanceRestrictions(): TAmendRoomAndBoardRestrictions {
        const { amendBookingStatuses } = this.rootStore.viewBookingStore;

        return {
            byTimeBound: amendBookingStatuses.includes(AmendBookingStatus.AmendTransfersDisabledByTimeBound),
            byAtcom: amendBookingStatuses.includes(AmendBookingStatus.AmendRoomAndBoardDisabledByAtcom),
            byMultipleRooms: amendBookingStatuses.includes(
                AmendBookingStatus.AmendRoomAndBoardDisabledByHavingMultipleRooms,
            ),
            byDisruption: amendBookingStatuses.includes(
                AmendBookingStatus.AmendRoomAndBoardDisabledByFlightsDisruption,
            ),
        };
    }

    @computed get amendCTAState(): TAmendCTAState {
        const {
            isLeadLoggedIn,
            allowanceRestrictions: { byLeadPassenger, byExternalAgency },
            isMicroAppAmendMultiRoomAndBoardAllowed,
            booking,
            amendBookingStatuses,
        } = this.rootStore.viewBookingStore;
        const { byMultipleRooms, byDisruption } = this.allowanceRestrictions;

        if (byExternalAgency || byDisruption) {
            return { isVisible: true, isDisabled: true };
        }

        if (byMultipleRooms) {
            if (isMicroAppAmendMultiRoomAndBoardAllowed) {
                return { isVisible: true };
            }

            return { isVisible: true, isDisabled: true };
        }

        if (isLeadLoggedIn && booking?.amendmentInfo?.roomAndBoard) {
            return { isVisible: true };
        }

        if (byLeadPassenger && !hasIntersection(amendBookingStatuses, AMEND_ROOM_AND_BOARD_DISABLED_STATUSES)) {
            return { isVisible: true };
        }

        return { isVisible: false };
    }

    @computed get isAmendCTADisabled(): boolean {
        return !!this.amendCTAState?.isDisabled;
    }

    @computed get isAmendCTAVisible(): boolean {
        return this.amendCTAState.isVisible;
    }

    @computed get isOriginalVariantChosen(): boolean {
        const { booking } = this.rootStore.viewBookingStore;
        const room = booking?.package.accom.rooms[0];

        return room?.code === this.chosenRoom?.code && room?.boardType.code === this.chosenBoard?.code;
    }

    @computed get canLoadRoomAndBoardOptions(): boolean {
        if (this.isAmendCTADisabled) {
            return false;
        }

        if (!this.rootStore.viewBookingStore.booking?.isLoggedInAsLeadPassenger) {
            return false;
        }

        return this.isAmendCTAVisible;
    }

    @computed get totalPrice(): number {
        return this.chosenRoomVariant?.fullAmendmentCharges ?? 0;
    }

    @computed get promocodeBreakdown(): IAmendBookingPromoBreakDown | undefined {
        return this.chosenRoomVariant?.promoCodeBreakDown;
    }

    @computed get shouldRoomAndBoardPopupBeShownOnHotelChangeSummaryPage(): boolean {
        return this.rootStore.layoutStore.isAmendHotelSummaryPage && this.shouldShowRoomAndBoardPopupOnHotelChange;
    }
}
