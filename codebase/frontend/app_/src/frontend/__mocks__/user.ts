import { ILoginInfo } from 'models/data/ILoginInfo';

import { mockAddress } from './address';

export const userLoginMockInfo: ILoginInfo = {
    email: 'email@dot.com',
    firstName: 'Donat',
    lastName: 'Cromwel',
    title: 'Title',
    mobilePhone: '+3334567890',
    birthDate: new Date(1984, 1, 1).toISOString(),
    dialingCode: mockAddress.dialingCode,
    countryCode: mockAddress.countryCode,
    address1: mockAddress.address,
    address2: mockAddress.address2,
    city: mockAddress.townCity,
    postalCode: mockAddress.postCode,
    mailingsFlag: false,
    easyJetMailingsFlag: false,
    preferredAirports: ['LGW', 'GRD'],
};
