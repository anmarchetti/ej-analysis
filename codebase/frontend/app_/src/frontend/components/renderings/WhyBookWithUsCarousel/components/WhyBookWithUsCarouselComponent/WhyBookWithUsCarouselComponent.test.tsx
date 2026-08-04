import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { InformationTilesTheme } from 'models/enum/InformationTilesTheme';

import WhyBookWithUsCarouselComponent, { TConfidenceCarouselABProps } from './WhyBookWithUsCarouselComponent';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockTooltipProps = jest.fn();

jest.mock('react-tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children, ...props }) => {
        mockTooltipProps(props);

        return <div data-tid={'tooltip'}>{children}</div>;
    },
}));

jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='desktop-carousel'>{children}</div>,
}));

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

const resetMocks = (): TConfidenceCarouselABProps => ({
    fields: {
        Children: [
            {
                displayName: '',
                name: '',
                id: '1',
                fields: {
                    Icon: mockSitecoreField(mockSitecoreImageField('image')),
                    Title: mockSitecoreField('Title'),
                    Description: mockSitecoreField('Description'),
                },
            },
            {
                displayName: '',
                name: '',
                id: '2',
                fields: {
                    Icon: mockSitecoreField(mockSitecoreImageField('image')),
                    Title: mockSitecoreField('Title'),
                    Description: mockSitecoreField('Description'),
                },
            },
            {
                displayName: '',
                name: '',
                id: '3',
                fields: {
                    Icon: mockSitecoreField(mockSitecoreImageField('image')),
                    Title: mockSitecoreField('Title'),
                    Description: mockSitecoreField('Description'),
                },
            },
            {
                displayName: '',
                name: '',
                id: '4',
                fields: {
                    Icon: mockSitecoreField(mockSitecoreImageField('image')),
                    Title: mockSitecoreField('Title'),
                    Description: mockSitecoreField('Description'),
                },
            },
            {
                displayName: '',
                name: '',
                id: '5',
                fields: {
                    Icon: mockSitecoreField(mockSitecoreImageField('image')),
                    Title: mockSitecoreField('Title'),
                    Description: mockSitecoreField('Description'),
                },
            },
            {
                displayName: '',
                name: '',
                id: '6',
                fields: {
                    Icon: mockSitecoreField(mockSitecoreImageField('image')),
                    Title: mockSitecoreField('Title'),
                    Description: mockSitecoreField('Description'),
                },
            },
        ],
    },
    rendering: '',
    params: {
        Theme: InformationTilesTheme.GlobalVariant,
    },
});

let mockStores;
let mockProps = resetMocks();

describe('<WhyBookWithUsCarouselComponent>', () => {
    beforeEach(() => {
        mockProps = resetMocks();
        mockStores = createMockStores({
            appStore: { isScreenMedium: true },
        });
    });

    it('Should render component', () => {
        mockStores.appStore.isScreenMedium = true;

        const { getByTestId, getAllByTestId } = render(<WhyBookWithUsCarouselComponent {...mockProps} />);
        expect(getByTestId('desktop-carousel')).toBeInTheDocument();
        expect(getAllByTestId('carousel-item')).toHaveLength(mockProps!.fields!.Children.length);
    });

    it('Should render component correct number items', () => {
        mockStores.appStore.isScreenMedium = false;
        const { queryByTestId } = render(<WhyBookWithUsCarouselComponent {...mockProps} />);
        expect(screen.getAllByTestId('carousel-item')).toHaveLength(mockProps!.fields!.Children.length);

        expect(queryByTestId('tooltip')).not.toBeInTheDocument();
    });

    it('Should render tooltip', () => {
        render(<WhyBookWithUsCarouselComponent {...mockProps} />);
        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('Should not render component Tooltip on Mobile Devices', () => {
        mockStores.appStore.isScreenMedium = false;
        const { queryByTestId } = render(<WhyBookWithUsCarouselComponent {...mockProps} />);
        expect(queryByTestId('tooltip')).not.toBeInTheDocument();
    });

    it('Should not render component', () => {
        mockProps!.fields!.Children = [] as any;
        const { queryByTestId } = render(<WhyBookWithUsCarouselComponent {...mockProps} />);
        expect(queryByTestId("carousel-item'")).not.toBeInTheDocument();
    });
});
