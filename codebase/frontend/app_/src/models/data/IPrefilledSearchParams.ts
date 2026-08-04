import { IQueryRoom } from './URLQueryRooms';

export interface IPrefilledSearchParams {
    autoAllocation: boolean;
    departure: string;
    dest: string;
    durations: string[];
    flexDays: number;
    geog: string;
    isMonthSearch: boolean | undefined; // undefined for old recent searches that don't support month search functionality
    isVirtualResort: boolean;
    rooms: IQueryRoom[];
    startDate: string;
}
