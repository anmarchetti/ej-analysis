import { Field } from '@sitecore-jss/sitecore-jss/types/layout/models';

export const isField = (obj: any): obj is Field =>
    obj !== null && typeof obj === 'object' && 'value' in obj && !Array.isArray(obj);
