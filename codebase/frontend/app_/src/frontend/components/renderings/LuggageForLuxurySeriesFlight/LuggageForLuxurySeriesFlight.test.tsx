import React from 'react';
import { render, screen, within } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { OutlineBannerTheme } from 'frontend/components/common/OutlineBanner/OutlineBannerTheme';

import LuggageForLuxurySeriesFlight, { TLuggageForLuxurySeriesFlightProps } from './LuggageForLuxurySeriesFlight';

const createProps = (): TLuggageForLuxurySeriesFlightProps => ({
    fields: {
        CabinBagContent: {
            fields: {
                Description: mockSitecoreField('Description 1'),
                Title: mockSitecoreField('Title 1'),
                Icon: mockSitecoreField(mockSitecoreImageField('Icon 1')),
            },
            id: '1',
        },
        HoldLuggageContent: {
            fields: {
                Description: mockSitecoreField('Description 2'),
                Title: mockSitecoreField('Title 2'),
                Icon: mockSitecoreField(mockSitecoreImageField('Icon 2')),
            },
            id: '2',
        },
        CabinBagWithInfantContent: {
            fields: {
                Description: mockSitecoreField('Description 3'),
                Title: mockSitecoreField('Title 3'),
                Icon: mockSitecoreField(mockSitecoreImageField('Icon 3')),
            },
            id: '3',
        },
        HoldLuggageWithInfantContent: {
            fields: {
                Description: mockSitecoreField('Description 4'),
                Title: mockSitecoreField('Title 4'),
                Icon: mockSitecoreField(mockSitecoreImageField('Icon 4')),
            },
            id: '4',
        },
    },
    params: {},
    rendering: {},
});

const createStores = () =>
    createMockStores({
        guestDetailsStore: {
            infants: [],
        },
    });

let mockProps = createProps();
let mockStores = createStores();

const mockOutlineBannerContext = jest.fn();
jest.mock('frontend/components/common/OutlineBanner/OutlineBanner', () => ({
    __esModule: true,
    ...jest.requireActual('frontend/components/common/OutlineBanner/OutlineBanner'),
    default: ({ children }) => <div data-tid='outline-banner'>{children}</div>,
    OutlineBannerContext: {
        Provider: props => {
            mockOutlineBannerContext(props);

            return <div data-tid='outline-banner-context'>{props.children}</div>;
        },
    },
}));

