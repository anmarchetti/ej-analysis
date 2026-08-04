import { IHealthEntryRequirement } from 'models/data/IBookingInfo';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

export const mockHealthEntryRequirement: IHealthEntryRequirement = {
    trackingLabel: 'trackingLabel',
    title: 'Health Entry Requirement',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    image: 'https://example.com/health-entry-image.png',
    icon: 'https://example.com/health-entry-icon.png',
    cta: {
        text: 'Learn More',
        href: 'https://example.com/health-entry-cta',
        linktype: SitecoreLinkType.Internal,
    },
};
export const mockHealthEntryRequirements: IHealthEntryRequirement[] = [
    mockHealthEntryRequirement,
    { ...mockHealthEntryRequirement, title: 'Health Entry Requirement#2' },
];
