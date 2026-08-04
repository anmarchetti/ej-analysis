import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

export interface IUpcomingHolidayBlockFields {
    CTAText: ISitecoreField<string>;
    CountdownTextPlural: ISitecoreField<string>;
    CountdownTextSingular: ISitecoreField<string>;
    HeaderText: ISitecoreField<string>;
}
