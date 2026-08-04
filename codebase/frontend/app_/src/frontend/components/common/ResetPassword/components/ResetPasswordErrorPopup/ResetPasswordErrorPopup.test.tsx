import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ResetPasswordErrorPopup, { IResetPasswordErrorPopupProps } from './ResetPasswordErrorPopup';

const createStores = () =>
    createMockStores({
        layoutStore: {
            isGuestDetailsPage: false,
        },
    });

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = (): IResetPasswordErrorPopupProps => ({
    onClose: jest.fn(),
});

let mockProps = createProps();

describe('ResetPasswordErrorPopup', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render the popup with the correct title and description', () => {
        render(<ResetPasswordErrorPopup {...mockProps} />);

        expect(screen.getByText(SitecoreDictionary.ResetPasswordErrorPopupTitle)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.ResetPasswordErrorPopupDescription)).toBeInTheDocument();
    });

    it('should call onClose when the button is clicked', () => {
        render(<ResetPasswordErrorPopup {...mockProps} />);

        const button = screen.getByRole('button', { name: SitecoreDictionary.ResetPasswordErrorPopupButton });
        fireEvent.click(button);

        expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should render guest details page content when isGuestDetailsPage is true', () => {
        mockStores.layoutStore.isGuestDetailsPage = true;

        render(<ResetPasswordErrorPopup {...mockProps} />);

        expect(screen.getByText(SitecoreDictionary.ResetPasswordErrorPopupBookingTitle)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.ResetPasswordErrorPopupBookingDescription)).toBeInTheDocument();
    });

    it('should render the correct button text based on isGuestDetailsPage', () => {
        mockStores.layoutStore.isGuestDetailsPage = true;

        render(<ResetPasswordErrorPopup {...mockProps} />);

        expect(
            screen.getByRole('button', { name: SitecoreDictionary.ResetPasswordErrorPopupBookingButton }),
        ).toBeInTheDocument();
    });
});
