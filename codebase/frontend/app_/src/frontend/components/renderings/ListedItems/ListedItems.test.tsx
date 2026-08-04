import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import ListedItems, { IListItemsProps } from './ListedItems';

const mockListedItem = jest.fn();
jest.mock('./ListedItem', () => ({
    __esModule: true,
    default: props => {
        mockListedItem(props);

        return <li data-tid='listed-item' />;
    },
}));

let mockProps: IListItemsProps;

const makeItems = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
        id: String(i + 1),
        icon: { src: `icon${i + 1}.png`, alt: `Icon ${i + 1}` },
        label: `Item ${i + 1}`,
    }));

describe('<ListedItems />', () => {
    beforeEach(() => {
        mockProps = {
            className: 'test-class',
            itemClassName: 'test-item-class',
        };
    });

    it('should render fields when it is provided', () => {
        mockProps.fields = {
            Items: [
                {
                    id: '1',
                    fields: {
                        Icon: mockSitecoreField(mockSitecoreImageField('icon1.png', 'Icon 1')),
                        Label: mockSitecoreField('Item 1'),
                    },
                    displayName: '',
                    name: '',
                },
                {
                    id: '2',
                    fields: {
                        Icon: mockSitecoreField(mockSitecoreImageField('icon2.png', 'Icon 2')),
                        Label: mockSitecoreField('Item 2'),
                    },
                    displayName: '',
                    name: '',
                },
            ],
        };

        render(<ListedItems {...mockProps} />);

        expect(mockListedItem).toHaveBeenNthCalledWith(2, {
            className: 'test-item-class',
            icon: {
                alt: 'Icon 2',
                src: 'icon2.png',
            },
            text: 'Item 2',
        });
        expect(screen.getAllByTestId('listed-item')).toHaveLength(2);
    });

    it('should render custom-items when it is provided', () => {
        mockProps.customItems = [
            { icon: { src: 'icon1.png', alt: 'Icon 1' }, label: 'Item 1' },
            { icon: { src: 'icon2.png', alt: 'Icon 2' }, label: 'Item 2' },
        ];

        render(<ListedItems {...mockProps} />);

        expect(mockListedItem).toHaveBeenNthCalledWith(2, {
            className: 'test-item-class',
            icon: {
                alt: 'Icon 2',
                src: 'icon2.png',
            },
            text: 'Item 2',
        });
        expect(screen.getAllByTestId('listed-item')).toHaveLength(2);
    });

    it('should NOT render when items are not provided', () => {
        const { container } = render(<ListedItems {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('<ListedItems /> – multi-column', () => {
        let mockProps: IListItemsProps;

        beforeEach(() => {
            mockProps = {
                className: 'test-class',
                itemClassName: 'test-item-class',
                isMultiColumn: true,
            };
            mockListedItem.mockClear();
        });

        it('should split items into two columns (5 + 1) when 6 items are passed and isMulticolumn is true', () => {
            mockProps.customItems = makeItems(6);

            render(<ListedItems {...mockProps} />);

            const lists = screen.getAllByRole('list'); // the two <ul> columns
            expect(lists).toHaveLength(2);
            expect(screen.getAllByTestId('listed-item')).toHaveLength(6);

            expect(lists[0].querySelectorAll('[data-tid="listed-item"]').length).toBe(5);
            expect(lists[1].querySelectorAll('[data-tid="listed-item"]').length).toBe(1);
        });

        it('should cap output at 10 items and fills two 5-item columns when 12 items are passed and isMulticolumn is true', () => {
            mockProps.customItems = makeItems(12);

            render(<ListedItems {...mockProps} />);

            const lists = screen.getAllByRole('list');
            expect(lists).toHaveLength(2);
            expect(screen.getAllByTestId('listed-item')).toHaveLength(10);

            expect(lists[0].querySelectorAll('[data-tid="listed-item"]').length).toBe(5);
            expect(lists[1].querySelectorAll('[data-tid="listed-item"]').length).toBe(5);
        });
    });
});
