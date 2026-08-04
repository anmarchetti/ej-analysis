import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';

import { isTemplateBelongsToDestinationPage } from './pageTemplate.utils';

describe('pageTemplate.utils', () => {
    describe('isTemplateBelongsToDestinationPage', () => {
        it('should return true when template id is CountryBrowsePage', () => {
            const result = isTemplateBelongsToDestinationPage(SitecoreTemplateId.CountryBrowsePage);

            expect(result).toBe(true);
        });

        it('should return true when template id is RegionBrowsePage', () => {
            const result = isTemplateBelongsToDestinationPage(SitecoreTemplateId.RegionBrowsePage);

            expect(result).toBe(true);
        });

        it('should return true when template id is ResortBrowsePage', () => {
            const result = isTemplateBelongsToDestinationPage(SitecoreTemplateId.ResortBrowsePage);

            expect(result).toBe(true);
        });

        it('should return false when template id is NOT ResortBrowsePage, RegionBrowsePage, CountryBrowsePage', () => {
            const result = isTemplateBelongsToDestinationPage(SitecoreTemplateId.AllHolidayTypesPage);

            expect(result).toBe(false);
        });
    });
});
