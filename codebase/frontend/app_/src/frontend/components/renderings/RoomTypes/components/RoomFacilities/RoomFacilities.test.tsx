import React from 'react';
import { arrayMove } from 'react-sortable-hoc';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SiteSettings from 'models/enum/SiteSettings';

import RoomFacilities, { IRoomFacilitiesProps } from './RoomFacilities';

const mockRoomFacilityItem = jest.fn();
jest.mock('frontend/components/renderings/RoomTypes/components/RoomFacilityItem/RoomFacilityItem', () => ({
    __esModule: true,
    default: props => {
        mockRoomFacilityItem(props);

        return <div data-tid='facility-item' />;
    },
}));

const mockSortableContainer = jest.fn();
const mockSortableElement = jest.fn();
jest.mock('react-sortable-hoc', () => {
    const actual = jest.requireActual('react-sortable-hoc');

    return {
        ...actual,
        arrayMove: jest.fn().mockReturnValue([
            {
                id: '{2}',
                code: 'facilityCode2',
                name: 'facilityName2',
                disclaimerMessage: 'disclaimerMessage2',
                number: '2',
            },
            {
                id: '{1}',
                code: 'facilityCode1',
                name: 'facilityName1',
                disclaimerMessage: 'disclaimerMessage1',
                number: '1',
            },
            {
                id: '{3}',
                code: 'facilityCode3',
                name: 'facilityName3',
                disclaimerMessage: 'disclaimerMessage3',
                number: '3',
            },
        ]),
        SortableContainer: Component => props => {
            mockSortableContainer(props);

            return <Component {...props} />;
        },
        SortableElement: Component => props => {
            mockSortableElement(props);

            return <Component {...props} />;
        },
    };
});
const createSettings = () => ({
    [SiteSettings.MaxNumberOfVisibleRoomFacilities]: '10',
});

const settings = createSettings();
const mockStores = createMockStores({
    layoutStore: {
        getSettingAsNumber: jest.fn(key => +settings[key]),
    },
});

let mockProps: IRoomFacilitiesProps;

