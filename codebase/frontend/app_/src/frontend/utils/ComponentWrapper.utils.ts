import classNames from 'classnames';

import { IAnchorParameters } from 'models/data/IAnchorParameters';
import { PaddingBottomOptions, PaddingTopOptions } from 'models/enum/CustomisableComponentsParameters';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';

import { getPaddingBottomClassName, getPaddingTopClassName } from './componentStylesCustomisation.utils';
import { isSitecoreCheckboxSelected } from './sitecore.utils';

export interface IComponentWrapperSitecoreParams extends IAnchorParameters {
    IsBorderBottom: TSitecoreCheckboxValue;
    IsFullWidth: TSitecoreCheckboxValue;
    IsGreyBackground: TSitecoreCheckboxValue;
    IsSticky: TSitecoreCheckboxValue;
    IsTriangleEnd: TSitecoreCheckboxValue;
    IsTriangleEndReverse: TSitecoreCheckboxValue;
    IsTriangleReverse: TSitecoreCheckboxValue;
    IsTriangleStart: TSitecoreCheckboxValue;
    IsTriangleStartReverse: TSitecoreCheckboxValue;
    PaddingBottom: PaddingBottomOptions;
    PaddingBottomMobile: PaddingBottomOptions;
    PaddingTop: PaddingTopOptions;
    PaddingTopMobile: PaddingTopOptions;
}
export const containerClassName = (params: Partial<IComponentWrapperSitecoreParams>): string =>
    classNames(
        'wrapper-component-container',
        isSitecoreCheckboxSelected(params.IsGreyBackground) && 'wrapper-component-container--grey',
        isSitecoreCheckboxSelected(params.IsFullWidth) && 'wrapper-component-container--full-width',
        isSitecoreCheckboxSelected(params.IsBorderBottom) && 'wrapper-component-container--border-bottom',
        isSitecoreCheckboxSelected(params.IsSticky) && 'wrapper-component-container--sticky',
    );

export const shapeClassName = (params: Partial<IComponentWrapperSitecoreParams>): string =>
    classNames(
        'wrapper-shape',
        isSitecoreCheckboxSelected(params.IsTriangleStart) && 'wrapper-shape--start',
        isSitecoreCheckboxSelected(params.IsTriangleEnd) && 'wrapper-shape--end',
        isSitecoreCheckboxSelected(params.IsTriangleStartReverse) && 'wrapper-shape--start-reverse',
        isSitecoreCheckboxSelected(params.IsTriangleEndReverse) && 'wrapper-shape--end-reverse',
    );

export const paddingClassName = (params: Partial<IComponentWrapperSitecoreParams>): string =>
    classNames(
        getPaddingTopClassName(params.PaddingTop),
        getPaddingBottomClassName(params.PaddingBottom),
        getPaddingTopClassName(params.PaddingTopMobile),
        getPaddingBottomClassName(params.PaddingBottomMobile),
    );
