import { IPrintPreviewFields } from 'models/data/IPrintPreviewFields';
import { ExportFileTypes } from 'models/enum/ExportFileTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { IExportButtonsFields } from 'frontend/components/renderings/ExportButtons/ExportButtons';

export interface ISocialMediaContentFields extends IPrintPreviewFields {
    AirportLabel: ISitecoreField<string>;
    CopyLabel: ISitecoreField<string>;
    DepositLabel: ISitecoreField<string>;
    DownloadDesc: ISitecoreField<string>;
    LeftSectionDesc: ISitecoreField<string>;
    LeftSectionTitle: ISitecoreField<string>;
    PriceCheckboxLabel: ISitecoreField<string>;
    RightSectionDesc: ISitecoreField<string>;
    RightSectionTitle: ISitecoreField<string>;
    ReadMoreLink?: ISitecoreField<ISitecoreLink>;
}

export interface ISocialMediaContentProps extends ISitecoreComponent<ISocialMediaContentFields> {
    downloadPoster: (name: string, type?: ExportFileTypes, hasLargeFormat?: boolean) => Promise<void>;
    hasEjLogo: boolean;
    hasUMLogo: boolean;
    logoImage: ISitecoreField<ISitecoreImage>;
    posterFields: IExportButtonsFields;
    posterId: string;
    posterName: string;
    toggleEjLogo: () => void;
    toggleUMLogo: () => void;
    UMLogoImage?: string;
}
