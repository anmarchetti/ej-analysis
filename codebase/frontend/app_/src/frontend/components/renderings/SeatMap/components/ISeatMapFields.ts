import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

import { ISeatMapHeadContentFields } from './SeatMapContent/SeatMapContent';

export interface IBenefit {
    Name: ISitecoreField<string>;
}

export interface IBenefitsTableFields {
    IncludedIcon: ISitecoreField<ISitecoreImage>;
    NotIncludedIcon: ISitecoreField<ISitecoreImage>;
    SeatBenefits: ISitecoreChildren<IBenefit>[];
    SeatTypeName: ISitecoreField<string>;
}

export interface ISeatMapFields extends ISeatMapHeadContentFields {
    BackToExtrasLabel: ISitecoreField<string>;
    BackToSummaryLabel: ISitecoreField<string>;
    BackToViewBookingLabel: ISitecoreField<string>;
    BenefitsHeadImageBackground: ISitecoreField<ISitecoreImage>;
    BenefitsTable: ISitecoreChildren<IBenefitsTableFields>[];
    BtnCancel: ISitecoreField<string>;
    CancellationPopUpBackButton: ISitecoreField<string>;
    CancellationPopUpContinueButton: ISitecoreField<string>;
    CancellationPopUpDescription: ISitecoreField<string>;
    CancellationPopUpTitle: ISitecoreField<string>;
    ConfirmSeatsBtnText: ISitecoreField<string>;
    ContinueToReturnBtnText: ISitecoreField<string>;
    EmptySelectionBtnText: ISitecoreField<string>;
    FullSelectionActionText: ISitecoreField<string>;
    InboundFlightDirectionName: ISitecoreField<string>;
    LoadingScreenTitle: ISitecoreField<string>;
    OutboundFlightDirectionName: ISitecoreField<string>;
    PerPersonLabel: ISitecoreField<string>;
    SelectionActionText: ISitecoreField<string>;
    SpinnerHeader: ISitecoreField<string>;
    IncludedLabel?: ISitecoreField<string>;
}
