import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import OtherRoutesNoResults from './OtherRoutesNoResults';

const createProps = () => ({
    onClose: jest.fn(),
    isMobile: false,
});
const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<OtherRoutesNoResults />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should render title and description', () => {
        render(<OtherRoutesNoResults {...mockProps} />);

        expect(screen.getByText(SitecoreDictionary.SearchResultsErrorsNoOtherRoutesTitle)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.SearchResultsErrorsNoOtherRoutesDescription)).toBeInTheDocument();
    });

    describe('Back button', () => {
        it('Should render back button on desktop', () => {
            render(<OtherRoutesNoResults {...mockProps} />);
            const button = screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsBack });

            expect(button).toBeInTheDocument();
        });

        it('Should not render back button on mobile', () => {
            mockProps.isMobile = true;
            render(<OtherRoutesNoResults {...mockProps} />);

            expect(screen.queryByText(SitecoreDictionary.GlobalsButtonsBack)).not.toBeInTheDocument();
        });

        it('Should call onClose on click', () => {
            render(<OtherRoutesNoResults {...mockProps} />);
            const button = screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsBack });

            fireEvent.click(button);

            expect(mockProps.onClose).toHaveBeenCalled();
        });
    });
});
