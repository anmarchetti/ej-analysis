import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ICompareDealsFields } from 'frontend/components/renderings/CompareDeals/CompareDeals';

export const mockCompareFields: ICompareDealsFields = {
    CompareLabel: mockSitecoreField('CompareLabel'),
    CancelCompareButton: mockSitecoreField('Cancel Comparison'),
    CompareCTA: mockSitecoreField('Compare holidays'),
    CompareMobileCTA: mockSitecoreField('CompareMobileCTA'),
    ViewCompareButton: mockSitecoreField('View Comparison'),
    ComparisonCriteria: [],
    FallbackLabel: mockSitecoreField('N/A'),
    SelectedHolidaysLabel: mockSitecoreField('SELECTED HOLIDAYS'),
};
