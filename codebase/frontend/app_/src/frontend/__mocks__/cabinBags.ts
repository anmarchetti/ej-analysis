import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { ICabinBagsFields } from 'models/data/ICabinBagsFields';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { mockAncillariesChildren } from 'frontend/components/renderings/SeatAndBags/__mocks__/mockSeatAndBagsFields';

export const mockCabinBagsFields: ICabinBagsFields = {
    Children: mockAncillariesChildren,
    CollapseOpen: mockSitecoreField('Close'),
    CollapseClose: mockSitecoreField('View and edit passenger cabin bags'),
    OutboundIcon: mockSitecoreField(mockSitecoreImageField('OutboundIcon')),
    ReturnIcon: mockSitecoreField(mockSitecoreImageField('ReturnIcon')),
    Title: mockSitecoreField('Your Cabin bags'),
    DefaultContent: {
        fields: {
            Subtitle: mockSitecoreField('Add extra cabin bags and Speedy Boarding'),
            Description: mockSitecoreField(
                'Get an extra 10kg cabin bag, and Speedy Boarding for just {price} per person, per flight',
            ),
        },
        id: '1',
    },
    LuxuryContent: {
        fields: {
            Subtitle: mockSitecoreField('Add extra cabin bags and Speedy Boarding'),
            Description: mockSitecoreField(
                'Get an extra 10kg cabin bag, and Speedy Boarding for just {price} per person, per flight',
            ),
        },
        id: '2',
    },
    Icon: mockSitecoreField(mockSitecoreImageField('Icon')),
    CabinBagPriceLabel: mockSitecoreField('Add for <strong>{price}</strong><br><small> per person, per flight</small>'),
    SpeedyBoardingLabel: mockSitecoreField('Includes Speedy Boarding'),
    AddCabinBagLabel: mockSitecoreField('Add for all passengers'),
    SpeedyBoardingIcon: mockSitecoreField(mockSitecoreImageField('SpeedyBoardingIcon')),
    IncludedBagsLabel: mockSitecoreField('{count} x small under seat bags'),
    IncludedWithInfantLabel: mockSitecoreField('{count} x small under seat bags, {infantCount} x baby change bags'),
    OverheadBagLabel: mockSitecoreField('No large overhead cabin bags. No speedy boarding'),
    IncludedIcon: mockSitecoreField(mockSitecoreImageField('IncludedIcon')),
    OverheadIcon: mockSitecoreField(mockSitecoreImageField('OverheadIcon')),
    SmallBagDropdownLabel: mockSitecoreField('Small under seat bag'),
    SmallBagDropdownWithInfantLabel: mockSitecoreField('SmallBagDropdownWithInfantLabel'),
    OverheadBagDropdownLabel: mockSitecoreField('Add a large over head cabin bag (10kg) and Speedy Boarding'),
    IncludedLabel: mockSitecoreField('(included)'),
    UnavailableLCBContent: {
        fields: {
            Subtitle: mockSitecoreField('Adding large cabin bags is currently unavailable'),
            Description: mockSitecoreField(
                'We are sorry, the ability to add large cabin bags is currently unavailable for this flight. You can still book your holiday and add large cabin bags at a later stage',
            ),
        },
        id: '1',
    },
    RequestFailureBanner: {
        fields: {
            ButtonLabel: mockSitecoreField(''),
            Title: mockSitecoreField('RequestFailureBannerTitle'),
            Subtitle: mockSitecoreField('RequestFailureBannerSubtitle'),
            Link: mockSitecoreField(mockSitecoreLinkField()),
        },
        id: '1',
    },
    InternalFlightBanner: {
        fields: {
            ButtonLabel: mockSitecoreField(''),
            Title: mockSitecoreField('Looking to add more bags?'),
            Subtitle: mockSitecoreField(
                'Cabin bags will be available for purchase 30 days before the flight departs. Please check back then to upgrade your cabin bag allowance',
            ),
            Link: mockSitecoreField(mockSitecoreLinkField()),
        },
        id: '1',
    },
    OverheadBagAddedLabel: mockSitecoreField('{count} x small under seat bags'),
    OverheadBagAddedDropdownLabel: mockSitecoreField('{count} x large overhead cabin bags(10kg) with speedy boarding'),
    OverheadAddedIcon: mockSitecoreField(mockSitecoreImageField('OverheadAddedIcon')),
    AddButtonLabel: mockSitecoreField('Add'),
    DescriptionWithoutPrice: mockSitecoreField('DescriptionWithoutPrice'),
    CabinBagsFullBanner: {
        fields: {
            ButtonLabel: mockSitecoreField(''),
            Title: mockSitecoreField('Large cabin bag capacity is full'),
            Subtitle: mockSitecoreField('These flights have reached their capacity for additional large cabin bags.'),
            Link: mockSitecoreField(mockSitecoreLinkField()),
        },
        id: '1',
    },
    CabinBagsFullWithHLBanner: {
        fields: {
            ButtonLabel: mockSitecoreField('Add hold luggage'),
            Title: mockSitecoreField('Large cabin bag capacity is full with Hold Luggage'),
            Subtitle: mockSitecoreField(
                'These flights have reached their capacity for additional large cabin bags. If you wish to bring more bags, please do so by adding hold luggage with Hold Luggage',
            ),
            Link: mockSitecoreField(mockSitecoreLinkField()),
        },
        id: '1',
    },
    CabinBagsUnavailableContent: {
        fields: {
            ButtonLabel: mockSitecoreField(''),
            Title: mockSitecoreField('Adding cabin bags is currently unavailable'),
            Subtitle: mockSitecoreField(
                "We're sorry, the ability to add large cabin bags is currently unavailable for this flight. You can still book your holiday and add large cabin bags at a later stage",
            ),
            Link: mockSitecoreField(mockSitecoreLinkField()),
        },
        id: '1',
    },
    CabinBagsUnavailableCTAContent: {
        fields: {
            ButtonLabel: mockSitecoreField('Add hold luggage'),
            Title: mockSitecoreField('Adding cabin bags is currently unavailable CTA'),
            Subtitle: mockSitecoreField(
                "We're sorry, the ability to add large cabin bags is currently unavailable for this flight. You can still book your holiday and add large cabin bags at a later stage CTA",
            ),
            Link: mockSitecoreField(mockSitecoreLinkField()),
        },
        id: '1',
    },
    AddLCBLabel: mockSitecoreField('AddLCBLabel'),
    CabinBagsAlmostFullBanner: {
        fields: {
            ButtonLabel: mockSitecoreField(''),
            Title: mockSitecoreField('Large cabin bag capacity is almost full'),
            Subtitle: mockSitecoreField(
                'There is not enough space on one or more flights for all passengers in your booking to add a large cabin bag.',
            ),
            Link: mockSitecoreField(mockSitecoreLinkField()),
        },
        id: '1',
    },
    UnavailablePostBookContent: {
        fields: {
            ButtonLabel: mockSitecoreField(''),
            Title: mockSitecoreField('Adding cabin bags is currently unavailable on easyJet Holidays'),
            Subtitle: mockSitecoreField(
                "We're sorry, the ability to add large cabin bags is currently unavailable on this website. You may be able to add more cabin bags on the airline website, at easyjet.com.",
            ),
            Link: mockSitecoreField(mockSitecoreLinkField('/', 'link', SitecoreLinkType.External)),
        },
        id: '1',
    },
    AddMaxCabinBagsButton: mockSitecoreField('Add maximum cabin bags'),
    NoMoreLCBCapacityLabel: mockSitecoreField('There is no more capacity for large cabin bags on these flights'),
    OutOfSyncBanner: {
        fields: {
            Title: mockSitecoreField('Looking to add more bags?'),
            Subtitle: mockSitecoreField(
                "We can't get the bags information for the flight on this holiday package, but don't worry, any bags you have previously booked will be still valid. In the meantime, you can check on easyjet.com or the easyJet app to see your allowance",
            ),
            Link: mockSitecoreField(mockSitecoreLinkField('/', 'link', SitecoreLinkType.External)),
            ButtonLabel: mockSitecoreField('Go to easyJet.com'),
        },
        id: '1',
    },
    OutlineBannerTextContent: mockSitecoreField('Add an extra cabin bag, and make sure you have everything you need!'),
    UrgencyMessageCabinBagsThreshold: mockSitecoreField(50),
    UrgencyMessageText: mockSitecoreField('Only {avail} large cabin bags left.'),
    UrgencyMessageTooltipText: mockSitecoreField(
        'This is the number of cabin bags remaining on the flight right now. There may be more available at a later date.',
    ),
    itemUrgencyMessageText: mockSitecoreField('Only {avail} large cabin bags left.'),
    CollapseOpenViewOnly: mockSitecoreField('View cabin bags'),
};

export const mockCabinBagsInfoFields = {
    OverheadAddedIcon: mockSitecoreField(mockSitecoreImageField('OverheadAddedIcon')),
    OverheadBagAddedLabel: mockSitecoreField('OverheadBagAddedLabel {count}'),
    IncludedBagsLabel: mockSitecoreField('IncludedBagsLabel'),
    IncludedIcon: mockSitecoreField(mockSitecoreImageField('IncludedIcon')),
    IncludedWithInfantLabel: mockSitecoreField('IncludedWithInfantLabel'),
    SpeedyBoardingTooltip: mockSitecoreField('SpeedyBoardingTooltip'),
};
