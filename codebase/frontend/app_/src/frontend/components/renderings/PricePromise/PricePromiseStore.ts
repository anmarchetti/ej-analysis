import { Guid } from 'guid-typescript';
import { action, makeObservable, observable, runInAction } from 'mobx';

import { DATE_FORMATS } from 'code/dates';
import offersService from 'frontend/services/offers.service';
import { formatDateToQuery, parseDateL10n } from 'frontend/utils/date.utils';
import { convertBooleanToString } from 'frontend/utils/string.utils';
import { PricePromiseInfo, PricePromiseInfoFields } from 'models/data/PricePromiseInfo';

export class PricePromiseStore {
    @observable pricePromiseInfo: PricePromiseInfo;
    @observable forceErrors: boolean = false;
    @observable isPricePromiseSending: boolean = false;
    @observable isPricePromiseFailed: boolean = false;
    @observable isSuccessMessageShown: boolean = false;
    showABTAMembershipCheckbox: boolean = true;

    // Form key is used to remount component if it's needed
    @observable formKey: string = Guid.create().toString();

    constructor(showABTAMembershipCheckbox: boolean) {
        makeObservable(this);
        this.showABTAMembershipCheckbox = showABTAMembershipCheckbox;
        this.pricePromiseInfo = new PricePromiseInfo(showABTAMembershipCheckbox);
    }

    get isFormValid(): boolean {
        return this.pricePromiseInfo.isValid;
    }

    get formData(): FormData {
        const formData = new FormData();
        const files = this.pricePromiseInfo.screenshots?.length ? this.pricePromiseInfo.screenshots : null;

        // Send a date in query format to API
        const depDate = parseDateL10n(this.pricePromiseInfo.departureDate, DATE_FORMATS.inputField);
        const formattedDepDate = formatDateToQuery(depDate);

        formData.append(PricePromiseInfoFields.Name, this.pricePromiseInfo.name);
        formData.append(PricePromiseInfoFields.BookingReference, this.pricePromiseInfo.bookingReference);
        formData.append(PricePromiseInfoFields.DepartureDate, formattedDepDate);
        formData.append(PricePromiseInfoFields.Link, this.pricePromiseInfo.link);

        if (this.showABTAMembershipCheckbox) {
            formData.append(
                PricePromiseInfoFields.DifferentCompanyCheckbox,
                convertBooleanToString(this.pricePromiseInfo.differentCompany),
            );
        }

        formData.append(
            PricePromiseInfoFields.SameDatesOfTravelCheckbox,
            convertBooleanToString(this.pricePromiseInfo.sameDatesOfTravel),
        );
        formData.append(
            PricePromiseInfoFields.SameFlightsCheckbox,
            convertBooleanToString(this.pricePromiseInfo.sameFlights),
        );
        formData.append(
            PricePromiseInfoFields.SamePartyCompositionCheckbox,
            convertBooleanToString(this.pricePromiseInfo.samePartyComposition),
        );
        formData.append(
            PricePromiseInfoFields.SameRoomTypeCheckbox,
            convertBooleanToString(this.pricePromiseInfo.sameRoomType),
        );
        formData.append(
            PricePromiseInfoFields.InclusiveOn23kgCheckbox,
            convertBooleanToString(this.pricePromiseInfo.inclusiveOn23kg),
        );
        formData.append(
            PricePromiseInfoFields.BookedWithinLast24hCheckbox,
            convertBooleanToString(this.pricePromiseInfo.bookedWithinLast24h),
        );
        formData.append(
            PricePromiseInfoFields.InclusiveOfTransfersCheckbox,
            convertBooleanToString(this.pricePromiseInfo.inclusiveOfTransfers),
        );

        if (files?.length) {
            for (let i = 0; i < files.length; i++) {
                formData.append(PricePromiseInfoFields.Screenshots, files[i] as Blob, files[i].name);
            }
        }

        return formData;
    }

    @action toggleForceErrors = (state: boolean): void => {
        this.forceErrors = state;
    };

    @action toggleSuccessMessage = (state: boolean): void => {
        this.isSuccessMessageShown = state;
    };

    @action resetForm = (): void => {
        this.forceErrors = false;
        this.pricePromiseInfo = new PricePromiseInfo(this.showABTAMembershipCheckbox);

        // Update key, because it force to remount form component.
        // (It'is necessary in order to clear all touch/ blur states of form fields and hide errors)
        this.formKey = Guid.create().toString();
    };

    @action submitPricePromise = async (): Promise<void> => {
        this.isPricePromiseFailed = false;
        this.isPricePromiseSending = true;

        try {
            await offersService.sendPricePromise(this.formData);

            this.toggleSuccessMessage(true);
            this.resetForm();
        } catch (e) {
            runInAction(() => (this.isPricePromiseFailed = true));
        } finally {
            runInAction(() => (this.isPricePromiseSending = false));
        }
    };
}
