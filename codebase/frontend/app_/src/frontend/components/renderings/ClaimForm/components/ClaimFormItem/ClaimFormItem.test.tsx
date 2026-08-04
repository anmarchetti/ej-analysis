import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import ClaimFormItem, { TClaimFormItemProps } from './ClaimFormItem';

const mockTextWithTooltipProps = jest.fn();
jest.mock('frontend/components/common/TextWithTooltip/TextWithTooltip', () => ({
    __esModule: true,
    default: props => {
        mockTextWithTooltipProps(props);

        return <div data-tid='text-with-tooltip' />;
    },
}));

const createProps = (): TClaimFormItemProps => ({
    ItemText: mockSitecoreField('Item title'),
    ItemTooltip: mockSitecoreField('Item tooltip'),
});

let mockProps = createProps();

describe('ClaimFormItem', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render default item', () => {
        render(<ClaimFormItem {...mockProps} />);

        expect(screen.getByTestId('claim-form-item')).toBeInTheDocument();
        expect(screen.getByTestId('cross-icon')).toBeInTheDocument();

        expect(screen.getByTestId('text-with-tooltip')).toBeInTheDocument();
        expect(mockTextWithTooltipProps).toHaveBeenCalledWith({
            wrapperClassName: 'text',
            tooltipMessage: mockProps.ItemTooltip.value,
            message: mockProps.ItemText.value,
            icon: expect.anything(),
        });
    });

    it('should render eligible component', () => {
        render(<ClaimFormItem {...mockProps} isEligibleItem />);

        expect(screen.getByTestId('claim-form-item')).toBeInTheDocument();
        expect(screen.getByTestId('tick-icon')).toBeInTheDocument();

        expect(screen.getByTestId('text-with-tooltip')).toBeInTheDocument();
        expect(mockTextWithTooltipProps).toHaveBeenCalledWith({
            wrapperClassName: 'text',
            tooltipMessage: mockProps.ItemTooltip.value,
            message: mockProps.ItemText.value,
            icon: expect.anything(),
        });
    });
});
