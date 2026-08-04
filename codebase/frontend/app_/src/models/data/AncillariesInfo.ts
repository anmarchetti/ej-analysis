import { IPassengerSeat } from './ISeatMapStore';

export interface IFlightPassenger {
    age?: number;
    dateOfBirth?: string;
    firstName?: string;
    hasLCB?: boolean;
    index?: string;
    isLead?: boolean;
    lastName?: string;
    notBornYet?: boolean;
    passengerId?: string;
    seat?: IPassengerSeat;
    sex?: string;
    title?: string;
    type?: string;
    withInfant?: boolean;
}

export interface IPassengerFlights {
    inboundPassenger: IFlightPassenger;
    outboundPassenger: IFlightPassenger;
}
