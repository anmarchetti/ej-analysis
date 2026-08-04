import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';

import HotelConfirmationCTA, { IHotelConfirmationCTAProps } from './HotelConfirmationCTA';

const createMockProps = (): IHotelConfirmationCTAProps => ({
    dataTid: 'hotel-confirmation-cta',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return (
            <button data-tid={props.dataTid} className={props.className} onClick={props.onClick}>
                {props.children}
            </button>
        );
    },
}));

describe('<HotelConfirmationCTA />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendHotelStore: {
                confirmChosenHotel: jest.fn(),
            },
        });
        mockProps = createMockProps();
    });

    it('should render CTA component', () => {
        render(<HotelConfirmationCTA {...mockProps} />);

        expect(screen.getByTestId('hotel-confirmation-cta')).toHaveTextContent('Globals.Buttons.Continue');
    });

    it('should render className if provided', () => {
        mockProps.className = 'test-class';
        render(<HotelConfirmationCTA {...mockProps} />);

        expect(screen.getByTestId('hotel-confirmation-cta')).toHaveClass('test-class');
    });

    it('should call confirmChosenHotel on button click', async () => {
        render(<HotelConfirmationCTA {...mockProps} />);

        await userEvent.click(screen.getByTestId('hotel-confirmation-cta'));

        expect(mockStores.amendHotelStore.confirmChosenHotel).toHaveBeenCalled();
    });
});
