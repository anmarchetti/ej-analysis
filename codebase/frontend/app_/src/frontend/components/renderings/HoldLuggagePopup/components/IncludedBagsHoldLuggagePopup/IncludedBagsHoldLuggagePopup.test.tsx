import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockDefaultBags } from 'frontend/__mocks__/extraLuggage';
import { mockTokenizer } from 'frontend/__mocks__/utils/tokenizer';
import { mockHoldLuggagePopupFields } from 'frontend/components/renderings/HoldLuggagePopup/__mocks__/mockHoldLuggagePopupFields';

import { IIncludedBagsHoldLuggagePopupProps, IncludedBagsHoldLuggagePopup } from './IncludedBagsHoldLuggagePopup';

const mockOptionItemHoldLuggagePopup = jest.fn();
jest.mock(
    'frontend/components/renderings/HoldLuggagePopup/components/OptionItemHoldLuggagePopup/OptionItemHoldLuggagePopup',
    () => ({
        __esModule: true,
        default: props => {
            mockOptionItemHoldLuggagePopup(props);

            return <div data-tid='option-item' />;
        },
    }),
);

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: mockTokenizer,
}));

const createProps = (): IIncludedBagsHoldLuggagePopupProps => ({
    fields: mockHoldLuggagePopupFields,
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
            defaultBag: mockDefaultBags[0],
            defaultBagsNumber: 1,
        },
    },
    guestDetailsStore: {
        infants: [{}, {}],
    },
});

describe('IncludedBagsHoldLuggagePopup', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render pram and default bag when they are presented', () => {
        render(<IncludedBagsHoldLuggagePopup {...mockProps} />);

        expect(screen.getByTestId('hl-section-title')).toHaveTextContent('DefaultBagsTitle');

        expect(screen.getByTestId('included-bags-in-popup')).toBeInTheDocument();
        expect(screen.getAllByTestId('option-item')).toHaveLength(2);
        expect(mockOptionItemHoldLuggagePopup).toHaveBeenNthCalledWith(1, {
            name: '2 x PramTitle',
            icon: 'PramIcon',
            shouldRender: true,
        });
        expect(mockOptionItemHoldLuggagePopup).toHaveBeenNthCalledWith(2, {
            name: '1 x 15 kg',
            icon: 'src',
            shouldRender: true,
        });
    });

    it('should render nothing when there are NO pram and default bag', () => {
        mockStores.bookingStore.extraLuggage.defaultBag = undefined;
        mockStores.guestDetailsStore.infants = [];

        const { container } = render(<IncludedBagsHoldLuggagePopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Texts', () => {
        it('should render DefaultBagsCounterSingle when total bags number is 1', () => {
            mockStores.guestDetailsStore.infants = [];

            render(<IncludedBagsHoldLuggagePopup {...mockProps} />);

            expect(screen.getByTestId('hl-included-section-subtitle')).toHaveTextContent('DefaultBagsCounterSingle 1');
        });

        it('should render DefaultBagsCounterPlural when total bags number > 1', () => {
            render(<IncludedBagsHoldLuggagePopup {...mockProps} />);

            expect(screen.getByTestId('hl-included-section-subtitle')).toHaveTextContent('DefaultBagsCounterPlural 3');
        });
    });
});
