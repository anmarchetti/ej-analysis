import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import bookingService from 'frontend/services/booking.service';
import { logger } from 'frontend/services/logging';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import {
    IObservablePromise,
    observableFromPromise,
} from 'frontend/utils/observerablePromise/observerablePromise.utils';
import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import {
    IAmendHotelRoomAndBoardInfoResponse,
    IAmendHotelRoomAndBoardOffer,
} from 'models/data/bookingAmendment/AmendRoomAndBoard';
import { IBoardType } from 'models/data/IHotel';
import { IUnit } from 'models/data/IOffer';
import {
    checkIsTheSameOffer,
    constructAltBoardsFromOffers,
    constructAltRoomsFromOffers,
    findChosenOffer,
    getBoardTypeFromOffer,
} from 'frontend/components/renderings/AmendRoomAndBoardPopup/amendRoomAndBoard.utils/amendRoomAndBoard.utils';

export class AmendRoomAndBoardLocalStore {
    @observable allOffers: IAmendHotelRoomAndBoardOffer[] = [];
    @observable upsellAmount: number;
    @observable chosenOffer: IAmendHotelOffer;
    @observable isPopupShown;
    @observable offersRequest: IObservablePromise<IAmendHotelRoomAndBoardInfoResponse> | null = null;
    @observable initialOffer: IAmendHotelOffer;

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    @action loadRoomAndBoardData = async (): Promise<void> => {
        const { booking } = this.rootStore.viewBookingStore;
        this.allOffers = [];
        this.initialOffer = this.rootStore.amendHotelStore.newlySelectedHotelOffer!;
        this.chosenOffer = this.chosenOffer || this.initialOffer;

        if (!booking || !this.chosenOffer) {
            return;
        }

        this.offersRequest = observableFromPromise<IAmendHotelRoomAndBoardInfoResponse>(ct =>
            bookingService.getAmendHotelRoomAndBoardVariants(booking.bookingReference, this.chosenOffer, ct.token),
        );

        try {
            const offers = await this.offersRequest.originalPromise;

            runInAction(() => {
                this.allOffers = offers.amendHotelOffers;
                this.upsellAmount = offers.upsellAmount;
            });
        } catch (e) {
            logger.error(e);
        }
    };

    @computed get altBoards(): IUnit[] {
        return constructAltBoardsFromOffers(this.allOffers, this.chosenOffer);
    }

    @computed get altRooms(): IUnit[] {
        return constructAltRoomsFromOffers(this.allOffers, this.chosenOffer);
    }

    @computed get chosenBoard(): Nullable<IBoardType> {
        return getBoardTypeFromOffer(this.chosenOffer);
    }

    @computed get chosenRoom(): IUnit {
        return this.chosenOffer?.accom?.unit[0];
    }

    @action selectOffer = (offer: IUnit): void => {
        const chosenOffer = findChosenOffer(offer, this.allOffers);

        if (chosenOffer) {
            this.chosenOffer = chosenOffer;
            this.loadRoomAndBoardData();
        }
    };

    @action cancelRequests = (): void => {
        this.offersRequest?.cancel();
    };

    @action showPopup = (): void => {
        this.isPopupShown = true;
    };

    @action hidePopup = (): void => {
        this.isPopupShown = false;
        this.cancelRequests();
        this.chosenOffer = this.initialOffer;
    };

    @action submitOffer = (): void => {
        const {
            amendHotelStore: { newlySelectedHotelOffer, setPrevSelectedHotelOffer },
            layoutStore: { isAmendHotelSummaryPage },
        } = this.rootStore;

        setPrevSelectedHotelOffer(this.chosenOffer);
        this.rootStore.amendHotelStore.setNewlySelectedHotelOffer(this.chosenOffer);
        this.isPopupShown = false;

        if (newlySelectedHotelOffer && isAmendHotelSummaryPage) {
            this.rootStore.trackingStore.changeHotel.clickOnRoomAndBoardConfirm(
                newlySelectedHotelOffer,
                this.chosenOffer,
            );
        }
    };

    @computed get isSubmitDisabled(): boolean {
        if (!this.initialOffer || !this.chosenOffer) return false;

        const isOfferTheSame = checkIsTheSameOffer(this.initialOffer, this.chosenOffer);
        const isLoading = this.offersRequest?.isPending;

        return Boolean(isOfferTheSame || isLoading);
    }

    @computed get allBoardTypes(): IBoardType[] {
        const altBoards = this.altBoards.map(unit => ({
            ...unit.boardType,
            price: unit.price,
        }));

        const currentBoard = this.chosenBoard;

        if (currentBoard) {
            return [currentBoard, ...altBoards];
        }

        return altBoards;
    }

    @action selectBoardType = (selectedBoard: IBoardType): void => {
        const selectedUnit = this.altBoards.find(altBoard => altBoard.boardType.code === selectedBoard.code);

        if (!selectedUnit) return;

        this.selectOffer(selectedUnit);
    };
}
