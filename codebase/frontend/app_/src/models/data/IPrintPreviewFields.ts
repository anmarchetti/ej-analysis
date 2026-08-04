import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import { IExportButtonsFields } from 'frontend/components/renderings/ExportButtons/ExportButtons';

export interface IPrintPreviewFields extends IExportButtonsFields {
    YourHolidayQuoteLabel: ISitecoreField<string>;
    BoardLabel?: ISitecoreField<string>;
    CabinBagsLabel?: ISitecoreField<string>;
    GuestsLabel?: ISitecoreField<string>;
    Logos?: ISitecoreField<ISitecoreImage>;
    SeatsSelectedLabel?: ISitecoreField<string>;
    YourHolidayDisclaimerText?: ISitecoreField<string>;
}
