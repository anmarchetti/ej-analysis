import React from 'react';
import { ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';
import { render, screen } from '@testing-library/react';

import { mockHoldLuggagePopupFields } from 'frontend/components/renderings/HoldLuggagePopup/__mocks__/mockHoldLuggagePopupFields';

import { HoldLuggagePopupContent, IHoldLuggagePopupContentProps } from './HoldLuggagePopupContent';

const mockIncludedBagsHoldLuggagePopup = jest.fn();
jest.mock(
    'frontend/components/renderings/HoldLuggagePopup/components/IncludedBagsHoldLuggagePopup/IncludedBagsHoldLuggagePopup',
    () => ({
        __esModule: true,
        default: props => {
            mockIncludedBagsHoldLuggagePopup(props);

            return <div data-tid='included-bag-hold-luggage-popup' />;
        },
    }),
);

const mockPlaceholderComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Placeholder: props => {
        mockPlaceholderComponent(props);

        return <div data-tid={props.name}>Placeholder</div>;
    },
}));

const createProps = (): IHoldLuggagePopupContentProps => ({
    fields: mockHoldLuggagePopupFields,
    rendering: {} as ComponentRendering,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createStores = () => ({
    bookingStore: {
        extraLuggage: {
            isHoldLuggageAvailable: true,
            isSportsEquipmentAvailable: true,
        },
    },
});

describe('HoldLuggagePopupContent', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render HoldLuggagePopupContent', () => {
        render(<HoldLuggagePopupContent {...mockProps} />);

        expect(screen.queryByText('Header')).toHaveClass('heading');
        expect(screen.queryByText('DescriptionNote')).toHaveClass('note');

        expect(screen.getByTestId('extra-luggage')).toBeInTheDocument();
        expect(mockPlaceholderComponent).toHaveBeenCalledWith({
            name: 'extra-luggage',
            rendering: {},
            additionalFields: mockProps.fields,
        });

        expect(screen.getByTestId('included-bag-hold-luggage-popup')).toBeInTheDocument();
        expect(mockIncludedBagsHoldLuggagePopup).toHaveBeenCalledWith({
            fields: mockProps.fields,
        });
    });

    describe('HoldLuggagePopup description', () => {
        it('should render description for enabled holdLuggage and sportEquipment', () => {
            mockProps.hasInfants = true;

            render(<HoldLuggagePopupContent {...mockProps} />);

            expect(screen.getByTestId('hold-luggage-popup-content')).toHaveTextContent(
                'HoldLuggageAndSportDescription',
            );
        });

        it('should render description for disabled holdLuggage and enabled sportEquipment', () => {
            mockProps.hasInfants = true;
            mockStores.bookingStore.extraLuggage.isSportsEquipmentAvailable = true;
            mockStores.bookingStore.extraLuggage.isHoldLuggageAvailable = false;

            render(<HoldLuggagePopupContent {...mockProps} />);

            expect(screen.getByTestId('hold-luggage-popup-content')).toHaveTextContent('SportDescription');
        });

        it('should render description for enabled holdLuggage and disabled sportEquipment', () => {
            mockProps.hasInfants = true;
            mockStores.bookingStore.extraLuggage.isSportsEquipmentAvailable = false;
            mockStores.bookingStore.extraLuggage.isHoldLuggageAvailable = true;

            render(<HoldLuggagePopupContent {...mockProps} />);

            expect(screen.getByTestId('hold-luggage-popup-content')).toHaveTextContent('HoldLuggageDescription');
        });
    });
});
