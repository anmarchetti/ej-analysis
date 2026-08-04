import { ICustomisableTitleAndDescriptionParams } from 'models/data/ICustomisableComponentParams';
import {
    ContainerPaddingOptions,
    TextPosition,
    TitleFontSizeMobileAndDesktop,
    TitleFontStyle,
    TitleWeight,
} from 'models/enum/CustomisableComponentsParameters';

export const mockCustomisableParams = {
    TitlePosition: TextPosition.Center,
    TitleFontStyle: TitleFontStyle.Rounded,
    TitleFontSize: TitleFontSizeMobileAndDesktop.Mobile14Desktop16,
    TitleWeight: TitleWeight.Weight200,
    PaddingSize: ContainerPaddingOptions.Padding24,
};

export const mockTextBlockCustomisableParams = {
    TitlePosition: TextPosition.Center,
    TitleFontStyle: TitleFontStyle.Rounded,
    TitleFontSize: TitleFontSizeMobileAndDesktop.Mobile14Desktop16,
    TitleWeight: TitleWeight.Weight200,
    PaddingSize: ContainerPaddingOptions.Padding24,
};

export const mockCustomisableTitleAndDescriptionParams: ICustomisableTitleAndDescriptionParams = {
    TitlePosition: TextPosition.Left,
    DescriptionPosition: TextPosition.Left,
    TitleFontStyle: TitleFontStyle.Rounded,
    TitleFontSize: TitleFontSizeMobileAndDesktop.Mobile14Desktop16,
    TitleWeight: TitleWeight.Weight200,
    PaddingSize: ContainerPaddingOptions.Padding24,
    TitleTag: 'h1',
};
