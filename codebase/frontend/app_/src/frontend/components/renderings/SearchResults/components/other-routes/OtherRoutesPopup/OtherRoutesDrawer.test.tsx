import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { IOtherRoutesPopupContentProps } from './PopupContent/OtherRoutesPopupContent';
import { OtherRoutesDrawer } from './OtherRoutesDrawer';

jest.mock('./PopupContent/OtherRoutesPopupContent', () => () => <div data-tid='popup-content' />);

const createProps = () =>
    ({
        offer: {} as IOffer,
        alternativeFlights: [{} as IOffer, {} as IOffer],
        priceDisclaimer: 'priceDisclaimer',
        isLoading: false,
        isOpen: false,
        onClose: jest.fn(),
        onSelectRoute: jest.fn(),
        onFlightsSort: jest.fn(),
    } as IOtherRoutesPopupContentProps);

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<OtherRoutesDrawer />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should render content', () => {
        render(<OtherRoutesDrawer {...mockProps} />);

        expect(screen.getByTestId('popup-content')).toBeInTheDocument();
    });

    it('Should call onClose when close button clicked', () => {
        render(<OtherRoutesDrawer {...mockProps} />);

        fireEvent.click(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsClose }));

        expect(mockProps.onClose).toHaveBeenCalled();
    });

    describe('Tooltip', () => {
        it('Should not render tooltip when no priceDisclaimer', () => {
            mockProps.priceDisclaimer = '';
            render(<OtherRoutesDrawer {...mockProps} />);

            expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
        });

        it('Should not render tooltip when no alternativeFlights', () => {
            mockProps.alternativeFlights = [];
            render(<OtherRoutesDrawer {...mockProps} />);

            expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
        });

        it('Should render tooltip', () => {
            render(<OtherRoutesDrawer {...mockProps} />);

            expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        });

        it('Should open tooltip on click', () => {
            render(<OtherRoutesDrawer {...mockProps} />);

            expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument();

            fireEvent.click(screen.getByTestId('tooltip'));

            expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
            expect(screen.getByTestId('tooltip-content')).toHaveTextContent('priceDisclaimer');
        });

        it('Should close tooltip on click', () => {
            render(<OtherRoutesDrawer {...mockProps} />);

            fireEvent.click(screen.getByTestId('tooltip'));

            expect(screen.queryByTestId('tooltip-content')).toBeInTheDocument();

            fireEvent.click(screen.getByTestId('tooltip-content'));

            expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument();
        });
    });
});
