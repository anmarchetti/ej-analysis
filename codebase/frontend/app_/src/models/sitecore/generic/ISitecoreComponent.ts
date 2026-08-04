import { ComponentFields, ComponentParams } from '@sitecore-jss/sitecore-jss-nextjs';

export interface ISitecoreComponent<T = ComponentFields, P = ComponentParams> {
    fields: T | undefined;
    params: P;
    rendering: any;
}
