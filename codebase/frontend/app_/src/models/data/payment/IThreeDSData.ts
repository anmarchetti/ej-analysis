export interface IThreeDSData extends IThreeDSTechnicalErrors {
    bookingReference: string;
    challengeComplete?: boolean;
    issuerUrl?: string;
    md?: string;
    paRes?: string;
    requestId?: string;
    sessionId?: string;
    threeDSEventType?: string;
    threeDSServerTransID?: string;
    transStatus?: string;
    transactionReference?: string;
}

export interface IThreeDSTechnicalErrors {
    /**
     * Whether 3DS1 authentication step had error
     */
    authenticationError?: boolean;

    /**
     * Whether 3DS2 challenge step had error
     */
    challengeError?: boolean;

    /**
     * Whether 3DS2 fingerprint step had error
     */
    fingerprintError?: boolean;

    /**
     * Whether 3DS2 fingerprint step had timeout error
     */
    fingerprintTimeout?: boolean;
}
