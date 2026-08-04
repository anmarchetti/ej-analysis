import { IGuest } from './IValidPackageInfo';

export interface ILeadPassenger {
    address: string;
    countryCode: string;
    dateOfBirth: string;
    dialingCode: string;
    email: string;
    phone: string;
    postCode: string;
    townCity: string;
    address2?: string;
}

export interface IGuestPassenger extends IGuest {
    firstName: string;
    lastName: string;
    title: string;
}
