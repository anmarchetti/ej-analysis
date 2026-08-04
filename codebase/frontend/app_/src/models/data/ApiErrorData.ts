export interface IApiErrorData {
    code: string;
    correlationId: string;
    error: string;
    innerErrors: IApiInnerError[];
    stackTrace: string;
    additionalData?: Record<string, any>;
}

export interface IApiInnerError {
    code: string;
    message: string;
}

export enum ApiErrorCode {
    BadRequest = 'ERR_BAD_REQUEST',
}

export enum ApiErrorMessage {
    SignInFail = 'Failed to sign in',
    RegistrationFail = 'Failed to register user',
}
