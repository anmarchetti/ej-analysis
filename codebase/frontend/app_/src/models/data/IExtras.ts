import { ITransfer } from './ITransfer';

export interface IExtras {
    lateRoomCheckout: ILateRoomCheckout;
    transfers: ITransfer[];
}
export interface ILateRoomCheckout {
    autoInclude: boolean;
    code: string;
    id: string;
    mcMethod: string;
    method: string;
    name: string;
    paxs: string[];
    price: number;
    prom: string;
    quantity: number;
    rateRule: string;
    serviceStates: string[];
    setType: string[];
    startDate: string[];
    typeCode: string[];
    isHidden?: boolean;
    maxPax?: number;
    minPax?: number;
}
