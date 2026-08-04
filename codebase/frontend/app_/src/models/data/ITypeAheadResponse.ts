import { IDestination } from './IDestination';

export interface ITypeAheadResponse {
    destinations: IDestination[];
    page: number;
    take: number;
    total: number;
}
