import { IAvailableDate } from './IAvailableDate';

export interface IAvailableDatesResponse {
    dates: IAvailableDate[];
    lastAvailableDate: string;
    nextAvailableDate: Nullable<string>;
}
