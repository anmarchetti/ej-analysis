import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import * as utils from 'frontend/utils/expEditor.utils';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';
import { IBoardItem } from 'models/sitecore/IBoardItem';

import { BoardTypesBrowse, IBoardTypesBrowseProps } from './BoardTypesBrowse';

let mockIsBackend = false;

jest.mock('frontend/utils/isBackend', () => ({
    __esModule: true,
    default: jest.fn(() => mockIsBackend),
}));

const mockedBoardTypeFields = {
    BoardType: {
        id: 'BoardTypeId',
        fields: {
            Code: mockSitecoreField('board type code'),
            Content: mockSitecoreField('board type content'),
            Description: mockSitecoreField('board type description'),
            Icon: mockSitecoreField(mockSitecoreImageField('board type icon')),
            Name: mockSitecoreField('board type name'),
        },
    },
    Content: mockSitecoreField('item content'),
    Description: mockSitecoreField('item description'),
    Icon: mockSitecoreField(mockSitecoreImageField('item icon')),
};

const createProps: () => IBoardTypesBrowseProps = () => ({
    isEditMode: true,
    layoutId: 'layoutId',
    addItem: jest.fn((parentId: string | null, onPopupCloseCallback?: (itemId: string | null) => void) => {
        onPopupCloseCallback && onPopupCloseCallback(parentId);

        return new Promise(res => res(parentId));
    }),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    setItemDisplayName: jest.fn(),
    getItemById: jest.fn(),
    fields: { items: [{ id: 'id', fields: mockedBoardTypeFields }] },
    params: {
        FallbackImage: 'image',
    },
    rendering: {
        fields: {
            id: 'renderingFieldsId',
        },
    },
});

let mockProps = createProps();

jest.mock('frontend/components/renderings/BoardTypes/components/BoardTypesWrapper/BoardTypesWrapper', () => ({
    __esModule: true,
    default: ({ allBoardTypes }) => (
        <div data-tid='board-types-wrapper'>
            {allBoardTypes.map(board => (
                <div key={board.itemId} data-tid='board-type-item' />
            ))}
        </div>
    ),
}));

