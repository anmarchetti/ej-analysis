import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { IViewAltBoardsPopupCTAProps, ViewAltBoardsPopupCTA } from './ViewAltBoardsPopupCTA';

jest.mock('frontend/components/icons-new/ExternalLink', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-external-link' />,
}));

const createStores = () =>
    createMockStores({
        trackingStore: { trackOpenBoardsPopup: jest.fn() },
        bookingStore: {
            clearSelectedOffer: jest.fn(),
            loadOffersAlterations: jest.fn(),
        },
        hotelsStore: { setActiveOfferId: jest.fn() },
    });

const createProps = (): IViewAltBoardsPopupCTAProps => ({
    offer: {
        id: 'offerId',
        accom: {
            unit: [
                {
                    boardType: { code: 'boardType' },
                },
            ],
        },
        altBoards: [{}],
    } as IOffer,
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ViewAltBoardsLink />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
    });

    it('should NOT render when offer accom is not defined', () => {
        mockProps.offer.accom.unit = [];
        const { container } = render(<ViewAltBoardsPopupCTA {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when offer altBoards array is empty', () => {
        const { container } = render(
            <ViewAltBoardsPopupCTA {...mockProps} offer={{ ...mockProps.offer, altBoards: [] }} />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('should standard render', () => {
        const { container } = render(<ViewAltBoardsPopupCTA {...mockProps} />);

        const anchor = screen.getByRole('link', { name: SitecoreDictionary.BoardTypesLabelsSeeBoardsOptions });
        expect(container.nodeName.toLowerCase()).toBe('div');
        expect(anchor.classList.contains('alternative-boards-link')).toBeTruthy();
        expect(anchor).toHaveAttribute('href', '#');
        expect(within(anchor).getByTestId('icon-external-link')).toBeInTheDocument();
    });

    it('should call funcs from store on click', async () => {
        render(<ViewAltBoardsPopupCTA {...mockProps} />);

        await userEvent.click(screen.getByRole('link', { name: SitecoreDictionary.BoardTypesLabelsSeeBoardsOptions }));

        expect(mockStores.trackingStore.trackOpenBoardsPopup).toHaveBeenCalledWith(
            mockProps.offer,
            SitecoreDictionary.BoardTypesLabelsSeeBoardsOptions,
        );
        expect(mockStores.bookingStore.loadOffersAlterations).toHaveBeenCalledWith(mockProps.offer);
        expect(mockStores.hotelsStore.setActiveOfferId).toHaveBeenCalledWith(mockProps.offer.id);
    });
});
