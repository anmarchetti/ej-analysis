import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { ICabinBagsInfoFields } from 'frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo';
import { ILuggageInfoFields } from 'frontend/components/common/Booking/LuggageInfo/LuggageInfo';

import { IFastTrackAndServiceLineFields } from './components/BookingDetailsExpanded/components/FastTrackAndServiceLine/TransferAndBagsRow/FastTrackAndServiceLine';

export interface IPaymentCreditFields {
    IconCreditInfoBlock: ISitecoreField<ISitecoreImage>;
    IsUseCreditShown: ISitecoreField<boolean>;
    TextCreditInfoBlock: ISitecoreField<string>;
    UseCreditDescription: ISitecoreField<string>;
    UseCreditFormTitle: ISitecoreField<string>;
    UseCreditLogInText: ISitecoreField<string>;
    UseCreditTitle: ISitecoreField<string>;
}

export interface IPaymentImage {
    fields: {
        Image: ISitecoreField<ISitecoreImage>;
        Name: ISitecoreField<string>;
    };
}

export interface IAirportParkingFields {
    DepartureAirportText?: ISitecoreField<string>;
    EmailInstruction?: ISitecoreField<string>;
    ImportantInformationConfirmationWithAirportParking?: ISitecoreField<string>;
    ParkingDates?: ISitecoreField<string>;
}

export interface IPaymentPriceJumpFields {
    PriceJumpPopupAccept?: ISitecoreField<string>;
    PriceJumpPopupDecline?: ISitecoreField<string>;
    PriceJumpPopupDescription?: ISitecoreField<string>;
    PriceJumpPopupTitle?: ISitecoreField<string>;
}

export interface IPaymentPageFields
    extends IPaymentCreditFields,
        ILuggageInfoFields,
        ICabinBagsInfoFields,
        Partial<IAirportParkingFields>,
        IPaymentPriceJumpFields,
        IFastTrackAndServiceLineFields {
    AmountLeftToPay: ISitecoreField<string>;
    AmountLeftToPayWithApplePayToggleOn: ISitecoreField<string>;
    CreditDebitCardLabel: ISitecoreField<string>;
    CvvInfo: ISitecoreField<ISitecoreImage>;
    CvvInfoAMEX: ISitecoreField<ISitecoreImage>;
    EnablePriceJumpInfoBox: ISitecoreField<boolean>;
    ImportantInformation: ISitecoreField<string>;
    ImportantInformationConfirmation: ISitecoreField<string>;
    IssueNumberInfo: ISitecoreField<ISitecoreImage>;
    PayFullDescription: ISitecoreField<string>;
    PayWithDepositAttention: ISitecoreField<string>;
    PayWithDepositDescription: ISitecoreField<string>;
    PayWithDepositDescriptionOnePassenger: ISitecoreField<string>;
    PaymentDeny: ISitecoreField<string>;
    PaymentImages: IPaymentImage[];
    PriceDecreasedMessage: ISitecoreField<string>;
    PriceIncreasedMessage: ISitecoreField<string>;
    ProtectionImage: ISitecoreField<ISitecoreImage>;
    ProtectionTitle: ISitecoreField<string>;
    TouristTaxNoPaymentRequiredBannerText: ISitecoreField<string>;
    TouristTaxNoPaymentRequiredBannerTitle: ISitecoreField<string>;
    TouristTaxPaymentRequiredBannerText: ISitecoreField<string>;
    TouristTaxPaymentRequiredBannerTitle: ISitecoreField<string>;
    PayFullDescriptionIncludingTax?: ISitecoreField<string>;
    PayWithDepositDescriptionIncludingTax?: ISitecoreField<string>;
    PayWithDepositDescriptionOnePassengerIncludingTax?: ISitecoreField<string>;
    ReadMoreLink?: ISitecoreField<ISitecoreLink>;
}

export interface IPayBalancePageFields
    extends IPaymentCreditFields,
        ILuggageInfoFields,
        ICabinBagsInfoFields,
        IFastTrackAndServiceLineFields {
    AmountLeftToPay: ISitecoreField<string>;
    AmountLeftToPayWithApplePayToggleOn: ISitecoreField<string>;
    CreditDebitCardLabel: ISitecoreField<string>;
    CvvInfo: ISitecoreField<ISitecoreImage>;
    CvvInfoAMEX: ISitecoreField<ISitecoreImage>;
    IssueNumberInfo: ISitecoreField<ISitecoreImage>;
    PaymentDeny: ISitecoreField<string>;
    PaymentImages: IPaymentImage[];
    ResidualBalance: ISitecoreField<number>;
    ShowInstalments: ISitecoreField<boolean>;
    ReadMoreLink?: ISitecoreField<ISitecoreLink>;
}
