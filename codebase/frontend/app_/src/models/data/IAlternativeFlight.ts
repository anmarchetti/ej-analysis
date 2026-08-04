import { IRoute } from './IRoute';

export interface IAlternativeFlight {
    accommodationID: string;
    inboundRoutes: IRoute[];
    outboundRoutes: IRoute[];
    packageID: string;
    price: number;
}
