import classNames from 'classnames';

import { ICustomisableComponentParams } from 'models/data/ICustomisableComponentParams';
import {
    ContainerPaddingOptions,
    PaddingBottomOptions,
    PaddingTopOptions,
    TextPosition,
    TitleFontSizeMobileAndDesktop,
    TitleFontStyle,
    TitleWeight,
} from 'models/enum/CustomisableComponentsParameters';

export const getCustomisableTitleClassName = (
    className: string,
    params: ICustomisableComponentParams & {
        [key: string]: any;
    },
    isTextBlock: boolean = false,
): string => {
    const { TitleFontSize, TitleWeight, TitlePosition, TitleFontStyle } = params || {};

    return classNames(
        className,
        getMobileAndDesktopFontSizeClassName(TitleFontSize),
        getFontWeightClassName(TitleWeight),
        isTextBlock ? getTextBlockTextPositionClassName(TitlePosition) : getTextPositionClassName(TitlePosition),
        getTitleFontClassName(TitleFontStyle),
    );
};

export const getCssModuleClassName = <T extends string>(
    stylesModule: Partial<Record<T, string>>,
    className: Nullable<T>,
): string => (className ? stylesModule[className] || '' : '');

export const getMobileAndDesktopFontSizeClassName = (fontSize?: TitleFontSizeMobileAndDesktop): Nullable<string> => {
    switch (fontSize) {
        case TitleFontSizeMobileAndDesktop.Mobile14Desktop16:
            return 'mobile-f14-desktop-f16';
        case TitleFontSizeMobileAndDesktop.Mobile18Desktop24:
            return 'mobile-f18-desktop-f24';
        case TitleFontSizeMobileAndDesktop.Mobile20Desktop32:
            return 'mobile-f20-desktop-f32';
        case TitleFontSizeMobileAndDesktop.Mobile24Desktop36:
            return 'mobile-f24-desktop-f36';
        default:
            return null;
    }
};

export const getFontWeightClassName = (fontWeight?: TitleWeight): Nullable<string> => {
    switch (fontWeight) {
        case TitleWeight.Weight100:
            return 'weight-100';
        case TitleWeight.Weight200:
            return 'weight-200';
        case TitleWeight.Weight300:
            return 'weight-300';
        case TitleWeight.Weight400:
            return 'weight-400';
        case TitleWeight.Weight500:
            return 'weight-500';
        case TitleWeight.Weight600:
            return 'weight-600';
        case TitleWeight.Weight700:
            return 'weight-700';
        case TitleWeight.Weight800:
            return 'weight-800';
        case TitleWeight.Weight900:
            return 'weight-900';
        default:
            return null;
    }
};

export const getTextPositionClassName = (textPosition?: TextPosition): Nullable<string> => {
    switch (textPosition) {
        case TextPosition.Center:
            return 'position-center';
        case TextPosition.Left:
            return 'position-left';
        case TextPosition.Right:
            return 'position-right';
        default:
            return null;
    }
};

export const getTitleFontClassName = (fontStyle?: TitleFontStyle): Nullable<string> => {
    switch (fontStyle) {
        case TitleFontStyle.Rounded:
            return 'font-rounded';
        case TitleFontStyle.GenerationHeadline:
            return 'font-generation-headline';
        case TitleFontStyle.RoundedDemi:
            return 'font-rounded-demi';
        case TitleFontStyle.Unbounded:
            return 'font-unbounded-sans';
        default:
            return null;
    }
};

export const getPaddingSizeClassName = (paddingSize?: ContainerPaddingOptions): string | undefined => {
    switch (paddingSize) {
        case ContainerPaddingOptions.Padding0:
            return 'padding-0';
        case ContainerPaddingOptions.Padding16:
            return 'padding-16';
        case ContainerPaddingOptions.Padding24:
            return 'padding-24';
        case ContainerPaddingOptions.Padding32:
            return 'padding-32';
        case ContainerPaddingOptions.Padding48:
            return 'padding-48';
        default:
            return undefined;
    }
};

export const getTextBlockTextPositionClassName = (
    textPosition?: TextPosition,
    isTitle: boolean = true,
): Nullable<string> => {
    const blockName = 'text-block';
    const elementName = isTitle ? 'header' : 'description';
    const classNameTemplate = `${blockName}__${elementName}`;

    switch (textPosition) {
        case TextPosition.Center:
            return `${classNameTemplate}--centered`;
        case TextPosition.Left:
            return isTitle ? `${classNameTemplate}--left` : '';
        case TextPosition.Right:
            return `${classNameTemplate}--right`;
        default:
            return null;
    }
};

export const getPaddingTopClassName = (paddingSize?: PaddingTopOptions): Nullable<string> => {
    switch (paddingSize) {
        case PaddingTopOptions.Padding32:
            return 'padding-top-32';
        case PaddingTopOptions.Padding64:
            return 'padding-top-64';
        case PaddingTopOptions.PaddingMobile32:
            return 'padding-top-mobile-32';
        default:
            return undefined;
    }
};

export const getPaddingBottomClassName = (paddingSize?: PaddingBottomOptions): Nullable<string> => {
    switch (paddingSize) {
        case PaddingBottomOptions.Padding32:
            return 'padding-bottom-32';
        case PaddingBottomOptions.Padding64:
            return 'padding-bottom-64';
        case PaddingBottomOptions.PaddingMobile32:
            return 'padding-bottom-mobile-32';
        default:
            return undefined;
    }
};
