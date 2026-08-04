import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

import AmendPaymentSummaryDetailsWrapper, {
    IAmendPaymentSummaryDetailsWrapperProps,
} from './AmendPaymentSummaryDetailsWrapper';

expect.extend(toHaveNoViolations);

let mockProps: IAmendPaymentSummaryDetailsWrapperProps;
let mockStores;

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder' />;
    },
}));

const mockAmendPaymentItemContainerProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendPayment/components/AmendPaymentAccordion/components/AmendPaymentItemContainer/AmendPaymentItemContainer',
    () => ({
        __esModule: true,
        default: ({ children, ...props }) => {
            mockAmendPaymentItemContainerProps(props);

            return <div data-tid='item-container'>{children}</div>;
        },
    }),
);

jest.mock('frontend/components/renderings/AmendPayment/AmendPayment.utils', () => ({
    getMetaByAmendmentType: () => ({
        icon: mockSitecoreField(mockSitecoreImageField('icon')),
        title: mockSitecoreField('SeatsFlowTitle'),
    }),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AmendPaymentSummaryDetailsWrapper />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendPaymentStore: {
                booking: mockBooking,
                isFromAmendSeats: false,
            },
        });
        mockProps = {
            fields: {
                SeatsFlowIcon: mockSitecoreField(mockSitecoreImageField('SeatsFlowIcon')),
                SeatsFlowTitle: mockSitecoreField('SeatsFlowTitle'),
            } as IPaymentPageFields,
            rendering: 'rendering',
        };
    });

    it('Should render component with seats flow', () => {
        mockStores.amendPaymentStore.isFromAmendSeats = true;
        render(<AmendPaymentSummaryDetailsWrapper {...mockProps} />);

        expect(screen.getByTestId('item-container')).toBeInTheDocument();
        expect(mockAmendPaymentItemContainerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'container',
                hideCta: true,
                icon: mockSitecoreField(mockSitecoreImageField('icon')),
                title: mockSitecoreField('SeatsFlowTitle'),
            }),
        );
        expect(screen.getByTestId('placeholder')).toBeInTheDocument();
        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.SeatsAndBags,
                rendering: 'rendering',
                booking: mockBooking,
            }),
        );
    });

    it('Should NOT render component when no booking', () => {
        mockStores.amendPaymentStore.booking = null;
        const { container } = render(<AmendPaymentSummaryDetailsWrapper {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendPaymentSummaryDetailsWrapper {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
