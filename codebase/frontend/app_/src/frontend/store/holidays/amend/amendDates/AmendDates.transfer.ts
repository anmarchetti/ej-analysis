import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import bookingService from 'frontend/services/booking.service';
import { logger } from 'frontend/services/logging';
import { getUpgradeTransferPrice } from 'frontend/store/holidays/amend/amendTransfers/AmendTransfersStore.utils';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { IAmendDatesResponseItem } from 'models/data/bookingAmendment/AmendDates';
import { ITransfer } from 'models/data/ITransfer';
import { AmendEventActions, AmendEventLabels } from 'models/data/tracking/AmendEvent';
import SitePath from 'models/enum/SitePath';

export class AmendDatesTransfer {
    @observable transferOffers: IAmendDatesResponseItem[] = [];
    @observable isLoading: boolean = false;
    @observable isError: boolean = false;

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    @computed get upgradePrice(): number {
        return getUpgradeTransferPrice(
            this.rootStore.amendDatesStore.offer?.transfers?.[0],
            this.transfersWithAmendCharges,
        );
    }

    @action getTransferOffers = async (fullOffer: IAmendDatesResponseItem) => {
        this.isLoading = true;
        this.isError = false;

        try {
            this.transferOffers = await bookingService.getAmendDatesTransferOptions(fullOffer);
        } catch (e) {
            logger.error(e);
            runInAction(() => {
                this.isError = true;
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    };

    @action clearStore = () => {
        this.transferOffers = [];
    };

    @action submitDateChangeTransferAmendment = (chosenTransfer?: ITransfer) => {
        const selectedOffer = this.transferOffers.find(
            transferOffer => transferOffer.offer.transfers[0].code === chosenTransfer?.code,
        );

        if (selectedOffer) {
            this.rootStore.amendDatesStore.offerWithPrices = selectedOffer;
        }

        return this.rootStore.routerStore.redirectTo(SitePath.AmendDatesSummary);
    };

    @action handleChangeTransfer = () => {
        this.rootStore.trackingStore.trackGenericAmendmentActionWithGuests(
            AmendEventActions.ChangeDates,
            AmendEventLabels.EditProducts,
            {
                genericValue1: AmendEventLabels.ChangeTransfers,
            },
        );

        return this.rootStore.routerStore.redirectTo(SitePath.AmendTransfer);
    };

    @computed get transfersWithAmendCharges() {
        return this.transferOffers.map(transferOption => ({
            amendmentCharges: transferOption.amendmentFlowCharges,
            promoCodeBreakDown: transferOption.promoCodeBreakDown,
            transfer: transferOption.offer.transfers[0],
        }));
    }
}
