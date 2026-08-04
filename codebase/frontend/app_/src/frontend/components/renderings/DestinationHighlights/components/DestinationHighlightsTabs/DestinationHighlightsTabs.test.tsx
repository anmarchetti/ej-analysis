import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { IDestinationHighlightTabItem } from 'models/data/IDestinationHighlightTabItem';

import DestinationHighlightsTabs from './DestinationHighlightsTabs';

const mockImageFilterProps = jest.fn();
jest.mock('frontend/components/common/ImageWithFilter/ImageWithFilter', () => ({
    __esModule: true,
    SVGFilterMatrix: {
        Grayscale: 'Grayscale',
        Orange: 'Orange',
    },
    default: props => {
        mockImageFilterProps(props);

        return <div data-tid='image-with-filter' />;
    },
}));

const createStores = () => ({
    appStore: {
        isScreenLessMedium: false,
    },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const resetMocks = () =>
    ({
        activeTabId: 'id1',
        setActiveTabId: jest.fn(),
        tabs: [
            {
                id: 'id1',
                fields: {
                    Title: { value: 'Title 1' },
                    Icon: { value: { src: '/tab1_icon' } },
                    Highlights: [
                        {
                            id: 'test id',
                            fields: {
                                Title: { value: 'Title test' },
                                Description: { value: 'Description test' },
                                Image: { value: { src: 'Title test' } },
                            },
                        },
                        {
                            id: 'test id 2',
                            fields: {
                                Title: { value: 'Title test 2' },
                                Description: { value: 'Description test 2' },
                                Image: { value: { src: 'Title test 2' } },
                            },
                        },
                        {
                            id: 'test id 3',
                            fields: {
                                Title: { value: 'Title test 3' },
                                Description: { value: 'Description test 3' },
                                Image: { value: { src: 'Title test 3' } },
                            },
                        },
                    ],
                },
            },
            {
                id: 'id2',
                fields: {
                    Title: { value: 'Title 2' },
                    Icon: { value: { src: '/tab2_icon' } },
                    Highlights: [
                        {
                            id: 'test id',
                            fields: {
                                Title: { value: 'Title test' },
                                Description: { value: 'Description test' },
                                Image: { value: { src: 'Title test' } },
                            },
                        },
                    ],
                },
            },
        ] as IDestinationHighlightTabItem[],
    } as any);

let mocks;

describe('<DestinationHighlightsTabs />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should render standard', () => {
        const { container } = render(<DestinationHighlightsTabs {...mocks} />);

        expect(screen.getAllByTestId('destination-highlights-tab')[0]).toBeInTheDocument();
        expect(mockImageFilterProps).toHaveBeenCalledWith(
            expect.objectContaining({
                filterMatrix: 'Grayscale',
                imageSrc: mocks.tabs[0].fields.Icon.value.src,
                className: 'tabIcon',
            }),
        );
        expect(mockImageFilterProps).toHaveBeenCalledWith(
            expect.objectContaining({
                filterMatrix: 'Orange',
                imageSrc: mocks.tabs[1].fields.Icon.value.src,
                className: 'tabIcon',
            }),
        );
        expect(screen.getAllByRole('button')[0]).toHaveTextContent(mocks.tabs[0].fields.Title.value);
        expect(screen.getAllByRole('button')[1]).toHaveTextContent(mocks.tabs[1].fields.Title.value);
        expect(container.querySelector('.wrapper')).toBeInTheDocument();
        expect(container.querySelectorAll('.tab')).toHaveLength(2);
        expect(container.querySelectorAll('.activeTab')).toHaveLength(1);
    });

    it('should call setActiveTabId', () => {
        mocks = { ...mocks, tabs: [mocks.tabs[0]] };
        render(<DestinationHighlightsTabs {...mocks} />);

        fireEvent.click(screen.getByRole('button'), { preventDefault: jest.fn() });

        expect(mocks.setActiveTabId).toHaveBeenCalledWith(mocks.tabs[0].id);
    });
});
