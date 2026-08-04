export enum BookingStatus {
    Booking = 'BOOKING',
    Canceled = 'CANCELED',
}

export const BookingMemoCodes = {
    CB: 'CB',
    CC: 'CC',
    CI: 'CI',
    CFD: 'CFD',
    CHD: 'CHD',
    CNP: 'CNP',
};

export enum BookingErrorCodes {
    Fraud = 'FRAUD',
    NotFound = 'NOT_FOUND',
    Canceled = 'CANCELED',
    AlreadyAssigned = 'ALREADY_ASSIGNED',
    AlreadyAssignedToCurrent = 'ALREADY_ASSIGNED_TO_CURRENT',
    EmailDiffers = 'EMAIL_DIFFERS',
    AssignAgentBooking = 'ASSIGN_AGENT_BOOKING',
    Privacy = 'PRIVACY',
    AccessToPrivateBooking = 'ACCESS_TO_PRIVATE_BOOKING',
}

export const FRAUD_CODE = 'API-ERR-300060';
export const ALREADY_ASSIGNED_CODE = 'API-ERR-300081';
export const ALREADY_ASSIGNED_TO_CURRENT_CODE = 'API-ERR-300083';
export const BOOKING_EMAIL_DIFFERS = 'API-ERR-300084';
export const ASSIGN_AGENT_BOOKING = 'API-ERR-300082';
export const ACCESS_TO_PRIVATE_BOOKING = 'API-ERR-300300';
