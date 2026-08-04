import { TermsAndConditionsMessageTypes } from 'models/enum/TermsAndConditionsMessageTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import { ILuggageInfoFields } from 'frontend/components/common/Booking/LuggageInfo/LuggageInfo';
import { IPriceBreakdownFields } from 'frontend/components/common/PriceBreakdown/PriceBreakdown';
import { IPaymentCreditFields, IPaymentImage } from 'frontend/components/renderings/Payment/interfaces';

export type TAmendPaymentProps = ISitecoreComponent<IPaymentPageFields>;

export interface IPaymentOptionsFields {
    AddAmendToBalanceDescription: ISitecoreField<string>;
    AddAmendToBalanceTitle: ISitecoreField<string>;
    AddToAmendBalanceTotalLabel: ISitecoreField<string>;
    AmountPayingLabel: ISitecoreField<string>;
    ChangeFeeDescription: ISitecoreField<string>;
    PayFeeAmendDescription: ISitecoreField<string>;
    PayFullAmendDescription: ISitecoreField<string>;
    PayFullAmendTitle: ISitecoreField<string>;
    PayPartAmendDescription: ISitecoreField<string>;
    PayPartAmendTitle: ISitecoreField<string>;
    PayRemainingBy: ISitecoreField<string>;
    PayingToday: ISitecoreField<string>;
    ProtectionImage: ISitecoreField<ISitecoreImage>;
    ProtectionTitle: ISitecoreField<string>;
}

export interface IPaymentLabelsFields {
    DatesLabel: ISitecoreField<string>;
    FlightLabel: ISitecoreField<string>;
    HotelLabel: ISitecoreField<string>;
    RoomAndBoardLabel: ISitecoreField<string>;
    SeatsLabel: ISitecoreField<string>;
    TransferLabel: ISitecoreField<string>;
}

export interface IRefundOptionsFields {
    CreditDescription: ISitecoreField<string>;
    RefundDescription: ISitecoreField<string>;
    RefundOptionsTitle: ISitecoreField<string>;
}

export interface IPaymentErrorsFields {
    PaymentAtcomErrorCTA: ISitecoreField<string>;
    PaymentErrorCTA: ISitecoreField<string>;
    PaymentErrorDescription: ISitecoreField<string>;
    PaymentErrorTitle: ISitecoreField<string>;
}

export interface IRemindTextFields {
    AmendRefundCreditsOnlyDescriptionReminder: ISitecoreField<string>;
    AmendRefundCreditsOnlyTitleReminder: ISitecoreField<string>;
    AmendRefundDescriptionReminder: ISitecoreField<string>;
    AmendTitleReminder: ISitecoreField<string>;
    AmendZeroPriceDescriptionReminder: ISitecoreField<string>;
}

export interface IPaymentSummaryFields {
    AdditionalCost: ISitecoreField<string>;
    AmountPaidByCard: ISitecoreField<string>;
    BalanceReduction: ISitecoreField<string>;
    BalanceWillBePaidDescription: ISitecoreField<string>;
    Confirm: ISitecoreField<string>;
    ConfirmButtonLabel: ISitecoreField<string>;
    ConfirmChangesLabel: ISitecoreField<string>;
    ConfirmNoPriceChange: ISitecoreField<string>;
    ConfirmRefund: ISitecoreField<string>;
    ConfirmRefundTitle: ISitecoreField<string>;
    CurrentBalanceLabel: ISitecoreField<string>;
    EligibleForCreditRefundDescription: ISitecoreField<string>;
    EligibleForOMOPRefundDescription: ISitecoreField<string>;
    NewBalanceWarning: ISitecoreField<string>;
    RefundCreditsTitle: ISitecoreField<string>;
    RemainingBalanceWarning: ISitecoreField<string>;
    TakeAmountOffBalance: ISitecoreField<string>;
    TakeFromBalanceForFlightDescription: ISitecoreField<string>;
    TakeFromBalanceForTransferDescription: ISitecoreField<string>;
    TotalCost: ISitecoreField<string>;
    UpdatedBalanceWarning: ISitecoreField<string>;
    PreviousBalanceLabel?: ISitecoreField<string>;
}

