import React from 'react';
import { waitFor } from '@testing-library/dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { ISitecoreVirtualFacilities } from 'models/data/IHotel';

import FacilitiesEditMode, { IFacilitiesEditModeProps } from './FacilitiesEditMode';

jest.mock('frontend/utils/string.utils');
jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field }) => <div>{field.value}</div>);
jest.mock('./FacilityGroup', () => ({ facilities, onDeleteItem, onUpdateItem, onSortItems }) => (
    <div data-tid='facility-group'>
        {facilities.map(item => (
            <div key={item.id} data-tid='facility-item'>
                <button data-tid='delete-facility-btn' onClick={() => onDeleteItem(item.id)}>
                    Delete
                </button>
                <button data-tid='update-facility-btn' onClick={() => onUpdateItem(item.id)}>
                    Update
                </button>
                <button data-tid='sort-facility-btn' onClick={() => onSortItems(facilities)}>
                    Sort
                </button>
            </div>
        ))}
    </div>
));

const createStores = () =>
    createMockStores({
        layoutStore: {
            isEditMode: false,
            isFeaturedHotelsLivePriceEnabled: false,
            isNumberOfNightsLabelsEnabled: true,
            isHomePage: false,
        },
        editorStore: {
            addFacility: jest.fn().mockResolvedValue('addFacility'),
            getItemById: jest.fn(),
            updateItem: jest.fn().mockResolvedValue('updateFacility'),
            deleteItem: jest.fn().mockResolvedValue('deleteFacility'),
            sortItems: jest.fn(),
            getGroupIdByItemId: jest.fn(),
            setItemDisplayName: jest.fn(),
            getPhrase: jest.fn(),
        },
    });

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<FacilitiesEditMode />', () => {
    const resetMocks = () =>
        ({
            fields: {
                facilitiesFolderId: 'facilitiesFolderId',
                virtualFacilityGroups: [
                    {
                        id: '1',
                        code: 'group-1',
                        name: 'group-1',
                        iconUrl: 'groupUrl',
                        items: [{ id: '{id}', facilityCode: 'itemCode', name: 'itemName' }],
                    },
                    {
                        id: '2',
                        code: 'group-2',
                        name: 'group-2',
                        iconUrl: 'groupUrl',
                        items: [{ id: '{id}', facilityCode: 'itemCode', name: 'itemName' }],
                    },
                    {
                        id: '3',
                        code: 'group-3',
                        name: 'group-3',
                        iconUrl: 'groupUrl',
                        description: 'Food & drink content',
                        items: [{ id: '{id}', facilityCode: 'itemCode', name: 'itemName' }],
                    },
                ],
            } as ISitecoreVirtualFacilities,
        } as IFacilitiesEditModeProps);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should render with facilityGroups from fields', () => {
        render(<FacilitiesEditMode {...mocks} />);

        expect(screen.getByTestId('hotel-facilities-title')).toBeInTheDocument();
        expect(screen.getByTestId('add-facility-btn')).toBeInTheDocument();
        expect(screen.getAllByTestId('facility-group')).toHaveLength(2);
    });

    it('should render Food and drink fields', () => {
        render(<FacilitiesEditMode {...mocks} />);
        expect(screen.getByTestId('facility-group-food-drink')).toBeInTheDocument();
    });

    it('should handle empty facilityGroups gracefully', () => {
        const props = {
            ...mocks,
            fields: { ...mocks.fields, virtualFacilityGroups: [] },
        };

        render(<FacilitiesEditMode {...props} />);

        expect(screen.queryAllByTestId('facility-group')).toHaveLength(0);
    });

    it('should handle clicking the add facility button', async () => {
        render(<FacilitiesEditMode {...mocks} />);
        fireEvent.click(screen.getByTestId('add-facility-btn'));
        await waitFor(() => expect(mockStores.editorStore.addFacility).toHaveBeenCalled());
    });

    it('should handle updating a facility item', async () => {
        render(<FacilitiesEditMode {...mocks} />);
        fireEvent.click(screen.getAllByText('Update')[0]);
        await waitFor(() => expect(mockStores.editorStore.updateItem).toHaveBeenCalled());
    });

    it('should handle deleting a facility item', async () => {
        render(<FacilitiesEditMode {...mocks} />);
        fireEvent.click(screen.getAllByText('Delete')[0]);
        await waitFor(() => expect(mockStores.editorStore.deleteItem).toHaveBeenCalled());
    });

    it('should handle sorting facility items', async () => {
        render(<FacilitiesEditMode {...mocks} />);
        fireEvent.click(screen.getAllByText('Sort')[0]);
        await waitFor(() => expect(mockStores.editorStore.sortItems).toHaveBeenCalled());
    });
});
