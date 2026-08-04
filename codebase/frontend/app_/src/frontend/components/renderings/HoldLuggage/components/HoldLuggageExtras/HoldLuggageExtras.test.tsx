import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockTokenizer } from 'frontend/__mocks__/utils/tokenizer';
import * as utils from 'frontend/utils/luggage.utils';
import { mockHoldLuggageFields } from 'frontend/components/renderings/HoldLuggage/__mocks__/mockHoldLuggageFields';

import { HoldLuggageExtras, IHoldLuggageExtrasProps } from './HoldLuggageExtras';

jest.mock('frontend/utils/luggage.utils', () => ({
    getIsSportEquipmentAvailableSeason: jest.fn(),
}));

const createProps = (): IHoldLuggageExtrasProps => ({
    fields: mockHoldLuggageFields,
    isHoldLuggageFull: false,
});

const createStores = () =>
    createMockStores({
        bookingStore: {
            travelDate: new Date('2024-09-30T14:50:00+00:00'),
            currency: 'GBP',
            isFlightExternal: false,
            extraLuggage: {
                cheapestSportLuggage: { name: 'cheapestSportLuggage 20', price: 20 },
                cheapestHoldLuggage: { name: 'cheapestHoldLuggage 10', price: 40 },
                isHoldLuggageAvailable: true,
                isSportsEquipmentAvailable: true,
                canAddHoldLuggage: true,
            },
            holdLuggage: { setHoldLuggagePopupOpened: jest.fn() },
        },
        layoutStore: {
            isTradePortal: false,
            isPricesHidden: false,
            isExtrasPage: false,
            isConfirmationPage: false,
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: mockTokenizer,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ field, className, dataTid }) => (
        <div data-tid={dataTid} className={className}>
            {field.value.src}
        </div>
    ),
}));

