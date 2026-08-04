import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

export interface IRequestedSearchFields {
    Enabled: ISitecoreField<boolean>;
    Name: ISitecoreField<string>;
}