describe('<BoardTypesBrowse />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockIsBackend = false;
    });

    it('should standard render', () => {
        render(<BoardTypesBrowse {...mockProps} fields={{ ...mockProps.fields, items: [] }} />);

        expect(screen.getByRole('button', { name: 'Add board' })).toBeInTheDocument();
        expect(screen.queryByTestId('board-types-wrapper')).not.toBeInTheDocument();
    });

    describe('add item button', () => {
        it('should show loading when "Add board" button clicked', () => {
            render(<BoardTypesBrowse {...mockProps} />);

            const button = screen.getByRole('button', { name: 'Add board' });

            expect(button).toBeInTheDocument();
            expect(button).not.toHaveClass('btn--loading');

            fireEvent.click(button);

            expect(button).toHaveClass('btn--loading');
        });

        it('should call addItem function when "Add board" button clicked', () => {
            render(<BoardTypesBrowse {...mockProps} />);

            const button = screen.getByRole('button', { name: 'Add board' });

            fireEvent.click(button);

            expect(mockProps.addItem).toBeCalledWith(mockProps.rendering.fields.id, expect.any(Function));
        });

        it('should call getItemById after popup closed', () => {
            render(<BoardTypesBrowse {...mockProps} />);

            const button = screen.getByRole('button', { name: 'Add board' });

            fireEvent.click(button);

            expect(mockProps.getItemById).toBeCalledWith(mockProps.rendering.fields.id);
        });
    });

    it('should NOT render when no fields', () => {
        const { container } = render(<BoardTypesBrowse {...mockProps} fields={undefined} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when it is backend side', () => {
        mockIsBackend = true;
        const { container } = render(<BoardTypesBrowse {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render board-types-wrapper when there are no boardTypes available', () => {
        render(<BoardTypesBrowse {...mockProps} fields={{ items: [] }} />);

        expect(screen.queryByTestId('board-types-wrapper')).not.toBeInTheDocument();
    });

    it('should render each board type item when they are defined in fields items prop', () => {
        const mockedFields = {
            items: [
                {
                    id: 'id0',
                    fields: mockedBoardTypeFields,
                },
                {
                    id: 'id1',
                    fields: {
                        ...mockedBoardTypeFields,
                        BoardType: {
                            ...mockedBoardTypeFields.BoardType,
                            id: 'BoardTypeId1',
                        },
                    },
                },
            ],
        };
        render(<BoardTypesBrowse {...mockProps} fields={mockedFields} />);

        expect(screen.queryAllByTestId('board-type-item')).toHaveLength(mockedFields.items.length);
    });

    it('should NOT render when it is backend side', () => {
        render(<BoardTypesBrowse {...mockProps} rendering={{}} />);

        expect(screen.queryAllByTestId('board-type-item')).toHaveLength(0);
    });

    describe('getItemFields', () => {
        const mockGetSmallImage = jest.spyOn(utils, 'getSmallImage');
        let component;

        beforeEach(() => {
            mockProps.getItemById = jest.fn().mockImplementation(() => ({
                Code: 'Code',
                Content: 'Content',
                Description: 'Description',
                Name: 'Name',
            }));
            mockGetSmallImage.mockReturnValue('small image');
            component = new BoardTypesBrowse({ ...mockProps });
        });

        it('should return undefined when data does NOT contain BoardType', async () => {
            const result = await component['getItemFields']({});

            expect(result).toBe(undefined);
            expect(mockGetSmallImage).not.toHaveBeenCalled();
        });

        it('should return undefined when BoardType has length 2', async () => {
            const result = await component['getItemFields']({ BoardType: 'AI' });

            expect(result).toBe(undefined);
            expect(mockGetSmallImage).not.toHaveBeenCalled();
        });

        it('should return correct data', async () => {
            const result = await component['getItemFields']({
                BoardType: 'AIHB',
                Content: 'Test',
                Description: 'Test desc',
            });

            expect(result).toStrictEqual({
                BoardType: {
                    fields: {
                        Code: { value: 'Code' },
                        Content: { value: 'Content' },
                        Description: { value: 'Description' },
                        Icon: { value: { src: 'small image' } },
                        Name: { value: 'Name' },
                    },
                    id: 'IH',
                },
                Content: { value: 'Test' },
                Description: { value: 'Test desc' },
                Icon: { value: { src: 'small image' } },
            });
            expect(mockGetSmallImage).toHaveBeenCalledTimes(2);
        });

        it('should return correct data with empty images when getSmallImage returns null', async () => {
            mockGetSmallImage.mockReturnValue(null);

            const result = await component['getItemFields']({
                BoardType: 'AIHB',
                Content: 'Test',
                Description: 'Test desc',
            });

            expect(result).toStrictEqual({
                BoardType: {
                    fields: {
                        Code: { value: 'Code' },
                        Content: { value: 'Content' },
                        Description: { value: 'Description' },
                        Icon: { value: { src: '' } },
                        Name: { value: 'Name' },
                    },
                    id: 'IH',
                },
                Content: { value: 'Test' },
                Description: { value: 'Test desc' },
                Icon: { value: { src: '' } },
            });
        });
    });

    describe('onUpdateItem', () => {
        it('should call updateItem from props', () => {
            const component = new BoardTypesBrowse({ ...mockProps });
            component.items = [{ id: 'id1' }, { id: 'id2' }] as ISitecoreCompositeField<IBoardItem>[];

            component['onUpdateItem']('id1');

            expect(mockProps.updateItem).toHaveBeenCalled();
        });
    });

    describe('updateItem', () => {
        it('should call setItems', () => {
            const component = new BoardTypesBrowse({ ...mockProps });
            component['setItems'] = jest.fn();

            component['updateItem']({ id: '1', fields: {} as IBoardItem }, {});

            expect(component['setItems']).toHaveBeenCalled();
        });
    });

    describe('onDeleteItem', () => {
        it('should call deleteItem from props', () => {
            const component = new BoardTypesBrowse({ ...mockProps });

            component['onDeleteItem']('id');

            expect(mockProps.deleteItem).toHaveBeenCalled();
        });
    });
});