const createProps = (): IRoomFacilitiesProps => ({
    facilities: [
        {
            id: '{1}',
            code: 'facilityCode1',
            name: 'facilityName1',
            disclaimerMessage: 'disclaimerMessage1',
            number: '1',
        },
        {
            id: '{2}',
            code: 'facilityCode2',
            name: 'facilityName2',
            disclaimerMessage: 'disclaimerMessage2',
            number: '2',
        },
        {
            id: '{3}',
            code: 'facilityCode3',
            name: 'facilityName3',
            disclaimerMessage: 'disclaimerMessage3',
            number: '3',
        },
    ],
    tooltipClass: 'test',
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RoomFacilities />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render facility item', () => {
        render(<RoomFacilities {...mockProps} />);
        expect(screen.getByTestId('facilities')).toBeInTheDocument();
        expect(screen.getByTestId('first-column-of-facilities')).toBeInTheDocument();
        expect(screen.getByTestId('second-column-of-facilities')).toBeInTheDocument();
        expect(mockRoomFacilityItem).toHaveBeenCalledTimes(mockProps.facilities!.length);
        expect(mockRoomFacilityItem).toHaveBeenLastCalledWith({
            roomFacility: mockProps.facilities![2],
            id: mockProps.facilities![2].id,
            isEditMode: mockProps.isEditMode,
            onDeleteItem: expect.any(Function),
            tooltipClass: mockProps.tooltipClass,
        });
    });

    it('should show 1 FacilityItem in first column and 1 in second when there are 2 facilities', () => {
        mockProps.facilities = mockProps.facilities!.slice(0, 2);

        render(<RoomFacilities {...mockProps} />);

        const firstColumn = screen.getByTestId('first-column-of-facilities');
        const secondColumn = screen.getByTestId('second-column-of-facilities');

        expect(within(firstColumn).getAllByTestId('facility-item')).toHaveLength(1);
        expect(within(secondColumn).getAllByTestId('facility-item')).toHaveLength(1);
    });

    it('should show 2 FacilityItem in first column and 1 in second when there are 3 facilities', () => {
        render(<RoomFacilities {...mockProps} />);

        const firstColumn = screen.getByTestId('first-column-of-facilities');
        const secondColumn = screen.getByTestId('second-column-of-facilities');

        expect(within(firstColumn).getAllByTestId('facility-item')).toHaveLength(2);
        expect(within(secondColumn).getAllByTestId('facility-item')).toHaveLength(1);
    });

    it('should render add facility buttons in edit mode', () => {
        mockProps.isEditMode = true;

        render(<RoomFacilities {...mockProps} />);

        expect(screen.getByText('Add facility')).toBeInTheDocument();
        expect(screen.getByText('Reorder facilities')).toBeInTheDocument();
        expect(screen.getByText('Save Order')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should not render add facility button when not in edit mode', () => {
        render(<RoomFacilities {...mockProps} />);

        expect(screen.queryByText('Add facility')).not.toBeInTheDocument();
        expect(screen.queryByText('Reorder facilities')).not.toBeInTheDocument();
        expect(screen.queryByText('Save Order')).not.toBeInTheDocument();
        expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('should call onSortItems func with facility ids when reordering', async () => {
        mockProps.isEditMode = true;
        mockProps.onSortItems = jest.fn();

        render(<RoomFacilities {...mockProps} />);

        expect(mockRoomFacilityItem).toHaveBeenCalledTimes(mockProps.facilities!.length);

        expect(mockSortableContainer).not.toHaveBeenCalled();
        const reorderBtn = screen.getByText('Reorder facilities');

        fireEvent.click(reorderBtn);

        await waitFor(() => {
            expect(screen.getByTestId('facilities-edit-text')).toBeInTheDocument();
        });

        expect(screen.queryByTestId('first-column-of-facilities')).not.toBeInTheDocument();
        expect(screen.queryByTestId('second-column-of-facilities')).not.toBeInTheDocument();

        expect(mockSortableContainer).toHaveBeenCalledWith(
            expect.objectContaining({
                facilities: mockProps.facilities,
                axis: 'y',
                onSortEnd: expect.any(Function),
            }),
        );
        expect(mockSortableElement).toHaveBeenCalledTimes(mockProps.facilities!.length);
        expect(mockSortableElement).toHaveBeenNthCalledWith(1, { facility: mockProps.facilities![0], index: 0 });
        expect(mockRoomFacilityItem).toHaveBeenCalledTimes(mockProps.facilities!.length * 2); // 2 times, once for normal mode, once for reordering mode
        expect(mockRoomFacilityItem).toHaveBeenNthCalledWith(4, {
            roomFacility: mockProps.facilities![0],
            isEditMode: mockProps.isEditMode,
            onDeleteItem: expect.any(Function),
        });

        const onSortEndFunction = mockSortableContainer.mock.calls[0][0].onSortEnd;
        onSortEndFunction({ oldIndex: 0, newIndex: 1 });

        await waitFor(() => {
            const mockArrayMove = arrayMove as jest.Mock;
            expect(mockArrayMove).toHaveBeenCalledWith(mockProps.facilities, 0, 1);
        });

        const saveOrderBtn = screen.getByText('Save Order');
        fireEvent.click(saveOrderBtn);

        await waitFor(() => {
            expect(mockProps.onSortItems).toHaveBeenCalledWith(['{2}', '{1}', '{3}']);
        });
    });

    it('should exit reordering mode on Cancel click', async () => {
        mockProps.isEditMode = true;

        render(<RoomFacilities {...mockProps} />);

        const reorderBtn = screen.getByText('Reorder facilities');
        fireEvent.click(reorderBtn);

        const cancelBtn = screen.getByText('Cancel');

        fireEvent.click(cancelBtn);
        expect(screen.queryByTestId('facilities-edit-text')).not.toBeInTheDocument();
    });

    it('should delete facility correctly', async () => {
        mockProps.isEditMode = true;
        mockProps.onDeleteItem = jest.fn();

        render(<RoomFacilities {...mockProps} />);

        expect(mockRoomFacilityItem).toHaveBeenCalledTimes(mockProps.facilities!.length);
        const onDeleteFacility = mockRoomFacilityItem.mock.calls[0][0].onDeleteItem;

        onDeleteFacility('{1}');

        expect(mockProps.onDeleteItem).toHaveBeenCalledWith('{1}');

        const firstColumn = screen.getByTestId('first-column-of-facilities');
        const secondColumn = screen.getByTestId('second-column-of-facilities');

        await waitFor(() => {
            expect(within(firstColumn).getAllByTestId('facility-item')).toHaveLength(1);
            expect(within(secondColumn).getAllByTestId('facility-item')).toHaveLength(1);
        });
    });

    it('should call addFacility', async () => {
        mockProps.isEditMode = true;
        mockProps.addFacility = jest.fn().mockImplementation((_, callback) => {
            callback('{1}');
        });
        mockProps.roomFacilityFolderId = 'roomFacilityFolderId';
        mockProps.roomId = 'roomId';
        mockProps.getFacilityById = jest.fn();

        render(<RoomFacilities {...mockProps} />);

        const addBtn = screen.getByText('Add facility');
        fireEvent.click(addBtn);

        expect(mockProps.addFacility).toHaveBeenCalledWith(
            mockProps.roomFacilityFolderId,
            expect.any(Function),
            mockProps.roomId,
        );

        expect(mockProps.getFacilityById).toHaveBeenCalledWith('{1}');
    });

    it('should use null when roomFacilityFolder is not provided', async () => {
        mockProps.isEditMode = true;
        mockProps.addFacility = jest.fn();
        mockProps.roomFacilityFolderId = undefined;
        mockProps.roomId = 'roomId';

        render(<RoomFacilities {...mockProps} />);

        const addBtn = screen.getByText('Add facility');
        fireEvent.click(addBtn);

        expect(mockProps.addFacility).toHaveBeenCalledWith(null, expect.any(Function), mockProps.roomId);
    });

    it("should not call addFacility when it's not provided", async () => {
        mockProps.isEditMode = true;
        mockProps.addFacility = undefined;
        mockProps.getFacilityById = jest.fn();

        render(<RoomFacilities {...mockProps} />);

        const addBtn = screen.getByText('Add facility');
        fireEvent.click(addBtn);

        expect(mockProps.addFacility).not.toBeDefined();
        expect(mockProps.getFacilityById).not.toHaveBeenCalled();
    });

    it('should not render facility items if facilities prop is empty', () => {
        mockProps.facilities = [];

        render(<RoomFacilities {...mockProps} />);

        expect(mockRoomFacilityItem).not.toHaveBeenCalled();
    });

    it('should not render facility items if facilities prop is undefined', () => {
        mockProps.facilities = undefined;

        render(<RoomFacilities {...mockProps} />);

        expect(mockRoomFacilityItem).not.toHaveBeenCalled();
    });
});
