import AxiosRequest from 'frontend/utils/request';

import { envPublic } from './env';

export function dataFetcher(url: string, data: any[] | any): any {
    return AxiosRequest.post(url.replace('?', ''), data);
}

export enum TrackingGoals {
    UserSearch = '{333AE041-C826-4431-AA6E-BBB762A51C85}',
}

export const trackingApiOptions = {
    host: envPublic.CMS_TRACK_API,
    fetcher: dataFetcher,
};

export const ANALYTIC_SEPARATOR = '|';
