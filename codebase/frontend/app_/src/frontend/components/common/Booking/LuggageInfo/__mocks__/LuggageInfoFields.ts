import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ILuggageInfoFields } from 'frontend/components/common/Booking/LuggageInfo/LuggageInfo';

const luggageInfoFieldsMocks = (): ILuggageInfoFields => ({
    LuggageInfoTitle: mockSitecoreField('LuggageInfoTitle'),
    PramName: mockSitecoreField('PramName'),
    SportEquipmentsLabel: mockSitecoreField('SportEquipmentsLabel'),
});

export default luggageInfoFieldsMocks;