export interface IRefundCalculationFields {
    AmountTakenFromBalance: ISitecoreField<string>;
    AmountToBeRefunded: ISitecoreField<string>;
    BalanceWillBePaidOff: ISitecoreField<string>;
    CreditRefundOfRemainingBalance: ISitecoreField<string>;
    CurrentRemainingBalance: ISitecoreField<string>;
    FullRefundFromBalanceSubtitle: ISitecoreField<string>;
    FullRefundFromBalanceTitle: ISitecoreField<string>;
    PartRefundFromBalanceSubtitle: ISitecoreField<string>;
    PartRefundFromBalanceTitle: ISitecoreField<string>;
    PickRefundOption: ISitecoreField<string>;
    RefundCalculationMainTitle: ISitecoreField<string>;
    RemainingBalanceDue: ISitecoreField<string>;
    RemainingRefundAfterBalanceTitle: ISitecoreField<string>;
    UpdatedRemainingBalance: ISitecoreField<string>;
}

export interface IRoomAndBoardFlowFields {
    RoomAndBoardFlowIcon: ISitecoreField<ISitecoreImage>;
    RoomAndBoardFlowTitle: ISitecoreField<string>;
}

export interface ITransfersFlowFields {
    TransfersFlowIcon: ISitecoreField<ISitecoreImage>;
    TransfersFlowTitle: ISitecoreField<string>;
}

export interface IFlightsFlowFields {
    FlightsFlowIcon: ISitecoreField<ISitecoreImage>;
    FlightsFlowTitle: ISitecoreField<string>;
}

export interface IDatesFlowFields {
    DatesFlowIcon: ISitecoreField<ISitecoreImage>;
    DatesFlowTitle: ISitecoreField<string>;
}

export interface ISeatsFlowFields {
    SeatsFlowIcon: ISitecoreField<ISitecoreImage>;
    SeatsFlowTitle: ISitecoreField<string>;
}

export interface IHotelFlowFields {
    HotelFlowIcon: ISitecoreField<ISitecoreImage>;
    HotelFlowTitle: ISitecoreField<string>;
    LuggageTitle: ISitecoreField<string>;
}

export interface ISeatsUnavailablePopupFields {
    PopupIcon: ISitecoreField<ISitecoreImage>;
    SeatsPopupDescription: ISitecoreField<string>;
    SeatsPopupPrimaryCTA: ISitecoreField<string>;
    SeatsPopupSecondaryCTA: ISitecoreField<string>;
    SeatsPopupTitle: ISitecoreField<string>;
}

export interface IPromoCodeFields {
    PromoCodeChangedTitle: ISitecoreField<string>;
    PromoCodeDowngradeHeading: ISitecoreField<string>;
    PromoCodeDowngradedSubtext: ISitecoreField<string>;
    PromoCodeErrorSubtext: ISitecoreField<string>;
    PromoCodeErrorTitle: ISitecoreField<string>;
    PromoCodeIcon: ISitecoreField<ISitecoreImage>;
    PromoCodeRemovedDefaultError: ISitecoreField<string>;
    PromoCodeRemovedHeading: ISitecoreField<string>;
    PromoCodeRemovedTitle: ISitecoreField<string>;
    PromoCodeUpdatedHeading: ISitecoreField<string>;
    PromoCodeUpdatedSubtext: ISitecoreField<string>;
}

export interface IPaymentPriceBreakdownFields extends IPriceBreakdownFields {
    ChangeTooltip?: ISitecoreField<string>;
    DatesChange?: ISitecoreField<string>;
    FlightChange?: ISitecoreField<string>;
    HotelChange?: ISitecoreField<string>;
    NewTax?: ISitecoreField<string>;
    NewTaxPopupContent?: ISitecoreField<string>;
    NewTaxPopupTitle?: ISitecoreField<string>;
    PaidToUs?: ISitecoreField<string>;
    PrevTax?: ISitecoreField<string>;
    RoomAndBoardChange?: ISitecoreField<string>;
    SeatsChange?: ISitecoreField<string>;
    TransferChange?: ISitecoreField<string>;
}

