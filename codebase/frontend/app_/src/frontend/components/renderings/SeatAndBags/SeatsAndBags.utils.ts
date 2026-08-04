import { IBookingInfo } from 'models/data/IBookingInfo';

type TPageFlowType = {
    isBookingFlow: boolean;
    isPostBookingFlow: boolean;
};

export const getPageFlow = (
    booking: IBookingInfo | undefined,
    isViewBookingPage: boolean,
    isConfirmationPage: boolean,
    isAmendPaymentPage: boolean,
): TPageFlowType => {
    const isPostBookingFlow = !!booking && isViewBookingPage;
    const isConfirmationPageFlow = !!booking && isConfirmationPage;
    const isBookingFlow = !isPostBookingFlow && !isConfirmationPageFlow && !isAmendPaymentPage;

    return {
        isPostBookingFlow,
        isBookingFlow,
    };
};
