import { Guid } from 'guid-typescript';
import { action, makeObservable, observable, runInAction } from 'mobx';

import groupBookingService from 'frontend/services/groupBooking.service/groupBooking.service';
import { formatDateToQuery, parseDateL10n } from 'frontend/utils/date.utils';
import { GroupBooking } from 'frontend/components/renderings/TradePortalGroupBooking/data/GroupBooking';
import { IGroupBookingInfo } from 'frontend/components/renderings/TradePortalGroupBooking/data/models';
import { IGroupBookingErrorMessages } from 'frontend/components/renderings/TradePortalGroupBooking/data/validation.config';

export class GroupBookingStore {
    @observable groupBooking: GroupBooking;

    @observable formKey: string = Guid.create().toString();
    @observable forceErrors: boolean = false;

    @observable isSuccess: boolean = false;

    constructor(formErrorMessages: IGroupBookingErrorMessages) {
        // create GroupBooking object on init with error messages from datasource
        this.groupBooking = new GroupBooking(formErrorMessages);
        makeObservable(this);
    }

    getGroupBookingInfo = (): IGroupBookingInfo => ({
        agentName: this.groupBooking.agentName,
        email: this.groupBooking.agentEmail,
        abtaNumber: this.groupBooking.agentNumber,
        numberOfRooms: this.groupBooking.rooms.length,
        totalPassengers: {
            adults: this.groupBooking.adultsQuantity,
            children: this.groupBooking.childrenQuantity,
            infants: this.groupBooking.infantsQuantity,
        },
        departureAirport: {
            airport: this.groupBooking.departureAirport,
            iAmFlexible: this.groupBooking.isFlexible,
        },
        departureDate: formatDateToQuery(parseDateL10n(this.groupBooking.departureDate)),
        durationOfHoliday: Number(this.groupBooking.duration),
        boardBasis: this.groupBooking.boards?.map(board => board.value).join(', ') || '',
        destinationHotelOrRegion: this.groupBooking.destination,
        additionalDetails: this.groupBooking.additionalDetails,
        rooms: this.groupBooking.rooms.map((room, index) => ({
            roomNumber: index + 1,
            adults: room.adults.length,
            children: room.children.length,
            childAges: room.children.map(child => child.age),
            infants: room.infants.length,
        })),
    });

    @action submitForm = async () => {
        if (!this.groupBooking.isValid) {
            return;
        }

        const data = this.getGroupBookingInfo();
        try {
            await groupBookingService.saveGroupBookingInformation(data);
            window.scrollTo(0, 0);
            runInAction(() => {
                this.isSuccess = true;
            });
        } catch (e) {
            runInAction(() => {
                this.isSuccess = false;
            });
        }
    };

    @action toggleForceErrors = (state: boolean) => {
        this.forceErrors = state;
    };
}
