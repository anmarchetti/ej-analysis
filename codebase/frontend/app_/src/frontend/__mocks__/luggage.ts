import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IExtraLuggageInfo } from 'models/data/IFlightExtras';
import { IBenefit } from 'models/data/ISeatsAndBagsFields';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';

import { generateLuggageInfoItemMock } from './extraLuggage';

export const mockLuggageInfo: IExtraLuggageInfo = {
    items: [
        generateLuggageInfoItemMock('1', '123456', 'BAG.23', 'BAGE', 2, 30),
        generateLuggageInfoItemMock('1', '789012', 'LUG.23', 'BAGE', 1, 30),
    ],
};

export const mockLuggageBenefit: IBenefit = {
    Code: { value: 'B0001' },
    Description: { value: 'Maximum size 45 x 36 x 20 cm. Must fit under the seat in front of you.' },
    Icon: {
        value: { alt: '', src: 'Icon' },
    },
    Name: { value: 'Small under seat bag' },
};

export const mockLuggageListFields: { ReadMoreLink: ISitecoreField<ISitecoreLink> } = {
    ReadMoreLink: mockSitecoreField({
        href: 'href',
        text: 'text',
        linktype: SitecoreLinkType.External,
    }),
};
