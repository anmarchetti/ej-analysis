import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ContainerPaddingOptions, TitleFontStyle } from 'models/enum/CustomisableComponentsParameters';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';

import TilesCarousel from './TilesCarousel';
import * as utils from './TilesCarousel.utils';
import { ICarouselTile, TilesCarouselVariant, TTilesCarouselProps } from './TilesCarouselInterfaces';

const createProps = (): TTilesCarouselProps => ({
    fields: {
        IsLuxuryExclusive: mockSitecoreField(false),
        Tiles: [
            {
                fields: {
                    Title: mockSitecoreField('title 1'),
                    Image: mockSitecoreField({ src: 'image.jpg' }),
                },
            },
            {
                fields: {
                    Title: mockSitecoreField('title 2'),
                    Image: mockSitecoreField({ src: 'image.jpg' }),
                },
            },
        ] as ISitecoreCompositeField<ICarouselTile>[],
        Title: mockSitecoreField('test'),
        Variant: mockSitecoreField(TilesCarouselVariant.TextOnImage),
        UseHotelTiles: mockSitecoreField(false),
    },
    params: {},
    rendering: {},
});

let mockProps: TTilesCarouselProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockTextOnImageVariant = jest.fn();
jest.mock('frontend/components/renderings/TilesCarousel/TextOnImageVariant/TextOnImageVariant', () => ({
    __esModule: true,
    default: props => {
        mockTextOnImageVariant(props);

        return <div data-tid='text-on-image-variant' />;
    },
}));

const mockInformationBelowTilesVariant = jest.fn();
jest.mock(
    'frontend/components/renderings/TilesCarousel/InformationBelowTilesVariant/InformationBelowTilesVariant',
    () => ({
        __esModule: true,
        default: props => {
            mockInformationBelowTilesVariant(props);

            return <div data-tid='information-below-tiles-variant' />;
        },
    }),
);

describe('<TilesCarousel />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should NOT render when fields are empty', () => {
        mockProps.fields = undefined;

        const { container } = render(<TilesCarousel {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when Tiles are empty', () => {
        mockProps.fields!.Tiles = [];

        const { container } = render(<TilesCarousel {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when IsLuxuryExclusive is true and isLuxuryPackage is false', () => {
        mockProps.fields!.IsLuxuryExclusive.value = true;

        const { container } = render(<TilesCarousel {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when Variant is NOT supported', () => {
        mockProps.fields!.Variant.value = 'test' as TilesCarouselVariant;

        const { container } = render(<TilesCarousel {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render TextOnImageVariant', () => {
        render(<TilesCarousel {...mockProps} />);

        expect(screen.getByTestId('text-on-image-variant')).toBeInTheDocument();
        expect(mockTextOnImageVariant).toHaveBeenCalledWith({
            ...mockProps.fields,
            titleClassName: '',
            wrapperClassName: '',
            titleTag: 'p',
        });
    });

    it('should render InformationBelowTiles', () => {
        mockProps.fields!.Variant.value = TilesCarouselVariant.InformationBelowTiles;

        render(<TilesCarousel {...mockProps} />);

        expect(screen.getByTestId('information-below-tiles-variant')).toBeInTheDocument();
        expect(mockInformationBelowTilesVariant).toHaveBeenCalledWith({
            ...mockProps.fields,
            titleClassName: '',
            wrapperClassName: '',
            titleTag: 'p',
        });
    });

    it('should render TextOnImageVariant with params from props', () => {
        mockProps.params = {
            TitleTag: 'h1',
            PaddingSize: ContainerPaddingOptions.Padding16,
            TitleFontStyle: TitleFontStyle.Unbounded,
        };
        render(<TilesCarousel {...mockProps} />);

        expect(mockTextOnImageVariant).toHaveBeenCalledWith({
            ...mockProps.fields,
            titleClassName: 'font-unbounded-sans',
            wrapperClassName: 'padding-16',
            titleTag: 'h1',
        });
    });

    it('should NOT render when Tiles are empty', () => {
        jest.spyOn(utils, 'useHotelTiles').mockReturnValue([]);

        const { container } = render(<TilesCarousel {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
