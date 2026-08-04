import { RouteDirection } from 'models/enum/RouteDirection';

export interface IRoute {
    arrDate: string;
    arrLocation: string;
    arrName: string;
    arrPt: string;
    car: string;
    depDate: string;
    depLocation: string;
    depName: string;
    depPt: string;
    direction: RouteDirection;
    fltNo: string;
    id: string;
    isExt: boolean;
    // the same as arrName but in english, for analytic non-english markets
    arrItemName?: string;
    arrTerminal?: string;
    avail?: number;
    cycDate?: string;
    // the same as depName but in english, for analytic non-english markets
    depItemName?: string;
    depTerminal?: string;
    extRefId?: string;
    paxs?: IRoutePax[];
    routeCd?: string;
}

export interface IRoutePax {
    paxId: string;
    externalPNR?: string;
    seat?: string;
}
