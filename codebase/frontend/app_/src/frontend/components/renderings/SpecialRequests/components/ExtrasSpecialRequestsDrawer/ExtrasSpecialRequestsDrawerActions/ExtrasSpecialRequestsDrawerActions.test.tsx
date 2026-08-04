import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ExtrasSpecialRequestsDrawerActions from './ExtrasSpecialRequestsDrawerActions';

const createProps = () => ({
    onClose: jest.fn(),
    onSave: jest.fn(),
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ExtrasSpecialRequestsDrawerActions />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render 2 buttons', () => {
        const { getAllByRole } = render(<ExtrasSpecialRequestsDrawerActions {...mockProps} />);

        expect(getAllByRole('button').length).toBe(2);
    });

    it('should render GlobalsButtonsCancel in 1st button', () => {
        const { getAllByRole } = render(<ExtrasSpecialRequestsDrawerActions {...mockProps} />);

        expect(getAllByRole('button')[0]).toHaveTextContent(SitecoreDictionary.GlobalsButtonsCancel);
    });

    it('should render GlobalsButtonsApply in 2nd button', () => {
        const { getAllByRole } = render(<ExtrasSpecialRequestsDrawerActions {...mockProps} />);

        expect(getAllByRole('button')[1]).toHaveTextContent(SitecoreDictionary.GlobalsButtonsApply);
    });

    it('should render onClose after clicking 1st button', async () => {
        const { getAllByRole } = render(<ExtrasSpecialRequestsDrawerActions {...mockProps} />);

        await userEvent.click(getAllByRole('button')[0]);
        expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should render onSave after clicking 2nd button', async () => {
        const { getAllByRole } = render(<ExtrasSpecialRequestsDrawerActions {...mockProps} />);

        await userEvent.click(getAllByRole('button')[1]);
        expect(mockProps.onSave).toHaveBeenCalled();
    });
});
