import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IShortlistsSitecoreFields } from 'frontend/components/renderings/Shortlists/interfaces';

export const mockShortlistFields: IShortlistsSitecoreFields = {
    RedirectButtonLabel: mockSitecoreField('Redirect Button Label'),
    RedirectDescription: mockSitecoreField('Redirect Description'),
    RedirectTitle: mockSitecoreField('Redirect Title'),
    Title: mockSitecoreField('test'),
    EditListCTA: mockSitecoreField('EditListCTA'),
    CompareWarningDescription: mockSitecoreField('CompareWarningDescription'),
    CompareWarningTitle: mockSitecoreField('CompareWarningTitle'),
    SelectedHolidaysPluralLabel: mockSitecoreField('HOLIDAYS SELECTED'),
    SelectedHolidaysSingularLabel: mockSitecoreField('HOLIDAY SELECTED'),
};
