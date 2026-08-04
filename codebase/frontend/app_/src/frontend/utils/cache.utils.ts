import AxiosRequest from 'frontend/utils/request';

/** Cache repeated GET requests so we do not send too much duplicates */
export class CachedGetRequest {
    static REQUESTS_DEBOUNCE = 150;

    private url: string;
    private timestamp: number;
    private request: Promise<any>;

    /** Returns same request if we try to get request with same params for less than 150ms */
    getRequest(url: string) {
        if (this.isRepeatedRequest(url)) {
            return this.request;
        }

        this.timestamp = Date.now();
        this.url = url;

        this.request = AxiosRequest.get(url);

        return this.request;
    }

    private isRepeatedRequest(url: string) {
        if (!this.hasRequest) {
            return false;
        }

        const newTimestamp = Date.now();

        const diff = newTimestamp - this.timestamp;

        if (!!this.request && this.url === url && diff <= CachedGetRequest.REQUESTS_DEBOUNCE) {
            return true;
        }

        return false;
    }

    private get hasRequest() {
        return !!(this.url && this.timestamp && this.request);
    }
}
