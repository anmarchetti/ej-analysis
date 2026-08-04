import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IRequestedPrice } from 'models/data/IRequestedPrice';
import { MediaSize } from 'models/data/MediaSizeParams';

import DealsDestinationsGroupCard, { IDealsDestinationsGroupCardProps } from './DealsDestinationsGroupCard';

const createProps = (): IDealsDestinationsGroupCardProps => ({
    fields: {
        Title: mockSitecoreField('Test'),
        Country: {
            fields: {
                Name: mockSitecoreField('country'),
                Code: mockSitecoreField('countryCode'),
                Image: mockSitecoreField(mockSitecoreImageField('countryImage')),
                PageCategory: mockSitecoreField('countryPageCategory'),
            },
            id: 'country-id',
        },
        Image: mockSitecoreField(mockSitecoreImageField('Image')),
        Tiles: [],
    },
    requestedSearchUrl: 'url',
    pricesByDestCodes: { ES: { value: { geog: 'ES' } }, get: jest.fn(p => p) } as unknown as Map<
        string,
        IRequestedPrice
    >,
    setIsTouristTaxTooltipDisplayed: jest.fn(),
});

const createStores = () => ({
    layoutStore: {
        isHolidayTypePage: true,
        isDealsHubPage: true,
        isEditMode: false,
    },
    trackingStore: { trackHolidayTypesHubEvents: jest.fn() },
    appStore: { isScreenLessMedium: false },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockJSSImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSImageProps(props);

        return <div data-tid='jss-image' />;
    },
}));

jest.mock('../DealsDestinationTile/DealsDestinationTile', () => () => (
    <div className='tile' key={mockProps.fields.Tiles[0].id} />
));

describe('<DealsDestinationsGroupCard />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render', () => {
        mockProps.fields = null;
        const { container } = render(<DealsDestinationsGroupCard {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render title without overlay', () => {
        render(<DealsDestinationsGroupCard {...mockProps} />);

        expect(screen.getByRole('heading')).not.toHaveClass('link-pseudo-overlay');
        expect(screen.getByRole('heading')).toHaveTextContent(mockProps.fields.Title.value);
    });

    it('should render title with overlay', () => {
        mockProps.fields.Title = null;
        render(<DealsDestinationsGroupCard {...mockProps} />);

        expect(screen.getByText('country')).toHaveClass('link-pseudo-overlay');
        expect(screen.getByRole('heading')).toHaveTextContent('country');
    });

    it('should NOT render title', () => {
        mockProps.fields.Title = null;
        mockProps.fields.Country = null;
        render(<DealsDestinationsGroupCard {...mockProps} />);

        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should NOT render DealsDestinationTiles', () => {
        const { container } = render(<DealsDestinationsGroupCard {...mockProps} />);

        expect(container.getElementsByClassName('tile').length).toBe(0);
    });

    it('should render DealsDestinationTiles', () => {
        mockProps.fields.Tiles = [{ id: 1 }];
        const { container } = render(<DealsDestinationsGroupCard {...mockProps} />);

        expect(container.getElementsByClassName('tile').length).toBe(1);
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockJSSImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.fields.Image,
                fill: true,
                mediaSize: {
                    desktop: MediaSize.Large,
                },
            }),
        );
    });

    it('Should NOT render image in edit mode', () => {
        mockStores.layoutStore.isEditMode = true;
        render(<DealsDestinationsGroupCard {...mockProps} />);

        expect(screen.queryByTestId('jss-image')).not.toBeInTheDocument();
    });
});
