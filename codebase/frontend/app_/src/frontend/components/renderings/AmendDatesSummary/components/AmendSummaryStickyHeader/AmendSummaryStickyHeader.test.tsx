import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';

import AmendSummaryStickyHeader from './AmendSummaryStickyHeader';

const createMockProps = () => ({
    fields: {
        Title: mockSitecoreField('Title'),
    },
});

let mockProps;

jest.mock(
    'frontend/components/common/StickyBox',
    () =>
        ({ render }) =>
            render(),
);

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='component-wrapper'>{children}</div>,
}));

const mockAmendSummaryBasketProps = jest.fn();
jest.mock('frontend/components/renderings/AmendDatesSummary/components/AmendSummaryBasket/AmendSummaryBasket', () => ({
    __esModule: true,
    default: props => {
        mockAmendSummaryBasketProps(props);

        return <div data-tid='amend-summary-basket' />;
    },
}));

jest.mock(
    'frontend/components/renderings/AmendDatesSummary/components/AmendDatesSummaryContinueBtn/AmendDatesSummaryContinueBtn',
    () => ({
        __esModule: true,
        default: () => <div data-tid='amend-dates-summary-continue-btn' />,
    }),
);

describe('AmendSummaryStickyHeader', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should render AmendSummaryBasket and AmendDatesSummaryContinueBtn', () => {
        render(<AmendSummaryStickyHeader {...mockProps} />);

        expect(screen.getByTestId('amend-summary-basket')).toBeInTheDocument();
        expect(mockAmendSummaryBasketProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
            calloutProps: undefined,
        });
        expect(screen.getByTestId('amend-dates-summary-continue-btn')).toBeInTheDocument();
    });

    it('should render AmendSummaryBasket with calloutProps if they are provided', () => {
        const calloutProps = { position: CalloutPosition.Center, orientation: CalloutOrientation.Bottom };
        mockProps.calloutProps = calloutProps;

        render(<AmendSummaryStickyHeader {...mockProps} />);

        expect(mockAmendSummaryBasketProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
            calloutProps,
        });
    });
});
