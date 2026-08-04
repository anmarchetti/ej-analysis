import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import PromoPageEditSearch from './PromoPageEditSearch';

const createProps = () => ({
    onClick: jest.fn(),
    isLoading: false,
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

jest.mock('frontend/components/icons-new/EditFilled', () => () => <div data-tid='svg-edit-filled' />);

describe('<PromoPageEditSearch />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render loading placeholder when isLoading prop is true', () => {
        mockProps.isLoading = true;

        render(<PromoPageEditSearch {...mockProps} />);

        expect(screen.getByTestId('placeholder-shimmer')).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render button', () => {
        const { getByRole } = render(<PromoPageEditSearch {...mockProps} />);

        expect(getByRole('button')).toBeInTheDocument();
    });

    it('should render edit icon', () => {
        const { getByTestId } = render(<PromoPageEditSearch {...mockProps} />);

        expect(getByTestId('svg-edit-filled')).toBeInTheDocument();
    });

    it('should render SearchResultsLabelsEditSearch', () => {
        const { getByText } = render(<PromoPageEditSearch {...mockProps} />);

        expect(getByText(SitecoreDictionary.SearchResultsLabelsEditSearch)).toBeInTheDocument();
    });

    it('should call onClick when button is clicked', async () => {
        const { getByRole } = render(<PromoPageEditSearch {...mockProps} />);

        const button = getByRole('button');
        await userEvent.click(button);
        expect(mockProps.onClick).toHaveBeenCalled();
    });
});
