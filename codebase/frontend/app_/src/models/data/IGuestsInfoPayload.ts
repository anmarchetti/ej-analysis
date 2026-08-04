import { GuestInfo, ILeadGuestInfo } from 'models/GuestInfo';

export interface IGuestsInfoPayload extends IBookingGuestDetailsInfo {
    deviceId: string | undefined;
}

export interface IBookingGuestDetailsInfo {
    guests: GuestInfo[];
    leadPassenger: ILeadGuestInfo;
    promoCode?: string;
}
