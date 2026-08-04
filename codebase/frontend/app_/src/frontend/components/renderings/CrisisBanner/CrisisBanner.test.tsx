import React from 'react';
import { act, render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import useCrisisBanner from './hooks/useCrisisBanner';
import CrisisBanner, { TCrisisBannerProps } from './CrisisBanner';

expect.extend(toHaveNoViolations);

const mockPopupComponent = jest.fn();

jest.mock('./components/CrisisBannerPopup/CrisisBannerPopup', () => ({
    __esModule: true,
    default: props => {
        mockPopupComponent(props);

        return <div data-tid='crisis-banner-popup'>{props.content}</div>;
    },
}));

const mockBookingAlertComponent = jest.fn();

jest.mock('frontend/components/common/Booking/BookingAlert/BookingAlert', () => ({
    __esModule: true,
    default: props => {
        mockBookingAlertComponent(props);

        return <div data-tid='booking-alert' />;
    },
}));

const mockHook = useCrisisBanner as jest.MockedFn<typeof useCrisisBanner>;

jest.mock('./hooks/useCrisisBanner');

const createProps = (): TCrisisBannerProps => ({
    fields: {
        CTAButtonLabel: mockSitecoreField('CTAButtonLabel'),
        CTAButtonScreenReaderLabel: mockSitecoreField('CTAButtonScreenReaderLabel'),
        Content: mockSitecoreField('Content'),
        Title: mockSitecoreField('Title'),
        ExpandButtonScreenReaderLabel: mockSitecoreField('ExpandButtonScreenReaderLabel'),
        ImpactedAirports: [],
        AlwaysVisible: mockSitecoreField(false),
    },
    rendering: {},
    params: {},
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<CrisisBanner />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
        mockHook.mockImplementation(() => true);
    });

    it('should render booking alert component', () => {
        render(<CrisisBanner {...mockProps} />);

        expect(mockBookingAlertComponent).toHaveBeenCalledWith({
            title: mockProps.fields.Title,
            content: mockProps.fields.Content,
            expandBtnAriaLabel: mockProps.fields.ExpandButtonScreenReaderLabel.value,
        });
    });

    it('should render popup component with correct props', () => {
        render(<CrisisBanner {...mockProps} />);

        expect(mockPopupComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                open: true,
                ctaCloseButtonLabel: mockProps.fields.CTAButtonLabel,
                ctaCloseButtonScreenReaderLabel: mockProps.fields.CTAButtonScreenReaderLabel,
                onClose: expect.any(Function),
            }),
        );

        expect(mockBookingAlertComponent).toHaveBeenNthCalledWith(2, expect.objectContaining({ isInPopup: true }));
    });

    it('should NOT render when booking is not impacted', () => {
        mockHook.mockImplementationOnce(() => false);

        const { container } = render(<CrisisBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should call useCrisisBanner hook with impactedAirports field', () => {
        render(<CrisisBanner {...mockProps} />);

        expect(mockHook).toHaveBeenCalledWith({
            alwaysVisible: mockProps.fields.AlwaysVisible,
            impactedAirports: mockProps.fields.ImpactedAirports,
        });
    });

    it('should change open to false when calling on close func', () => {
        render(<CrisisBanner {...mockProps} />);

        expect(mockPopupComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                open: true,
                ctaCloseButtonLabel: mockProps.fields.CTAButtonLabel,
                ctaCloseButtonScreenReaderLabel: mockProps.fields.CTAButtonScreenReaderLabel,
                onClose: expect.any(Function),
            }),
        );

        act(() => {
            mockPopupComponent.mock.calls[0][0].onClose();
        });

        expect(mockPopupComponent).toHaveBeenLastCalledWith(
            expect.objectContaining({
                open: false,
                ctaCloseButtonLabel: mockProps.fields.CTAButtonLabel,
                ctaCloseButtonScreenReaderLabel: mockProps.fields.CTAButtonScreenReaderLabel,
                onClose: expect.any(Function),
            }),
        );
    });

    it('should NOT render when no fields', () => {
        mockProps.fields = null;
        const { container } = render(<CrisisBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<CrisisBanner {...mockProps} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
