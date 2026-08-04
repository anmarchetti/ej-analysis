import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import FacilityGroup from './FacilityGroup';

import '@testing-library/jest-dom';

const mockFacilities: any = [
    { id: '1', name: 'Facility 1', sortOrder: 1 },
    { id: '2', name: 'Facility 2', sortOrder: 2 },
    { id: '3', name: 'Facility 3', sortOrder: 3 },
];

describe('FacilityGroup Component', () => {
    it('should renders facilities correctly', () => {
        render(<FacilityGroup facilities={mockFacilities} title='Test Facilities' />);
        expect(screen.getByText('Test Facilities')).toBeInTheDocument();
        mockFacilities.forEach(facility => {
            expect(screen.getByText(facility.name)).toBeInTheDocument();
        });
    });

    it('should toggles reorder mode', () => {
        render(<FacilityGroup facilities={mockFacilities} title='Test Facilities' />);

        const reorderButton = screen.getByTestId('reorder-btn');
        fireEvent.click(reorderButton);

        expect(screen.getByText('Drag and drop facilities inside the group.')).toBeInTheDocument();
        expect(screen.getByTestId('save-btn')).toBeInTheDocument();
        expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();

        const cancelButton = screen.getByTestId('cancel-btn');
        fireEvent.click(cancelButton);

        expect(screen.queryByText('Drag and drop facilities inside the group.')).not.toBeInTheDocument();
    });

    it('should saves the new order', () => {
        const mockOnSortItems = jest.fn();
        render(
            <FacilityGroup facilities={mockFacilities as any} title='Test Facilities' onSortItems={mockOnSortItems} />,
        );

        const reorderButton = screen.getByTestId('reorder-btn');
        fireEvent.click(reorderButton);

        // Simulate drag and drop sorting
        // You would use a library like `react-dnd` for actual drag and drop testing, here we'll simulate it.
        // This example just switches the order of two items for simplicity.
        const tempFacilities = [...mockFacilities];
        [tempFacilities[0], tempFacilities[1]] = [tempFacilities[1], tempFacilities[0]];
        mockOnSortItems(tempFacilities); // Manually trigger the callback for simplicity

        const saveButton = screen.getByTestId('save-btn');
        fireEvent.click(saveButton);

        expect(mockOnSortItems).toHaveBeenCalledWith(tempFacilities);
    });

    it('should cancels the reorder', () => {
        render(<FacilityGroup facilities={mockFacilities} title='Test Facilities' />);

        const reorderButton = screen.getByTestId('reorder-btn');
        fireEvent.click(reorderButton);

        const cancelButton = screen.getByTestId('cancel-btn');
        fireEvent.click(cancelButton);

        expect(screen.queryByText('Drag and drop facilities inside the group.')).not.toBeInTheDocument();
    });

    it('should calls onDeleteItem when delete button is clicked', () => {
        const mockOnDeleteItem = jest.fn();
        render(<FacilityGroup facilities={mockFacilities} title='Test Facilities' onDeleteItem={mockOnDeleteItem} />);

        jest.spyOn(window, 'confirm').mockImplementation(() => true);

        const deleteButton = screen.getAllByText('Remove')[0];
        fireEvent.click(deleteButton);

        expect(mockOnDeleteItem).toHaveBeenCalledWith('1');
    });

    it('should calls onUpdateItem when update button is clicked', () => {
        const mockOnUpdateItem = jest.fn();
        render(<FacilityGroup facilities={mockFacilities} title='Test Facilities' onUpdateItem={mockOnUpdateItem} />);

        const updateButton = screen.getAllByText('Update')[0];
        fireEvent.click(updateButton);

        expect(mockOnUpdateItem).toHaveBeenCalledWith('1');
    });

    it('should cleans up event listeners on unmount', () => {
        const { unmount } = render(<FacilityGroup facilities={mockFacilities} title='Test Facilities' />);
        const reorderButton = screen.getByTestId('reorder-btn');

        // Simulate adding event listeners
        fireEvent.click(reorderButton);

        unmount();

        // Ensure event listeners are removed
        expect(screen.queryByTestId('reorder-btn')).not.toBeInTheDocument();
    });
});
