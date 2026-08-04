import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import TradePortalFindBooking, { TTradePortalFindBookingProps } from './TradePortalFindBooking';

expect.extend(toHaveNoViolations);

jest.mock('frontend/utils/ui.utils');
jest.mock('models/data/FindBookingInfo');
jest.mock('frontend/services/validation.service');

const mockSearchContentProps = jest.fn();
jest.mock('frontend/components/renderings/TradePortalFindBooking/components/SimpleSearchContent', () => ({
    __esModule: true,
    default: props => {
        mockSearchContentProps(props);

        return <div data-tid='simple-search-content' />;
    },
}));

const mockAdvancedSearchContentProps = jest.fn();
jest.mock('frontend/components/renderings/TradePortalFindBooking/components/AdvancedSearchContent', () => ({
    __esModule: true,
    default: props => {
        mockAdvancedSearchContentProps(props);

        return <div data-tid='advanced-search-content' />;
    },
}));

const createProps = () =>
    ({
        fields: {
            SimpleSearchName: mockSitecoreField('SimpleSearchName'),
            SimpleSearchSubtitle: mockSitecoreField('SimpleSearchSubtitle'),
            SimpleSearchLabel: mockSitecoreField('SimpleSearchLabel'),
            SimpleSearchButton: mockSitecoreField('SimpleSearchButton'),
            SimpleSearchTooltip: mockSitecoreField('SimpleSearchTooltip'),
            AdvancedSearchName: mockSitecoreField('AdvancedSearchName'),
            PopupTitle: mockSitecoreField('PopupTitle'),
            PopupMessage: mockSitecoreField('PopupMessage'),
            PopupButton: mockSitecoreField('PopupButton'),
        },
    } as TTradePortalFindBookingProps);

let mockProps;

describe('<TradePortalFindBooking />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('Should render TradePortalFindBooking', () => {
        render(<TradePortalFindBooking {...mockProps} />);

        expect(screen.getByTestId('find-booking')).toBeInTheDocument();
        expect(screen.getByTestId('simple-search-content')).toBeInTheDocument();
        expect(mockSearchContentProps).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: mockProps.fields,
            }),
        );
        expect(screen.getByTestId('advanced-search-content')).toBeInTheDocument();
        expect(mockAdvancedSearchContentProps).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: mockProps.fields,
            }),
        );
        expect(screen.getByText('SimpleSearchName')).toBeInTheDocument();
    });

    it('Should NOT render component when no fields', () => {
        mockProps.fields = undefined;
        const { container } = render(<TradePortalFindBooking {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<TradePortalFindBooking {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
