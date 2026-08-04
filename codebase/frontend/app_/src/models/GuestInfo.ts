import { Guid } from 'guid-typescript';
import { action, computed, makeObservable, observable } from 'mobx';

import { DATE_FORMATS } from 'code/dates';
import { ValidationConfig } from 'code/validation.config';
import validationService from 'frontend/services/validation.service';
import { getYearsDifference, parseDateL10n } from 'frontend/utils/date.utils';
import { validate } from 'frontend/utils/validation.utils';
import { IValidationError } from 'models/data/validation/IValidationError';
import { GuestType } from 'models/enum/GuestType';

import { IRoom } from './data/IHotel';
import { IGuestPassenger } from './data/ILeadPassenger';
import { ISelectOption } from './data/ISelectOption';
import SitecoreDictionary from './enum/SitecoreDictionary';
import { ValidationType } from './enum/ValidationType';

export interface IGuestInfoFields {
    age: number;
    firstName: string;
    lastName: string;
    notBornYet: boolean;
    type: GuestType;
    address?: string;

    city?: string;
    email?: string;
    postCode?: string;
}

export interface IGuestAllocation {
    adults: IGuestPassenger[];
    children: IGuestPassenger[];
    infants: IGuestPassenger[];
}

export const AGE_OF_MAJORITY = 18;
export const DEFAULT_ADULT_BIRTHDAY = parseDateL10n('01/01/1900', 'DD/MM/YYYY');

export class GuestInfo implements IGuestInfoFields {
    constructor(
        { type, firstName, lastName, email, age, notBornYet, address, city, postCode }: IGuestInfoFields,
        isLead = false,
    ) {
        makeObservable(this);

        this.isLead = isLead;

        this.type = type;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.age = age;
        this.notBornYet = notBornYet;
        this.title = '';
        this.address = address;
        this.city = city;
        this.postCode = postCode;

        this.id = Guid.create().toString();
    }

    public static readonly getGuestsAllocation = (guests: IGuestPassenger[], room: IRoom): IGuestAllocation =>
        guests.reduce(
            (acc, guest) => {
                switch (guest.type) {
                    case GuestType.Adult:
                        acc.adults.push(guest);
                        break;
                    case GuestType.Child:
                        acc.children.push(guest);
                        break;
                    default:
                        acc.infants.push(guest);
                }

                return acc;
            },
            {
                adults: [] as IGuestPassenger[],
                children: [] as IGuestPassenger[],
                infants: [] as IGuestPassenger[],
                roomCode: room.roomType.code,
            },
        );

    id: string;
    holidayStartDate: Date;
    @observable isLead = false;
    @observable age: number;
    @observable notBornYet: boolean;
    @observable Sex = 'SEX_UNKNOWN';
    @observable useSurnameAsLead = false;
    @observable type: GuestType;

    @validate(ValidationConfig.firstName) @observable firstName: string;
    @validate(ValidationConfig.lastName) @observable lastName: string;
    @validate(ValidationConfig.title) @observable title: string;
    @observable defaultTitle: Nullable<ISelectOption>;

    // only lead guest
    @validate(ValidationConfig.countryCode) @observable countryCode?: string;
    @validate(ValidationConfig.address) @observable address?: string;
    @validate(ValidationConfig.address2) @observable address2?: string;
    @validate(ValidationConfig.city) @observable city?: string;
    @validate(ValidationConfig.postCode) @observable postCode?: string;
    @validate(ValidationConfig.email) @observable email?: string;
    @validate(ValidationConfig.dialingCode) @observable dialingCode?: string;
    @validate(ValidationConfig.phone) @observable phone?: string;

    // child & lead guest
    @validate(ValidationConfig.dateOfBirth) @observable dateOfBirth?: string;

    @computed get fullName(): string {
        if (this.firstName && this.lastName) {
            return `${this.firstName} ${this.lastName}`;
        }

        return '';
    }

    @computed get dateOfBirthObject(): Nullable<Date> {
        return this.dateOfBirth ? parseDateL10n(this.dateOfBirth, DATE_FORMATS.inputField, true) : null;
    }

