import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { useViewBookingPageInit } from 'frontend/hooks/viewBooking.hooks';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import { BookingContextProvider } from './BookingContextProvider';

expect.extend(toHaveNoViolations);

const createProps = () => ({
    fields: {
        SpinnerDescription: mockSitecoreField('please wait'),
        SpinnerTitle: mockSitecoreField('loading'),
    },
    params: {},
    rendering: {},
});

let props;
const mockOverlaySpinnerComponent = jest.fn();
const mockPlaceholderComponent = jest.fn();

jest.mock('frontend/components/common/OverlaySpinner', () => ({
    __esModule: true,
    default: props => {
        mockOverlaySpinnerComponent(props);

        return <div data-tid='spinner' />;
    },
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Placeholder: props => {
        mockPlaceholderComponent(props);

        return <div data-tid='placeholder' />;
    },
}));

jest.mock('frontend/hooks/viewBooking.hooks', () => ({
    useViewBookingPageInit: jest.fn().mockReturnValue({
        booking: mockBooking,
        isLoading: false,
    }),
}));

const createStores = () =>
    createMockStores({
        layoutStore: {
            isCancelledBookingPage: false,
        },
    });

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<BookingContextProvider />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should render a placeholder component when booking is loaded and rendering is provided', () => {
        render(<BookingContextProvider {...props} />);

        expect(mockOverlaySpinnerComponent).not.toHaveBeenCalled();
        expect(screen.getByTestId('placeholder')).toBeInTheDocument();
        expect(mockPlaceholderComponent).toHaveBeenCalledWith({ name: PlaceholderNames.BookingContext, rendering: {} });
    });

    it('should call useViewBookingPageInit with true', () => {
        render(<BookingContextProvider {...props} />);

        expect(useViewBookingPageInit).toHaveBeenCalledWith(true);
    });

    it('should call useViewBookingPageInit with false on cancelled booking page', () => {
        mockStores.layoutStore.isCancelledBookingPage = true;

        render(<BookingContextProvider {...props} />);

        expect(useViewBookingPageInit).toHaveBeenCalledWith(false);
    });

    it('should render a spinner when data is loading', () => {
        (useViewBookingPageInit as any).mockReturnValueOnce({ booking: mockBooking, isLoading: true });

        render(<BookingContextProvider {...props} />);

        expect(mockOverlaySpinnerComponent).toHaveBeenCalledWith({
            header: props.fields.SpinnerTitle.value,
            description: props.fields.SpinnerDescription.value,
        });
    });

    it('should NOT render a spinner when data is loading but fields are NOT provided', () => {
        props.fields = undefined;
        (useViewBookingPageInit as any).mockReturnValueOnce({ booking: mockBooking, isLoading: true });

        render(<BookingContextProvider {...props} />);

        expect(mockOverlaySpinnerComponent).not.toHaveBeenCalled();
    });

    it('should not render placeholder without a booking', () => {
        (useViewBookingPageInit as any).mockReturnValueOnce({ booking: undefined, isLoading: false });

        const { container } = render(<BookingContextProvider {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render placeholder without a sitecore rendering', () => {
        props.rendering = undefined;

        const { container } = render(<BookingContextProvider {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<BookingContextProvider {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
