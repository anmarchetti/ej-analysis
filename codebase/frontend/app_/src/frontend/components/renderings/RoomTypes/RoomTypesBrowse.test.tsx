import * as React from 'react';
import { render, waitFor } from '@testing-library/react';

import { removeFirstAndLastChar } from 'frontend/utils/string.utils';

import { RoomTypesBrowse } from './RoomTypesBrowse';

const mockRTWProps = jest.fn();
jest.mock('./components/RoomTypesWrapper/RoomTypesWrapper', () => ({
    __esModule: true,
    default: (props: any) => {
        mockRTWProps(props);

        return <div data-tid='room-types-wrapper' />;
    },
}));

jest.mock('frontend/utils/isBackend', () => ({
    __esModule: true,
    default: () => false,
}));

jest.mock('frontend/utils/expEditor.utils', () => ({
    __esModule: true,
    getSmallImage: jest.fn(() => ''),
    withValue: (x: any) => ({ value: x?.value ?? x }),
}));

const getLastRTWProps = () => mockRTWProps.mock.calls[mockRTWProps.mock.calls.length - 1]?.[0];

describe('<RoomTypesBrowse />', () => {
    const resetMocks = () => ({
        isEditMode: false,
        getItemById: jest.fn((itemId: string) => new Promise(res => res({ RoomType: itemId }))),
        layoutId: 'layoutId',
        addItem: jest.fn(),
        addImage: jest.fn(),
        updateItem: jest.fn(),
        deleteItem: jest.fn(),
        getImageByItemId: jest.fn(),
        setItemDisplayName: jest.fn(),
        sortImages: jest.fn(),
        sortFacilities: jest.fn(),
        addFacility: jest.fn(),
        fields: {} as any,
        params: {} as any,
        rendering: {} as any,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    const renderWithRef = (props: any) => {
        const ref = React.createRef<any>();
        const utils = render(<RoomTypesBrowse ref={ref} {...props} />);

        return { ...utils, ref };
    };

    it('should show items on mount', async () => {
        mocks.fields = { items: [{}, {}] };

        const { rerender } = renderWithRef(mocks);

        rerender(<RoomTypesBrowse {...mocks} />);

        await waitFor(() => {
            expect(getLastRTWProps().originalRooms.length).toBe(mocks.fields.items.length);
        });
    });

    it('should NOT set parentItemId on mount if no itemid is set', () => {
        mocks.isEditMode = true;
        mocks.rendering = { fields: { id: null } };

        const { ref } = renderWithRef(mocks);

        expect(ref.current.state.parentItemId).toBeUndefined();
    });

    it('should set parentItemId on mount', () => {
        mocks.isEditMode = true;
        mocks.rendering = { fields: { roomsFolderId: 'testId' } };

        const { ref } = renderWithRef(mocks);

        expect(ref.current.state.parentItemId).toBe('testId');
    });

    describe('add item', () => {
        let resolveAddItemPromise;
        let addItemPromise;

        beforeEach(() => {
            addItemPromise = new Promise(resolve => {
                resolveAddItemPromise = resolve;
            });

            mocks.addItem.mockReturnValue(addItemPromise);
        });

        it('should show loading when adding item', async () => {
            mocks.isEditMode = true;

            const { ref } = renderWithRef(mocks);

            expect(ref.current.state.addingItem).toBe(false);

            ref.current.onAddItem();

            await waitFor(() => {
                expect(ref.current.state.addingItem).toBe(true);
            });

            resolveAddItemPromise();
        });

        it('should call addItem when adding item', () => {
            mocks.isEditMode = true;
            mocks.rendering = { fields: { roomsFolderId: 'testId' } };

            const { ref } = renderWithRef(mocks);

            ref.current.setState({ parentItemId: 'testId' });
            ref.current.onAddItem();

            expect(mocks.addItem).toHaveBeenCalledWith('testId', expect.any(Function));
        });

        it('should get roomtype info when new item added', async () => {
            mocks.isEditMode = true;
            const roomTypeId = '{1dsf1w-er87-23}';

            const { ref } = renderWithRef(mocks);
            await (ref.current as any).onCloseCallback()(roomTypeId);

            expect(mocks.getItemById).toHaveBeenCalledWith(removeFirstAndLastChar(roomTypeId));
        });

        it('should call getItemById after popup closed', async () => {
            const testItemId = 'testItemId';
            mocks.isEditMode = true;

            const { ref } = renderWithRef(mocks);
            await (ref.current as any).onCloseCallback()(testItemId);

            expect(mocks.getItemById).toHaveBeenCalledWith(testItemId);
        });
    });

    describe('update item', () => {
        it('should call getItemById WITH ITEM after popup closed', async () => {
            const testItemId = 'testItemId';
            mocks.isEditMode = true;

            const { ref } = renderWithRef(mocks);

            await (ref.current as any).onCloseCallback({})(testItemId);

            expect(mocks.getItemById).toHaveBeenCalledWith(testItemId);
        });

        it('should call onUpdateItem when updateItem is called', () => {
            const itemId = 'itemId';

            const { ref } = renderWithRef(mocks);

            (ref.current as any).onUpdateItem(itemId);

            expect(mocks.updateItem).toHaveBeenCalledWith(itemId, expect.any(Function));
        });
    });

    it('should call setItemDisplayName after popup closed', async () => {
        const testItemId = 'testItemId';
        mocks.isEditMode = true;

        const { ref } = renderWithRef(mocks);

        await (ref.current as any).onCloseCallback()(testItemId);

        expect(mocks.setItemDisplayName).toHaveBeenCalledWith(testItemId, '');
    });

    it('should not render anything if no sitecore fields received', () => {
        mocks.fields = undefined;

        const { container } = renderWithRef(mocks);

        expect(container.firstChild).toBeNull();
    });

    describe('getItemFields', () => {
        it('should return no roomtypes', async () => {
            const { ref } = renderWithRef(mocks);
            const fields = await (ref.current as any).getItemFields({});

            expect(fields.RoomType.length).toBe(0);
        });

        it('should return roomtypes', async () => {
            const { ref } = renderWithRef(mocks);
            const fields = await (ref.current as any).getItemFields({ RoomType: '{ewq}|{qwe}' });

            expect(fields.RoomType.length).toBe(2);

            expect(mocks.getItemById).toHaveBeenCalledWith('ewq');
            expect(mocks.getItemById).toHaveBeenCalledWith('qwe');
        });
    });

    describe('event listeners', () => {
        const EVENTS_AMOUNT = 2;
        const addEventListener = jest.fn();
        const removeEventListener = jest.fn();
        const querySelector = jest.fn(() => ({
            addEventListener,
            removeEventListener,
        }));

        it('should add event on mount', () => {
            mocks.isEditMode = true;

            const { ref } = renderWithRef(mocks);

            (ref.current as any).viewRef.current = { querySelector };
            ref.current.componentDidMount?.();

            expect(addEventListener).toHaveBeenCalledTimes(EVENTS_AMOUNT);
        });

        it('should remove event on unmount', () => {
            mocks.isEditMode = true;

            const { ref, unmount } = renderWithRef(mocks);
            (ref.current as any).viewRef.current = { querySelector };

            unmount();

            expect(removeEventListener).toHaveBeenCalledTimes(EVENTS_AMOUNT);
        });
    });
});
