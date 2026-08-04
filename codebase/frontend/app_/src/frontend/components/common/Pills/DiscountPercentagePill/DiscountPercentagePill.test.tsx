import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { PillSizeVariants } from 'frontend/components/common/Pills/PillWithVariants/PillSizeVariants';

import { DiscountPercentagePill } from './DiscountPercentagePill';

const mockPillWithVariants = jest.fn();
jest.mock('frontend/components/common/Pills/PillWithVariants/PillWithVariants', () => ({
    __esModule: true,
    default: ({ content, ...props }) => {
        mockPillWithVariants(props);

        return (
            <div data-tid='pill-with-variants'>
                {content.icon}
                <p>{content.text}</p>
                <p>{content.tooltipMessage}</p>
            </div>
        );
    },
}));

const createProps = () => ({
    icon: <div data-tid='icon' />,
    discountPercentage: 10,
    pillSize: PillSizeVariants.Regular,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<DiscountPercentagePill />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: {
                isDiscountPercentagePillEnabled: true,
            },
        });
    });

    it('should NOT render when isDiscountPercentagePillEnabled is false', () => {
        mockStores.layoutStore.isDiscountPercentagePillEnabled = false;

        const { container } = render(<DiscountPercentagePill {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when discountPercentage is 0', () => {
        mockProps.discountPercentage = 0;

        const { container } = render(<DiscountPercentagePill {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when discountPercentage is undefined', () => {
        mockProps.discountPercentage = undefined;

        const { container } = render(<DiscountPercentagePill {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render PillWithVariants with correct props', () => {
        render(<DiscountPercentagePill {...mockProps} />);

        expect(screen.getByTestId('pill-with-variants')).toBeInTheDocument();
        expect(screen.getByTestId('icon')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.DiscountForHBGHotelsText)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.DiscountForHBGHotelsTooltip)).toBeInTheDocument();
        expect(mockPillWithVariants).toHaveBeenCalledWith({
            dataIdPrefix: 'discount-percentage',
            pillSize: PillSizeVariants.Regular,
            pillClass: 'pill',
        });
    });
});