describe('HoldLuggageExtras', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render HoldLuggageExtras with border when flight is not external', () => {
        jest.spyOn(utils, 'getIsSportEquipmentAvailableSeason').mockReturnValueOnce(true);

        const { container } = render(<HoldLuggageExtras {...mockProps} />);

        expect(screen.queryByTestId('hold-luggage-extras')).toHaveClass('border');
        expect(container.querySelector('.bagExtraIconBig')).toHaveTextContent('BagExtraIcon');
        expect(container.querySelector('.bagExtraIconSmall')).toHaveTextContent('BagExtraIcon');
        expect(container.querySelector('.bagExtraHeading')).toHaveTextContent('HoldLuggageAndSportHeading');
    });

    it('should NOT render HoldLuggageExtras when canAddHoldLuggage == false and flight is external', () => {
        mockStores.bookingStore.extraLuggage.canAddHoldLuggage = false;
        mockStores.bookingStore.isFlightExternal = true;

        const { container } = render(<HoldLuggageExtras {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render on confirmation page', () => {
        mockStores.layoutStore.isConfirmationPage = true;

        const { container } = render(<HoldLuggageExtras {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when it is luxury package', () => {
        mockStores.bookingStore.isLuxuryPackage = true;
        const { container } = render(<HoldLuggageExtras {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render NoAddHeading when neither hold luggage nor sports equipment is available', () => {
        mockStores.bookingStore.extraLuggage.isHoldLuggageAvailable = false;
        mockStores.bookingStore.extraLuggage.isSportsEquipmentAvailable = false;

        render(<HoldLuggageExtras {...mockProps} />);

        expect(screen.getByTestId('hold-luggage-extras-heading')).toHaveTextContent('NoAddHeading');
    });

    it('should call setHoldLuggagePopupOpened when click on Add extras button', async () => {
        render(<HoldLuggageExtras {...mockProps} />);
        await userEvent.click(screen.getByRole('button'));

        expect(mockStores.bookingStore.holdLuggage.setHoldLuggagePopupOpened).toBeCalledWith(true);
    });

    describe('Hold luggage extras heading and price visibility', () => {
        it('should render HoldLuggageAndSportHeading when both hold luggage and sports equipment are available', () => {
            jest.spyOn(utils, 'getIsSportEquipmentAvailableSeason').mockReturnValueOnce(true);
            render(<HoldLuggageExtras {...mockProps} />);

            expect(screen.getByTestId('hold-luggage-extras-heading')).toHaveTextContent('HoldLuggageAndSportHeading');
        });

        it('should render SportsHeading when only sports equipment is available', () => {
            mockStores.bookingStore.extraLuggage.isHoldLuggageAvailable = false;
            mockStores.bookingStore.extraLuggage.isSportsEquipmentAvailable = true;

            render(<HoldLuggageExtras {...mockProps} />);
            expect(screen.getByTestId('hold-luggage-extras-heading')).toHaveTextContent('SportsHeading');
        });

        it('should render HoldLuggageHeading when only hold luggage is available', () => {
            mockStores.bookingStore.extraLuggage.isHoldLuggageAvailable = true;
            mockStores.bookingStore.extraLuggage.isSportsEquipmentAvailable = false;

            render(<HoldLuggageExtras {...mockProps} />);
            expect(screen.getByTestId('hold-luggage-extras-heading')).toHaveTextContent('HoldLuggageHeading');
        });

        it('should render HoldLuggageHeading when SE disabled by season', () => {
            jest.spyOn(utils, 'getIsSportEquipmentAvailableSeason').mockReturnValueOnce(false);
            mockStores.bookingStore.extraLuggage.isHoldLuggageAvailable = true;
            mockStores.bookingStore.extraLuggage.isSportsEquipmentAvailable = false;

            render(<HoldLuggageExtras {...mockProps} />);
            expect(screen.getByTestId('hold-luggage-extras-heading')).toHaveTextContent('HoldLuggageHeading');
        });

        it('should NOT render hold luggage price when hold luggage is not available', () => {
            mockStores.bookingStore.extraLuggage.isHoldLuggageAvailable = false;
            jest.spyOn(utils, 'getIsSportEquipmentAvailableSeason').mockReturnValueOnce(true);

            render(<HoldLuggageExtras {...mockProps} />);
            expect(screen.queryByTestId('hold-luggage-extras-price-bags')).not.toBeInTheDocument();
            expect(screen.getByTestId('hold-luggage-extras-price-sports')).toBeInTheDocument();
        });

        it('should NOT render sport equipment price when sport equipment is not available', () => {
            mockStores.bookingStore.extraLuggage.isSportsEquipmentAvailable = false;

            render(<HoldLuggageExtras {...mockProps} />);
            expect(screen.getByTestId('hold-luggage-extras-price-bags')).toBeInTheDocument();
            expect(screen.queryByTestId('hold-luggage-extras-price-sports')).not.toBeInTheDocument();
        });

        it('should not render sport equipment price when sportEquipment restricted by season', () => {
            jest.spyOn(utils, 'getIsSportEquipmentAvailableSeason').mockReturnValueOnce(false);

            render(<HoldLuggageExtras {...mockProps} />);

            expect(utils.getIsSportEquipmentAvailableSeason).toHaveBeenCalledWith(
                mockProps.fields.SportEquipmentRestrictedSeasons.fields.RestrictionSeasonsList,
                mockStores.bookingStore.travelDate,
            );
            expect(screen.getByTestId('hold-luggage-extras-price-bags')).toBeInTheDocument();
            expect(screen.queryByTestId('hold-luggage-extras-price-sports')).not.toBeInTheDocument();
        });

        it('should NOT render prices when isPricesHidden = true', () => {
            mockStores.layoutStore.isTradePortal = true;
            mockStores.layoutStore.isPricesHidden = true;

            render(<HoldLuggageExtras {...mockProps} />);
            expect(screen.queryByTestId('hold-luggage-extras-price-bags')).not.toBeInTheDocument();
            expect(screen.queryByTestId('hold-luggage-extras-price-sports')).not.toBeInTheDocument();
            expect(screen.getByTestId('hold-luggage-extras-description-trade')).toBeInTheDocument();
        });
    });

    describe('Button state based on isHoldLuggageFull', () => {
        it('should render "Add" button when isHoldLuggageFull is false', () => {
            render(<HoldLuggageExtras {...mockProps} />);
            expect(screen.getByTestId('add-lug-btn')).toHaveTextContent('AddButtonText');
            expect(screen.getByTestId('add-lug-btn')).toHaveClass('addButton');
        });

        it('should render "Edit" button when isHoldLuggageFull is true', () => {
            mockProps.isHoldLuggageFull = true;
            render(<HoldLuggageExtras {...mockProps} />);
            expect(screen.getByTestId('add-lug-btn')).toHaveTextContent('EditButtonText');
            expect(screen.getByTestId('add-lug-btn')).toHaveClass('addButton outlined');
        });
    });

    describe('internal flight logic on extras page', () => {
        beforeEach(() => {
            mockStores.bookingStore.isFlightExternal = false;
            mockStores.layoutStore.isExtrasPage = true;
        });

        it('should render with border when flight is internal on extras page', () => {
            render(<HoldLuggageExtras {...mockProps} />);
            expect(screen.getByTestId('hold-luggage-extras')).toHaveClass('border');
        });

        it('should NOT render with border when flight is external', () => {
            mockStores.bookingStore.isFlightExternal = true;

            render(<HoldLuggageExtras {...mockProps} />);

            expect(screen.getByTestId('hold-luggage-extras')).not.toHaveClass('border');
        });

        it('should NOT render with border when both flags are false', () => {
            mockStores.layoutStore.isExtrasPage = false;
            mockStores.bookingStore.isFlightExternal = true;

            render(<HoldLuggageExtras {...mockProps} />);

            expect(screen.getByTestId('hold-luggage-extras')).not.toHaveClass('border');
        });
    });
});
