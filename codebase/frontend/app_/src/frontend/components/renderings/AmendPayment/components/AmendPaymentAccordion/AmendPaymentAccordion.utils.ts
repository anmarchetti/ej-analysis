import { PaymentStep } from 'models/data/AmendInfo';
import { AmendmentType } from 'models/data/IBookingInfo';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { ICabinBagsInfoFields } from 'frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo';
import { ILuggageInfoFields } from 'frontend/components/common/Booking/LuggageInfo/LuggageInfo';
import AmendDatesDetails from 'frontend/components/renderings/AmendPayment/components/AmendDatesDetails/AmendDatesDetails';
import AmendFlightsDetails from 'frontend/components/renderings/AmendPayment/components/AmendFlightsDetails/AmendFlightsDetails';
import AmendHotelDetails from 'frontend/components/renderings/AmendPayment/components/AmendHotelDetails/AmendHotelDetails';
import AmendPaymentRoomAndBoardDetails from 'frontend/components/renderings/AmendPayment/components/AmendPaymentRoomAndBoardDetails/AmendPaymentRoomAndBoardDetails';
import AmendTransferDetails from 'frontend/components/renderings/AmendPayment/components/AmendPaymentTransferDetails/AmendPaymentTransferDetails';
import AmendSeatsDetails from 'frontend/components/renderings/AmendPayment/components/AmendSeatsDetails/AmendSeatsDetails';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

export type TPaymentStepState = Record<
    PaymentStep,
    {
        index: number;
        isChecked: boolean;
        isDisabled: boolean;
        isOpened: boolean;
    }
>;

export const getConfirmationTitle = (
    fields: IPaymentPageFields,
    numberOfSteps: number,
    isRefund: boolean,
): ISitecoreField<string> => {
    // eslint-disable-next-line no-magic-numbers
    if (numberOfSteps === 2) {
        return fields.StepTwoConfirmTitle;
    }

    return isRefund ? fields.StepThreeRefundTitle : fields.StepThreeTitle;
};

export const generateInitialStateFromSteps = (steps: PaymentStep[]): TPaymentStepState =>
    steps.reduce((acc, step, index) => {
        const isEntityStep = step === PaymentStep.Entity;

        return {
            ...acc,
            [step]: { isOpened: isEntityStep, isDisabled: !isEntityStep, isChecked: false, index: index + 1 },
        };
    }, {} as TPaymentStepState);

const changeSummaryComponentConfig = {
    [AmendmentType.Flight]: AmendFlightsDetails,
    [AmendmentType.Transfer]: AmendTransferDetails,
    [AmendmentType.Seats]: AmendSeatsDetails,
    [AmendmentType.Dates]: AmendDatesDetails,
    [AmendmentType.RoomAndBoard]: AmendPaymentRoomAndBoardDetails,
    [AmendmentType.Hotel]: AmendHotelDetails,
};

export const getChangeSummaryComponent = (
    amendmentType: Nullable<AmendmentType>,
): React.FC<{
    fields?: IPaymentPageFields | (ILuggageInfoFields & ICabinBagsInfoFields);
    rendering?: any;
}> | null => (amendmentType ? changeSummaryComponentConfig[amendmentType] : null);
