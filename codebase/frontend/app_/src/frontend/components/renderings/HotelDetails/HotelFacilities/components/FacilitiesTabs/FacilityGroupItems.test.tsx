import React from 'react';
import { render } from '@testing-library/react';

import settings from 'code/settings';

import FacilityGroupItems from './FacilityGroupItems';

const createProps = () => ({
    items: [
        { name: 'group1', icon: 'url1', id: '1' },
        { name: 'group2', icon: 'url2', id: '2' },
        { name: 'group3', icon: 'url3', id: '3' },
    ],
    isMultiColumnList: false,
    isTopFacilitiesList: false,
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<FacilityGroupItems />', () => {
    beforeEach(() => {
        mockProps = createProps();
        settings.HotelDetails.MaxNumberOfTopFacilities = 1;
    });

    it('should render list without listCols and listTopFacilities classes', () => {
        const { getByRole } = render(<FacilityGroupItems {...mockProps} />);

        expect(getByRole('list')).not.toHaveClass('listCols');
        expect(getByRole('list')).not.toHaveClass('listTopFacilities');
    });

    it('should render list with listCols class when isMultiColumnList', () => {
        mockProps.isMultiColumnList = true;
        const { getByRole } = render(<FacilityGroupItems {...mockProps} />);

        expect(getByRole('list')).toHaveClass('listCols');
    });

    it('should render list with listTopFacilities class when isTopFacilitiesList', () => {
        mockProps.isTopFacilitiesList = true;
        const { getByRole } = render(<FacilityGroupItems {...mockProps} />);

        expect(getByRole('list')).toHaveClass('listTopFacilities');
    });

    it('should render all items when is NOT TopFacilitiesList', () => {
        const { getAllByRole } = render(<FacilityGroupItems {...mockProps} />);

        expect(getAllByRole('listitem').length).toBe(3);
    });

    it('should render 1 item when isTopFacilitiesList and MaxNumberOfTopFacilities is 1', () => {
        mockProps.isTopFacilitiesList = true;
        const { getAllByRole } = render(<FacilityGroupItems {...mockProps} />);

        expect(getAllByRole('listitem').length).toBe(1);
    });

    it('should render all items names', () => {
        const { getByText } = render(<FacilityGroupItems {...mockProps} />);

        expect(getByText('group1')).toBeInTheDocument();
        expect(getByText('group2')).toBeInTheDocument();
        expect(getByText('group3')).toBeInTheDocument();
    });

    it('should NOT render icons when is NOT TopFacilitiesList', () => {
        const { container } = render(<FacilityGroupItems {...mockProps} />);

        expect(container.getElementsByClassName('icon').length).toBe(0);
    });

    it('should NOT render icons when isTopFacilitiesList and icon NOT provided', () => {
        mockProps.isTopFacilitiesList = true;
        mockProps.items = [
            { name: 'group1', icon: '', id: '1' },
            { name: 'group2', icon: 'url2', id: '2' },
            { name: 'group3', icon: 'url3', id: '3' },
        ];
        const { container } = render(<FacilityGroupItems {...mockProps} />);

        expect(container.getElementsByClassName('icon').length).toBe(0);
    });

    it('should render icons when isTopFacilitiesList and icon is provided', () => {
        mockProps.isTopFacilitiesList = true;
        const { container } = render(<FacilityGroupItems {...mockProps} />);

        expect(container.getElementsByClassName('icon').length).toBe(1);
    });

    it('should use index as key when item has no id', () => {
        mockProps.items = [{ name: 'no-id-item', icon: '', id: '' }];
        const { getByText } = render(<FacilityGroupItems {...mockProps} />);

        expect(getByText('no-id-item')).toBeInTheDocument();
    });

    it('should render itemTitle class on item name spans', () => {
        const { container } = render(<FacilityGroupItems {...mockProps} />);

        expect(container.getElementsByClassName('itemTitle').length).toBe(3);
    });
});
