import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { createOptimizelyDataMock } from 'frontend/__mocks__/optimizely';
import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import { TWhyBookWithUsCarouselProps, WhyBookWithUsCarousel } from './WhyBookWithUsCarousel';

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='component-wrapper'>{children}</div>,
}));

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, className, onClick }) => (
        <div className={className} onClick={onClick} data-tid='router-link'>
            <span>{children}</span>
        </div>
    ),
}));

const mockConfidenceCarouselProps = jest.fn();

jest.mock(
    'frontend/components/renderings/WhyBookWithUsCarousel/components/WhyBookWithUsCarouselComponent/WhyBookWithUsCarouselComponent',
    () => ({
        __esModule: true,
        default: ({ children, ...props }) => {
            mockConfidenceCarouselProps(props);

            return <div data-tid='carousel'>{children}</div>;
        },
    }),
);

const mockConfidenceCarouselItemABProps = jest.fn();

jest.mock(
    'frontend/components/renderings/WhyBookWithUsCarousel/components/WhyBookWithUsCarouselItem/WhyBookWithUsCarouselItem',
    () => ({
        __esModule: true,
        default: ({ ...props }) => {
            mockConfidenceCarouselItemABProps(props);

            return <div data-tid='carousel-item' />;
        },
    }),
);

const mockJSSImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockJSSImageProps(props);

        return <div data-tid='carousel-image' />;
    },
}));

jest.mock('frontend/components/cro/ExperimentOptimizely/hooks/useOptimizelyData', () => jest.fn(() => mockOptimizely));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createOptimizelyData = () =>
    createOptimizelyDataMock(
        {
            '27451970994': {
                id: '27451970994',
                name: 'URL Targeting for Promo page',
                isActive: true,
            },
        },
        {
            '27396270005': {
                isActive: true,
                experimentName: 'Carousel Experiment',
            },
        },
        {
            '27396270005': {
                id: '27293810666',
                name: 'Variation #1',
                index: 1,
            },
        },
    );

const resetMocks = (): TWhyBookWithUsCarouselProps =>
    ({
        fields: {
            ConfidenceIcon: mockSitecoreField(mockSitecoreImageField('image')),
            ConfidenceInfoTiles: [
                { id: '1', fields: { Title: mockSitecoreField('Tile 1') } },
                { id: '2', fields: { Title: mockSitecoreField('Tile 2') } },
            ],
            ConfidenceLink: mockSitecoreField(
                mockSitecoreLinkField('/Confidence-Link', 'ConfidenceLink', SitecoreLinkType.Internal),
            ),
            ConfidenceText: mockSitecoreField('ConfidenceText'),
            ConfidenceTitle: mockSitecoreField('ConfidenceTitle'),
        },
    } as TWhyBookWithUsCarouselProps);

let mockStores = createMockStores({
    appStore: { isScreenMedium: true },
});
let mockOptimizely = createOptimizelyData();
let mocksProps: TWhyBookWithUsCarouselProps = resetMocks();

describe('<WhyBookWithUsCarousel />', () => {
    beforeEach(() => {
        mocksProps = resetMocks();
        mockStores = createMockStores();
        mockOptimizely = createOptimizelyData();
    });

    it('should render confidence module Desktop version', () => {
        render(<WhyBookWithUsCarousel {...mocksProps} />);
        expect(screen.getByTestId('carousel')).toBeInTheDocument();
        expect(screen.getByTestId('container')).toBeInTheDocument();
        expect(mockConfidenceCarouselProps).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: {
                    Children: [
                        {
                            displayName: 'Tile 1',
                            fields: { Title: mockSitecoreField('Tile 1') },
                            id: '1',
                            name: 'Tile 1',
                        },
                        {
                            displayName: 'Tile 2',
                            fields: { Title: mockSitecoreField('Tile 2') },
                            id: '2',
                            name: 'Tile 2',
                        },
                    ],
                },
                params: { Theme: 'Global Variant' },
            }),
        );
    });

    it('Should render title', () => {
        render(<WhyBookWithUsCarousel {...mocksProps} />);
        expect(screen.getByTestId('containerTitle')).toBeInTheDocument();
    });

    it('Should render not render RouterLink on Desktop Size', async () => {
        render(<WhyBookWithUsCarousel {...mocksProps} />);
        expect(screen.getByTestId('containerTitle')).toBeInTheDocument();
        // Wait for the element with the specified test ID to be present
        await waitFor(() => {
            expect(screen.getByTestId('containerTitle')).toBeInTheDocument();
        });

        expect(screen.queryByTestId('mobileButton')).not.toBeInTheDocument();
    });

    it('Should render RouterLink on Mobile Size', () => {
        mockStores.appStore.isScreenMedium = false;
        render(<WhyBookWithUsCarousel {...mocksProps} />);

        expect(screen.queryByTestId('router-link')).toBeInTheDocument();
    });

    it('should NOT render elements if no fields', () => {
        delete mocksProps.fields;
        const { container } = render(<WhyBookWithUsCarousel {...mocksProps} />);
        expect(container.querySelector('.container')).not.toBeInTheDocument();
    });

    it('should NOT render elements if no OptimazelyData', () => {
        mockOptimizely = null as any;
        const { container } = render(<WhyBookWithUsCarousel {...mocksProps} />);
        expect(container.querySelector('.container')).not.toBeInTheDocument();
    });
});
