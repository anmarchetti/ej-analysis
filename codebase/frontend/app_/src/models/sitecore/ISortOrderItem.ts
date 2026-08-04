import { ISitecoreField } from './generic/ISitecoreField';

export interface ISortOrderItem<T = string, U = string> {
    fields: {
        Code: ISitecoreField<T>;
        Title: ISitecoreField<U>;
    };
    id: string;
}