const mockAncillariesMainContent = jest.fn();
jest.mock('frontend/components/common/Ancillaries/components/AncillariesMainContent/AncillariesMainContent', () => ({
    __esModule: true,
    default: props => {
        mockAncillariesMainContent(props);

        return <div data-tid='ancillaries-main-content' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockUseLuxuryInternalFlight = jest.fn().mockReturnValue(false);
jest.mock('frontend/hooks/useLuxuryInternalFlight', () => ({
    useLuxuryInternalFlight: () => mockUseLuxuryInternalFlight(),
}));

describe('<LuggageForLuxurySeriesFlight />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render component with outline banner when it is NOT post booking pages', () => {
        mockUseLuxuryInternalFlight.mockReturnValue(true);

        render(<LuggageForLuxurySeriesFlight {...mockProps} />);

        const outlineBannerContext = screen.getByTestId('outline-banner-context');
        const outlineBanner = within(outlineBannerContext).getByTestId('outline-banner');
        const component = within(outlineBanner).getByTestId('luggage-for-luxury-series-flight');

        expect(component).toBeInTheDocument();

        const ancillariesMainContent = screen.getAllByTestId('ancillaries-main-content');
        expect(ancillariesMainContent).toHaveLength(2);

        const { CabinBagContent, HoldLuggageContent } = mockProps.fields!;
        expect(mockAncillariesMainContent).toHaveBeenNthCalledWith(1, {
            Subtitle: CabinBagContent?.fields.Title,
            Description: CabinBagContent?.fields.Description,
            Icon: CabinBagContent?.fields.Icon,
            dataTid: 'luxury-series-flight',
        });
        expect(mockAncillariesMainContent).toHaveBeenNthCalledWith(2, {
            Subtitle: HoldLuggageContent?.fields.Title,
            Description: HoldLuggageContent?.fields.Description,
            Icon: HoldLuggageContent?.fields.Icon,
            dataTid: 'luxury-series-flight',
        });

        expect(screen.getAllByRole('separator')).toHaveLength(1);

        expect(mockOutlineBannerContext).toHaveBeenCalledWith({
            children: expect.anything(),
            value: { theme: OutlineBannerTheme.LuxuryTheme },
        });

        mockUseLuxuryInternalFlight.mockReturnValue(false);
    });

    it('should render component with post booking pages style', () => {
        mockUseLuxuryInternalFlight.mockReturnValue(true);
        mockStores.layoutStore.isPostBookingPages = true;

        render(<LuggageForLuxurySeriesFlight {...mockProps} />);

        const postBookingContainer = screen.getByTestId('luggage-for-luxury-series-flight-post-book');
        within(postBookingContainer).getByText(SitecoreDictionary.LuggageLabelsBags);

        const component = within(postBookingContainer).getByTestId('luggage-for-luxury-series-flight');
        expect(component).toBeInTheDocument();

        const ancillariesMainContent = screen.getAllByTestId('ancillaries-main-content');
        expect(ancillariesMainContent).toHaveLength(2);

        const { CabinBagContent, HoldLuggageContent } = mockProps.fields!;
        expect(mockAncillariesMainContent).toHaveBeenNthCalledWith(1, {
            Subtitle: CabinBagContent?.fields.Title,
            Description: CabinBagContent?.fields.Description,
            Icon: CabinBagContent?.fields.Icon,
            dataTid: 'luxury-series-flight',
        });
        expect(mockAncillariesMainContent).toHaveBeenNthCalledWith(2, {
            Subtitle: HoldLuggageContent?.fields.Title,
            Description: HoldLuggageContent?.fields.Description,
            Icon: HoldLuggageContent?.fields.Icon,
            dataTid: 'luxury-series-flight',
        });

        expect(screen.queryAllByRole('separator')).toHaveLength(1);

        expect(mockOutlineBannerContext).not.toHaveBeenCalled();

        mockUseLuxuryInternalFlight.mockReturnValue(false);
    });

    it('should render component with infant content when infants are present', () => {
        mockUseLuxuryInternalFlight.mockReturnValue(true);
        mockStores.guestDetailsStore.infants = [{ id: 'infant1' }, { id: 'infant2' }];

        render(<LuggageForLuxurySeriesFlight {...mockProps} />);

        const ancillariesMainContent = screen.getAllByTestId('ancillaries-main-content');
        expect(ancillariesMainContent).toHaveLength(2);

        const { CabinBagWithInfantContent, HoldLuggageWithInfantContent } = mockProps.fields!;
        expect(mockAncillariesMainContent).toHaveBeenNthCalledWith(1, {
            Subtitle: CabinBagWithInfantContent?.fields.Title,
            Description: CabinBagWithInfantContent?.fields.Description,
            Icon: CabinBagWithInfantContent?.fields.Icon,
            dataTid: 'luxury-series-flight',
        });
        expect(mockAncillariesMainContent).toHaveBeenNthCalledWith(2, {
            Subtitle: HoldLuggageWithInfantContent?.fields.Title,
            Description: HoldLuggageWithInfantContent?.fields.Description,
            Icon: HoldLuggageWithInfantContent?.fields.Icon,
            dataTid: 'luxury-series-flight',
        });
    });

    it('should not render component if it is not luxury internal flight', () => {
        mockUseLuxuryInternalFlight.mockReturnValue(false);
        render(<LuggageForLuxurySeriesFlight {...mockProps} />);

        expect(screen.queryByTestId('luggage-for-luxury-series-flight')).not.toBeInTheDocument();
    });

    it('should not render component when fields are undefined', () => {
        mockUseLuxuryInternalFlight.mockReturnValue(true);
        mockProps.fields = undefined;

        render(<LuggageForLuxurySeriesFlight {...mockProps} />);

        expect(screen.queryByTestId('luggage-for-luxury-series-flight')).not.toBeInTheDocument();
    });
});
