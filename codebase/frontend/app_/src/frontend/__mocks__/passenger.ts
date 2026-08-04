import { IFlightPassenger, IPassengerFlights } from 'models/data/AncillariesInfo';
import { ILeadPassenger } from 'models/data/ILeadPassenger';
import { GuestType } from 'models/enum/GuestType';

import { mockAddress } from './address';

export const leadPassengerMock: ILeadPassenger = {
    email: 'email@dot.com',
    dateOfBirth: new Date(1984, 1, 1).toISOString(),
    ...mockAddress,
};

export const mockPassenger: IFlightPassenger = {
    age: 34,
    dateOfBirth: '1989-07-10T00:00:00+00:00',
    firstName: 'Vobla',
    index: '1',
    isLead: true,
    lastName: 'Fisher',
    notBornYet: false,
    passengerId: '1',
    sex: 'SEX_MALE',
    title: 'Mr',
    type: GuestType.Adult,
    withInfant: false,
    hasLCB: false,
};

export const mockPassengerWithLCB = (passengerId: string = '1'): IFlightPassenger => ({
    ...mockPassenger,
    hasLCB: true,
    passengerId,
});

export const mockPassengersList = [
    { ...mockPassenger },
    { ...mockPassenger, firstName: 'Jake', isLead: false, passengerId: '2' },
];

export const mockPassengersRoute = {
    outboundPassenger: { ...mockPassenger },
    inboundPassenger: { ...mockPassenger },
};

export const mockPassengersFlights: IPassengerFlights[] = [
    {
        inboundPassenger: mockPassenger,
        outboundPassenger: { ...mockPassenger, firstName: 'Jake', isLead: false, passengerId: '2' },
    },
];

export const mockAllTypesPassengersList = [
    mockPassenger,
    {
        age: 20,
        dateOfBirth: '1989-07-10T00:00:00+00:00',
        firstName: 'Bill',
        index: '2',
        isLead: false,
        lastName: 'Fisher',
        notBornYet: false,
        passengerId: '2',
        sex: 'SEX_MALE',
        title: 'Mr',
        type: GuestType.Adult,
        withInfant: true,
        hasLCB: false,
    },
    {
        age: 20,
        dateOfBirth: '1989-07-10T00:00:00+00:00',
        firstName: 'Bob',
        index: '3',
        isLead: false,
        lastName: 'Fisher',
        notBornYet: false,
        passengerId: '3',
        sex: 'SEX_MALE',
        title: 'Mr',
        type: GuestType.Child,
        withInfant: false,
        hasLCB: false,
    },
    {
        age: 4,
        dateOfBirth: '1989-07-10T00:00:00+00:00',
        firstName: 'Bibo',
        index: '4',
        isLead: false,
        lastName: 'Fisher',
        notBornYet: false,
        passengerId: '4',
        sex: 'SEX_MALE',
        title: 'Mr',
        type: GuestType.Child,
        withInfant: false,
        hasLCB: false,
    },
    {
        age: 1,
        dateOfBirth: '1989-07-10T00:00:00+00:00',
        firstName: 'Bibobo',
        index: '5',
        isLead: false,
        lastName: 'Fisher',
        notBornYet: false,
        passengerId: '5',
        sex: 'SEX_MALE',
        title: 'Mr',
        type: GuestType.Infant,
        withInfant: false,
        hasLCB: false,
    },
];
