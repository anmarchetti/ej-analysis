import React from 'react';
import { render, screen } from '@testing-library/react';

import { DataStatus } from 'models/enum/DataStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import PromoPageSearchPodDescription from './PromoPageSearchPodDescription';

const createProps = () => ({
    PromoDescription: { value: 'Description' },
    EnableSeoReadMoreText: '1',
    rendering: {},
});

const createStores = () => ({
    appStore: { isScreenLessMedium: false },
    layoutStore: {
        getPhrase: jest.fn(),
    },
    hotelsStore: { status: DataStatus.Loaded },
    searchFiltersStore: { isFiltersLoadingScreenDisplayed: false },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => () => <div data-tid='reach-text' />);

const mockSeoReadMoreTextBlockComponent = jest.fn();
jest.mock('frontend/components/common/SeoReadMoreTextBlock', () => ({
    __esModule: true,
    default: props => {
        mockSeoReadMoreTextBlockComponent(props);

        return <div data-tid='seo-read-more-text-block' />;
    },
}));

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder' />;
    },
}));

describe('<PromoPageSearchPodDescription />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if no description', () => {
        mockProps.PromoDescription.value = null;
        const { container } = render(<PromoPageSearchPodDescription {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when isFiltersLoadingScreenDisplayed is true', () => {
        mockStores.searchFiltersStore.isFiltersLoadingScreenDisplayed = true;
        const { container } = render(<PromoPageSearchPodDescription {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render SeoReadMoreTextBlock component if EnableSeoReadMoreText is selected', () => {
        render(<PromoPageSearchPodDescription {...mockProps} />);

        expect(screen.getByTestId('seo-read-more-text-block')).toBeInTheDocument();
        expect(mockSeoReadMoreTextBlockComponent).toHaveBeenCalledWith({
            className: 'promopage-search-pod-description',
            text: mockProps.PromoDescription.value,
            dataTid: 'promopage-search-pod-description',
        });
        expect(screen.queryByTestId('reach-text')).not.toBeInTheDocument();
    });

    it('should render RichTextWithLinks component if EnableSeoReadMoreText is NOT selected', () => {
        mockProps.EnableSeoReadMoreText = undefined;
        render(<PromoPageSearchPodDescription {...mockProps} />);

        expect(screen.getByTestId('reach-text')).toBeInTheDocument();
        expect(screen.queryByTestId('seo-read-more-text-block')).not.toBeInTheDocument();
    });

    it('should render 2 placeholders', () => {
        render(<PromoPageSearchPodDescription {...mockProps} />);

        expect(screen.getAllByTestId('placeholder')).toHaveLength(2);
        expect(mockPlaceholderProps).toHaveBeenNthCalledWith(1, {
            name: PlaceholderNames.InformationTiles,
            rendering: {},
        });
        expect(mockPlaceholderProps).toHaveBeenNthCalledWith(2, {
            name: PlaceholderNames.TilesCarousel,
            rendering: {},
        });
    });
});
