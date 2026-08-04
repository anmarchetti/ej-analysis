import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import isBackend from 'frontend/utils/isBackend';

import FacilityItem from './FacilityItem';

import '@testing-library/jest-dom';

jest.mock('frontend/utils/isBackend');

describe('<FacilityItem />', () => {
    const resetMocks = () => ({
        onUpdateItem: jest.fn(),
        onDeleteItem: jest.fn(),
        label: 'test',
        id: '1',
        isEditMode: false,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        jest.mocked(isBackend).mockReturnValue(false);
    });

    it('should render list item with label', () => {
        render(<FacilityItem {...mocks} />);
        expect(screen.getByText('test')).toBeInTheDocument();
    });

    it('should render update and delete buttons in edit mode', () => {
        mocks.isEditMode = true;
        render(<FacilityItem {...mocks} />);
        expect(screen.getByTestId('update-facility')).toBeInTheDocument();
        expect(screen.getByTestId('delete-facility')).toBeInTheDocument();
    });

    it('should call onUpdateItem when update button is clicked', () => {
        mocks.isEditMode = true;
        render(<FacilityItem {...mocks} />);
        fireEvent.click(screen.getByTestId('update-facility'));
        expect(mocks.onUpdateItem).toHaveBeenCalledWith('1');
    });

    it('should call onDeleteItem when delete button is clicked', () => {
        mocks.isEditMode = true;
        window.confirm = jest.fn(() => true);
        render(<FacilityItem {...mocks} />);
        fireEvent.click(screen.getByTestId('delete-facility'));
        expect(mocks.onDeleteItem).toHaveBeenCalledWith('1');
    });

    it('should not call onUpdateItem if no id is provided', () => {
        mocks.isEditMode = true;
        mocks.id = undefined as any;
        render(<FacilityItem {...mocks} />);
        const updateButton = screen.queryByTestId('update-facility');
        expect(updateButton).not.toBeInTheDocument();
    });

    it('should not provide onDeleteItem button if no id is provided', () => {
        mocks.isEditMode = true;
        mocks.id = undefined as any;
        window.confirm = jest.fn(() => true);
        render(<FacilityItem {...mocks} />);
        const deleteButton = screen.queryByTestId('delete-facility');
        expect(deleteButton).not.toBeInTheDocument();
    });

    it('should not call onUpdateItem if no id is provided', () => {
        mocks.isEditMode = false;
        render(<FacilityItem {...mocks} />);
        const updateButton = screen.queryByTestId('update-facility');
        expect(updateButton).not.toBeInTheDocument();
    });

    it('should not provide onDeleteItem button if no id is provided', () => {
        mocks.isEditMode = false;
        window.confirm = jest.fn(() => true);
        render(<FacilityItem {...mocks} />);
        const deleteButton = screen.queryByTestId('delete-facility');
        expect(deleteButton).not.toBeInTheDocument();
    });

    it('should not add event listeners if isEditMode is false', () => {
        render(<FacilityItem {...mocks} />);
        const viewRef = screen.getByTestId('facility-item');
        expect(viewRef.querySelector('.update-facility-btn')).toBeNull();
        expect(viewRef.querySelector('.delete-facility-btn')).toBeNull();
    });

    it('should not call onDeleteItem if confirm is false', () => {
        mocks.isEditMode = true;
        window.confirm = jest.fn(() => false);
        render(<FacilityItem {...mocks} />);
        fireEvent.click(screen.getByTestId('delete-facility'));
        expect(mocks.onDeleteItem).not.toHaveBeenCalled();
    });

    it('should remove event listeners on unmount', () => {
        mocks.isEditMode = true;
        const { unmount } = render(<FacilityItem {...mocks} />);
        const updateButton = screen.getByTestId('update-facility');
        const deleteButton = screen.getByTestId('delete-facility');
        const updateListenerSpy = jest.spyOn(updateButton, 'removeEventListener');
        const deleteListenerSpy = jest.spyOn(deleteButton, 'removeEventListener');
        unmount();
        expect(updateListenerSpy).toHaveBeenCalled();
        expect(deleteListenerSpy).toHaveBeenCalled();
    });
});
