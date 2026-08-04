import { action, makeObservable, observable } from 'mobx';

import { PricePromiseValidationConfig } from 'code/validation.config';
import validationService from 'frontend/services/validation.service';
import { validate } from 'frontend/utils/validation.utils';

import { IValidationError } from './validation/IValidationError';

export enum PricePromiseInfoFields {
    Name = 'name',
    BookingReference = 'bookingReference',
    DepartureDate = 'departureDate',
    Link = 'link',
    Screenshots = 'screenshots',
    SameDatesOfTravelCheckbox = 'sameDatesOfTravel',
    SameFlightsCheckbox = 'sameFlights',
    SamePartyCompositionCheckbox = 'samePartyComposition',
    SameRoomTypeCheckbox = 'sameRoomType',
    InclusiveOn23kgCheckbox = 'inclusiveOn23kg',
    BookedWithinLast24hCheckbox = 'bookedWithinLast24h',
    DifferentCompanyCheckbox = 'differentCompany',
    InclusiveOfTransfersCheckbox = 'inclusiveOfTransfers',
}
export class PricePromiseInfo {
    @validate(PricePromiseValidationConfig.name) @observable name: string = '';
    @validate(PricePromiseValidationConfig.bookingReference) @observable bookingReference: string = '';
    @validate(PricePromiseValidationConfig.departureDate) @observable departureDate: string = '';
    @validate(PricePromiseValidationConfig.link) @observable link: string = '';
    @validate(PricePromiseValidationConfig.sameDatesOfTravel) @observable sameDatesOfTravel: boolean = false;
    @validate(PricePromiseValidationConfig.sameFlights) @observable sameFlights: boolean = false;
    @validate(PricePromiseValidationConfig.samePartyComposition) @observable samePartyComposition: boolean = false;
    @validate(PricePromiseValidationConfig.sameRoomType) @observable sameRoomType: boolean = false;
    @validate(PricePromiseValidationConfig.inclusiveOn23kg) @observable inclusiveOn23kg: boolean = false;
    @observable differentCompany: boolean = false;
    @validate(PricePromiseValidationConfig.bookedWithinLast24h) @observable bookedWithinLast24h: boolean = false;
    @validate(PricePromiseValidationConfig.screenshots) @observable screenshots: Nullable<File[]> = null;
    @observable inclusiveOfTransfers: boolean = false;
    showABTAMembershipCheckbox: boolean = true;

    constructor(showABTAMembershipCheckbox: boolean) {
        makeObservable(this);
        this.showABTAMembershipCheckbox = showABTAMembershipCheckbox;

        if (showABTAMembershipCheckbox) {
            validate(PricePromiseValidationConfig.differentCompany)(
                this,
                PricePromiseInfoFields.DifferentCompanyCheckbox,
            );
        }
    }

    get isValid(): boolean {
        const errors = validationService.validateModel(this);

        return errors.length === 0;
    }

    get isValidCheckboxSet(): boolean {
        const checkboxes = [
            PricePromiseInfoFields.SameDatesOfTravelCheckbox,
            PricePromiseInfoFields.SameFlightsCheckbox,
            PricePromiseInfoFields.SamePartyCompositionCheckbox,
            PricePromiseInfoFields.SameRoomTypeCheckbox,
            PricePromiseInfoFields.InclusiveOn23kgCheckbox,
            PricePromiseInfoFields.BookedWithinLast24hCheckbox,
        ];

        if (this.showABTAMembershipCheckbox) {
            checkboxes.push(PricePromiseInfoFields.DifferentCompanyCheckbox);
        }

        return checkboxes.every(this.isValidField);
    }

    isValidField = (field: PricePromiseInfoFields): boolean => {
        const errors = this.validateField(field);

        return errors.length === 0;
    };

    validateField = (field: PricePromiseInfoFields): IValidationError[] =>
        validationService.validateField(this, field as keyof PricePromiseInfo);

    @action onChangeField = (field: PricePromiseInfoFields, value: string | boolean | Nullable<File[]>): void => {
        this[field as string] = value;
    };
}