export interface IPaymentPageFields
    extends IPaymentCreditFields,
        IPromoCodeFields,
        IDatesFlowFields,
        ISeatsFlowFields,
        ISeatsUnavailablePopupFields,
        IFlightsFlowFields,
        ITransfersFlowFields,
        IRoomAndBoardFlowFields,
        IHotelFlowFields,
        IPaymentOptionsFields,
        IRefundOptionsFields,
        IRefundCalculationFields,
        IRemindTextFields,
        IPaymentSummaryFields,
        IPaymentErrorsFields,
        IPaymentLabelsFields,
        IPaymentPriceBreakdownFields,
        ILuggageInfoFields {
    AccommodationLabel: ISitecoreField<string>;
    AmountLeftToPay: ISitecoreField<string>;
    AmountLeftToPayWithApplePayToggleOn: ISitecoreField<string>;
    BalanceLabel: ISitecoreField<string>;
    CommissionLabel: ISitecoreField<string>;
    CreditDebitCardLabel: ISitecoreField<string>;
    CreditRefundOptionTitle: ISitecoreField<string>;
    CvvInfo: ISitecoreField<ISitecoreImage>;
    CvvInfoAMEX: ISitecoreField<ISitecoreImage>;
    DepositLabel: ISitecoreField<string>;
    DueBalanceLessBlockDaysDescription: ISitecoreField<string>;
    DueBalanceLessBlockDaysTitle: ISitecoreField<string>;
    DueBalanceLessBlockDaysTotal: ISitecoreField<string>;
    EnablePriceJumpInfoBox: ISitecoreField<boolean>;
    ErrorPopupButton: ISitecoreField<string>;
    ErrorPopupDescription: ISitecoreField<string>;
    ErrorPopupTitle: ISitecoreField<string>;
    FeesAndTaxesLabel: ISitecoreField<string>;
    ImportantInformation: ISitecoreField<string>;
    ImportantInformationConfirmation: ISitecoreField<string>;
    IssueNumberInfo: ISitecoreField<ISitecoreImage>;
    NonCreditRefundOptionTitle: ISitecoreField<string>;
    OutstandingPaymentOptionDescriptionExtraPrice: ISitecoreField<string>;
    OutstandingPaymentOptionTitleExtraPrice: ISitecoreField<string>;
    PaidBalanceLessBlockDaysDescription: ISitecoreField<string>;
    PaidBalanceLessBlockDaysTitle: ISitecoreField<string>;
    PayFullDescription: ISitecoreField<string>;
    PayWithDepositAttention: ISitecoreField<string>;
    PayWithDepositDescription: ISitecoreField<string>;
    PayWithDepositDescriptionOnePassenger: ISitecoreField<string>;
    PaymentDeny: ISitecoreField<string>;
    PaymentImages: IPaymentImage[];
    PopupTitle: ISitecoreField<string>;
    PriceDecreasedMessage: ISitecoreField<string>;
    PriceIncreasedMessage: ISitecoreField<string>;
    ProtectionImage: ISitecoreField<ISitecoreImage>;
    ProtectionTitle: ISitecoreField<string>;
    RefundToBalanceOptionDescription: ISitecoreField<string>;
    RefundToBalanceOptionTitle: ISitecoreField<string>;
    StepOneTitle: ISitecoreField<string>;
    StepThreeRefundTitle: ISitecoreField<string>;
    StepThreeTitle: ISitecoreField<string>;
    StepTwoConfirmTitle: ISitecoreField<string>;
    StepTwoRefundTitle: ISitecoreField<string>;
    StepTwoTitle: ISitecoreField<string>;
    TotalPriceLabel: ISitecoreField<string>;
    UpdatedHolidayBalanceLabel: ISitecoreField<string>;
    VATOnCommissionLabel: ISitecoreField<string>;
    [TermsAndConditionsMessageTypes.PayRemainingBalanceTC]: ISitecoreField<string>;
    [TermsAndConditionsMessageTypes.CashRefundOnlyTC]: ISitecoreField<string>;
    [TermsAndConditionsMessageTypes.CreditRefundTC]: ISitecoreField<string>;
}