    public getErrorsBySiteName = (isTradePortal: boolean): IValidationError[] => {
        let errors = [] as IValidationError[];

        if (this.isLead) {
            if (isTradePortal) {
                errors = validationService.validateModel(this, ['address', 'city', 'postCode', 'countryCode']);
            } else {
                errors = validationService.validateModel(this, ['dateOfBirth']).concat(this.dateOfBirthErrors);
            }
        } else if (this.type === GuestType.Infant) {
            errors = validationService.validateModel(this, [
                'email',
                'phone',
                'title',
                'address',
                'address2',
                'city',
                'postCode',
                'dateOfBirth',
                'dialingCode',
                'countryCode',
            ]);
        } else if (this.type === GuestType.Child) {
            errors = validationService
                .validateModel(this, [
                    'email',
                    'phone',
                    'address',
                    'address2',
                    'city',
                    'postCode',
                    'dialingCode',
                    'countryCode',
                ])
                .concat(this.dateOfBirthErrors);
        } else {
            errors = validationService.validateModel(this, [
                'email',
                'phone',
                'address',
                'address2',
                'city',
                'postCode',
                'dateOfBirth',
                'dialingCode',
                'countryCode',
            ]);
        }

        return errors;
    };

    public isValidBySiteName = (isTradePortal: boolean): boolean => !this.getErrorsBySiteName(isTradePortal).length;

    get dateOfBirthErrors(): IValidationError[] {
        let errors = validationService.validateField(this, 'dateOfBirth');

        if (this.type === GuestType.Child && errors.length) {
            errors = errors.map(e => {
                // update error message for child
                if (e.rule === 'required') {
                    return {
                        ...e,
                        errorMessage: SitecoreDictionary.GuestDetailsErrorMessagesChildAgeRequired,
                    };
                }

                return e;
            });
        }

        if (errors.length || !this.dateOfBirthObject) return errors;

        // if lead age is invalid (< 18 or > 120)
        if (
            this.type === GuestType.Adult &&
            this.isLead &&
            (!this.isLeadLegalAdult() || (DEFAULT_ADULT_BIRTHDAY && this.dateOfBirthObject <= DEFAULT_ADULT_BIRTHDAY))
        ) {
            errors.push({
                errorMessage: SitecoreDictionary.GuestDetailsErrorMessagesLeadAgeError,
                trigger: ValidationType.OnBlur,
                propertyName: 'dateOfBirth',
            });
        } else if (this.type === GuestType.Child) {
            const dateMax = new Date(this.holidayStartDate);
            dateMax.setFullYear(dateMax.getFullYear() - this.age);
            const dateMin = new Date(this.holidayStartDate);
            dateMin.setFullYear(dateMin.getFullYear() - (this.age + 1));

            // if child age (from SP) doesn't match provided date
            if (dateMax < this.dateOfBirthObject || dateMin > this.dateOfBirthObject) {
                errors.push({
                    errorMessage: SitecoreDictionary.GuestDetailsErrorMessagesChildAgeError,
                    trigger: ValidationType.OnBlur,
                    propertyName: 'dateOfBirth',
                });
            }
        }

        return errors;
    }

    /**
     * Check if lead age is age of majority on date
     */
    isLeadLegalAdult(): boolean {
        return (
            this.type === GuestType.Adult &&
            this.isLead &&
            !!this.dateOfBirthObject &&
            getYearsDifference(this.holidayStartDate, this.dateOfBirthObject) >= AGE_OF_MAJORITY
        );
    }

    @action onChangeField(field: string, value: string | number | boolean | GuestType): void {
        this[field] = value;
    }

    @action toggleSurnameSameAsLead(checked: boolean, leadLastName: string): void {
        this.useSurnameAsLead = checked;
        this.lastName = checked ? leadLastName : '';
    }

    @action toggleSurnameForEachPassenger(state: boolean, leadLastName: string = ''): void {
        this.useSurnameAsLead = state;

        if (state && leadLastName) {
            this.lastName = leadLastName;
        }
    }

    @action updateFields(guestInfo: GuestInfo): void {
        this.title = guestInfo.title || '';
        this.firstName = guestInfo.firstName;
        this.useSurnameAsLead = guestInfo.useSurnameAsLead;
        this.lastName = guestInfo.lastName;
        this.dialingCode = guestInfo.dialingCode;
        this.phone = guestInfo.phone;
        this.age = guestInfo.age;
        this.dateOfBirth = guestInfo.dateOfBirth;
        this.countryCode = guestInfo.countryCode;
        this.address = guestInfo.address;
        this.address2 = guestInfo.address2;
        this.city = guestInfo.city;
        this.postCode = guestInfo.postCode;
        this.email = guestInfo.email;
    }
}

export interface ILeadGuestInfo {
    address?: string;
    address2?: string;
    countryCode?: string;
    dateOfBirth?: string;
    dialingCode?: string;
    email?: string;
    phone?: string;
    postCode?: string;
    townCity?: string;
}
