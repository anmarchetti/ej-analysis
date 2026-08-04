import { AxiosError, AxiosResponse } from 'axios';

import { ApiErrors } from 'models/enum/ApiErrors';

import { IApiErrorData, IApiInnerError } from './ApiErrorData';

export class ApiError extends Error {
    internalError: AxiosError;
    response?: AxiosResponse<IApiErrorData>;
    data?: IApiErrorData;
    additionalData?: Record<string, any>;
    errorCode: string | ApiErrors;
    innerErrors: IApiInnerError[];
    correlationId: string;

    constructor(e: AxiosError<IApiErrorData>) {
        super(e.message);
        this.internalError = e;
        this.response = e.response;
        this.data = e.response ? e.response.data : undefined;
        this.errorCode = this.data ? this.data.code : '';
        this.innerErrors = this.data ? this.data.innerErrors : [];
        this.additionalData = this.data ? this.data.additionalData : {};
        this.correlationId = this.data ? this.data.correlationId : '';
    }
}
