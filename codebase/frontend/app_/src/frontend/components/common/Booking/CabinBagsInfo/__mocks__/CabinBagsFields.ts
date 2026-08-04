import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { ICabinBagsInfoFields } from 'frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo';

const cabinBagsFieldsMocks = (): ICabinBagsInfoFields => ({
    IncludedBagsLabel: mockSitecoreField('included'),
    IncludedIcon: mockSitecoreField(mockSitecoreImageField('includedIcon')),
    IncludedWithInfantLabel: mockSitecoreField('included with infant'),
    OverheadAddedIcon: mockSitecoreField(mockSitecoreImageField('overheadIcon')),
    OverheadBagAddedLabel: mockSitecoreField('overhead label'),
    SpeedyBoardingTooltip: mockSitecoreField('SpeedyBoardingTooltip'),
});

export default cabinBagsFieldsMocks;
