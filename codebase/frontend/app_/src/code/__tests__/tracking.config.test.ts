import { dataFetcher } from 'code/tracking.config';
import AxiosRequest from 'frontend/utils/request';

jest.mock('frontend/utils/request');

describe('trackingConfig', () => {
    it('dataFetcher response', () => {
        (AxiosRequest.post as jest.Mock).mockReturnValue(true);
        const response = dataFetcher('/', ['test']);
        expect(response).toBeTruthy();
    });
});
