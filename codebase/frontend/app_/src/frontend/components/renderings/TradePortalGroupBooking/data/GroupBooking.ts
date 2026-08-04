import { action, computed, makeObservable, observable } from 'mobx';

import settings from 'code/settings';
import validationService from 'frontend/services/validation.service';
import { validateChildrenAgesInRoom } from 'frontend/utils/guestsValidation';
import { validate } from 'frontend/utils/validation.utils';
import { ISelectOption } from 'models/data/ISelectOption';
import { IValidationError } from 'models/data/validation/IValidationError';
import { RoomAllocation } from 'models/RoomAllocation';
import {
    adjustRooms,
    filterRoomsById,
    getAdultsQuantity,
    getChildrenQuantity,
    getInfantsQuantity,
} from 'models/RoomAllocation.utils';
import { MIN_PEOPLE_COUNT_FOR_GROUP_BOOKING } from 'frontend/components/renderings/TradePortalGroupBooking/data/constants';

import { generateGroupBookingValidationConfig, IGroupBookingErrorMessages } from './validation.config';

export enum GroupBookingFormFields {
    AgentName = 'agentName',
    AgentEmail = 'agentEmail',
    AgentNumber = 'agentNumber',
    DepartureDate = 'departureDate',
    Duration = 'duration',
    IsFlexible = 'isFlexible',
    Destination = 'destination',
    AdditionalDetails = 'additionalDetails',
    DepartureAirport = 'departureAirport',
    Boards = 'boards',
}

export class GroupBooking {
    [GroupBookingFormFields.AgentName]: string = '';
    [GroupBookingFormFields.AgentEmail]: string = '';
    [GroupBookingFormFields.AgentNumber]: string = '';
    [GroupBookingFormFields.DepartureDate]: string = '';
    [GroupBookingFormFields.Duration]: string = '';
    [GroupBookingFormFields.IsFlexible]: boolean = false;
    [GroupBookingFormFields.Destination]: string = '';
    [GroupBookingFormFields.AdditionalDetails]: string = '';
    [GroupBookingFormFields.DepartureAirport]: string = '';
    [GroupBookingFormFields.Boards]: ISelectOption[] | null = null;
    rooms: RoomAllocation[] = [new RoomAllocation()];
    isAutoAllocation: boolean = true;

    constructor(errorMessages: IGroupBookingErrorMessages) {
        const groupBookingValidationConfig = generateGroupBookingValidationConfig(errorMessages);

        // decorate each field in GroupBookingFormFields
        Object.keys(GroupBookingFormFields).forEach(key => {
            const fieldConfig = groupBookingValidationConfig[GroupBookingFormFields[key]];

            if (fieldConfig) {
                validate(groupBookingValidationConfig[GroupBookingFormFields[key]])(this, GroupBookingFormFields[key]);
            }
        });

        makeObservable(this, {
            [GroupBookingFormFields.AgentName]: observable,
            [GroupBookingFormFields.AgentEmail]: observable,
            [GroupBookingFormFields.AgentNumber]: observable,
            [GroupBookingFormFields.DepartureDate]: observable,
            [GroupBookingFormFields.Duration]: observable,
            [GroupBookingFormFields.IsFlexible]: observable,
            [GroupBookingFormFields.Destination]: observable,
            [GroupBookingFormFields.AdditionalDetails]: observable,
            [GroupBookingFormFields.DepartureAirport]: observable,
            [GroupBookingFormFields.Boards]: observable,
            rooms: observable,
            isAutoAllocation: observable,
            onChangeField: action,
            setRooms: action,
            changeRoomsCount: action,
            adultsQuantity: computed,
            childrenQuantity: computed,
            infantsQuantity: computed,
            totalQuantity: computed,
            isMinCountReached: computed,
            isValid: computed,
        });
    }

    get isValid(): boolean {
        const errors = validationService.validateModel(this);

        return (
            errors.length === 0 &&
            this.totalQuantity >= MIN_PEOPLE_COUNT_FOR_GROUP_BOOKING &&
            this.validateChildrenAge()
        );
    }

    validateField = (field: GroupBookingFormFields): IValidationError[] =>
        validationService.validateField(this, field as keyof GroupBooking);

    isFieldRequired = (field: GroupBookingFormFields): boolean =>
        validationService.isFieldRequired(this, field as keyof GroupBooking);

    onChangeField = (field: GroupBookingFormFields, value: string | boolean | Nullable<File[]>): void => {
        this[field as string] = value;
    };

    onChangeCheckboxField = (field: GroupBookingFormFields, event: React.ChangeEvent<HTMLInputElement>): void => {
        this.onChangeField(field, event.target.checked);
    };

    setRooms = (newRooms: RoomAllocation[]): void => {
        this.rooms = newRooms;
    };

    get adultsQuantity(): number {
        return getAdultsQuantity(this.rooms);
    }

    get childrenQuantity(): number {
        return getChildrenQuantity(this.rooms);
    }

    get infantsQuantity(): number {
        return getInfantsQuantity(this.rooms);
    }

    get totalQuantity(): number {
        return this.adultsQuantity + this.childrenQuantity + this.infantsQuantity;
    }

    get isMinCountReached(): boolean {
        return this.totalQuantity >= MIN_PEOPLE_COUNT_FOR_GROUP_BOOKING;
    }

    validateChildrenAge = (): boolean => !this.rooms.find(room => validateChildrenAgesInRoom(room.children));

    changeRoomsCount = (selectedOption: ISelectOption): void => {
        let roomsCount = Number(selectedOption.value);

        if (roomsCount === -1) {
            this.isAutoAllocation = true;
            roomsCount = 1;
        } else {
            this.isAutoAllocation = false;
        }

        this.setRooms(adjustRooms(this.rooms, roomsCount - this.rooms.length));
    };

    removeRoom = (id: number): void => {
        this.setRooms(filterRoomsById(this.rooms, id));
    };

    initializeRooms = (): void => {
        for (let i = 0; i < settings.RoomAllocation.AdultsInFirstRoom; i++) {
            this.rooms[0].addAdult(true);
        }
    };
}
