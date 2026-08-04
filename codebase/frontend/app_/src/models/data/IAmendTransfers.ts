import { IAmendPromoFields } from 'models/data/IAmendFlights';
import { ITransferWithAmendmentCharges } from 'models/data/ITransfer';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

export interface IAmendTransferFields extends IAmendPromoFields {
    IsPromotionalBannerEnabled: ISitecoreField<boolean>;
    MinimumPromoBannerDuration: ISitecoreField<number>;
    PriceTooltipPromoSeatsText: ISitecoreField<string>;
    PriceTooltipText: ISitecoreField<string>;
    PromotionalBannerText: ISitecoreField<string>;
}

export interface ITransferWithAmendmentChargesExtended extends ITransferWithAmendmentCharges {
    errataMessages: string[];
}
