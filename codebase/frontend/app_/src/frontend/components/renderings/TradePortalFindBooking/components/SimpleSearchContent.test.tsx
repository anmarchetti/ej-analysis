import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { FindBookingInfo } from 'models/data/FindBookingInfo';
import { BookingErrorCodes } from 'models/enum/BookingStatus';

import { ISimpleSearchContentProps, SimpleSearchContent } from './SimpleSearchContent';

jest.mock('frontend/utils/ui.utils');

jest.mock('models/data/FindBookingInfo', () => ({
    ...jest.requireActual('models/data/FindBookingInfo'),
    validateField: jest.fn(() => []),
}));

jest.mock('frontend/services/validation.service');

jest.mock('./BookingNotFoundPopup', () => ({ onClose }) => (
    <div data-tid='booking-not-found-popup'>
        <button data-tid='booking-not-found-popup-button' onClick={onClose} />
    </div>
));

jest.mock('frontend/components/common/Callout/Callout', () => () => <div data-tid='callout' />);

const createProps = () =>
    ({
        fields: {
            SimpleSearchSubtitle: { value: 'SimpleSearchSubtitle' },
            SimpleSearchLabel: { value: 'SimpleSearchLabel' },
            SimpleSearchButton: { value: 'SimpleSearchButton' },
            SimpleSearchTooltip: { value: 'Tooltip' },
        },
    } as ISimpleSearchContentProps);
const createStores = () =>
    createMockStores({
        viewBookingStore: {
            getBooking: jest.fn(),
            errorMessage: null,
            isLoading: false,
        },
        trackingStore: {
            trackValidation: jest.fn(),
        },
    });

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<SimpleSearchContent />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should not render component when there is no fields', () => {
        mockProps.fields = null;
        const { container } = render(<SimpleSearchContent {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render component', () => {
        const { container } = render(<SimpleSearchContent {...mockProps} />);

        expect(container.querySelector('.simple-search__wrapper')).toBeInTheDocument();
    });

    it('should render subtitle when it exist', () => {
        render(<SimpleSearchContent {...mockProps} />);

        expect(screen.getByText(mockProps.fields.SimpleSearchSubtitle.value)).toBeInTheDocument();
    });

    it('should open popup when there is error message', () => {
        mockStores.viewBookingStore.errorMessage = BookingErrorCodes.Canceled;
        render(<SimpleSearchContent {...mockProps} />);

        expect(screen.getByTestId('booking-not-found-popup')).toBeInTheDocument();
    });

    it('should close popup after click on close button', () => {
        mockStores.viewBookingStore.errorMessage = BookingErrorCodes.Canceled;
        const { rerender } = render(<SimpleSearchContent {...mockProps} />);

        expect(screen.getByTestId('booking-not-found-popup')).toBeInTheDocument();

        const closeButton = screen.getByTestId('booking-not-found-popup-button');
        fireEvent.click(closeButton);

        rerender(<SimpleSearchContent {...mockProps} />);

        expect(screen.queryByTestId('booking-not-found-popup')).not.toBeInTheDocument();
    });

    it('should call getBooking after click on submit button', () => {
        jest.spyOn(FindBookingInfo.prototype, 'isValid', 'get').mockReturnValue(true);
        render(<SimpleSearchContent {...mockProps} />);

        const button = screen.getByText(mockProps.fields.SimpleSearchButton.value);
        fireEvent.click(button);

        expect(mockStores.viewBookingStore.getBooking).toHaveBeenCalled();
    });

    it('should not call getBooking if value is not valid', () => {
        jest.spyOn(FindBookingInfo.prototype, 'isValid', 'get').mockReturnValue(false);
        render(<SimpleSearchContent {...mockProps} />);

        const button = screen.getByText(mockProps.fields.SimpleSearchButton.value);
        fireEvent.click(button);

        expect(mockStores.viewBookingStore.getBooking).not.toHaveBeenCalled();
    });

    it('should input value', () => {
        const { container, rerender } = render(<SimpleSearchContent {...mockProps} />);

        const inputField = container.querySelector('input');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        fireEvent.change(inputField, { target: { value: '18649384' } });

        rerender(<SimpleSearchContent {...mockProps} />);

        expect(screen.getByDisplayValue('18649384')).toBeInTheDocument();
    });
});
