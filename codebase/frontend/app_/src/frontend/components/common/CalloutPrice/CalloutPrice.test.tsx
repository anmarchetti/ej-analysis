import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { TrailingZeroDisplay } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';

import CalloutPrice, { ICalloutPriceProps } from './CalloutPrice';

expect.extend(toHaveNoViolations);

let mockProps: ICalloutPriceProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockRichTextProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextProps(props);

        return <div data-tid='reach-text' />;
    },
}));

const mockCalloutProps = jest.fn();
jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    default: ({ children, content, ...props }) => {
        mockCalloutProps(props);

        return (
            <div data-tid='callout'>
                {children}
                {content}
            </div>
        );
    },
}));

jest.mock('frontend/components/icons/InfoCircle', () => ({
    __esModule: true,
    default: () => <div data-tid='circle-icon' />,
}));

describe('<CalloutPrice />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = {
            price: 30,
            priceTooltipContent: mockSitecoreField('priceTooltipContent'),
            orientation: CalloutOrientation.Top,
            position: CalloutPosition.Right,
        };
    });

    it('Should render component', () => {
        render(<CalloutPrice {...mockProps} />);

        expect(screen.getByTestId('callout-price')).toBeInTheDocument();
        expect(screen.getByTestId('callout')).toBeInTheDocument();
        expect(screen.getByTestId('circle-icon')).toBeInTheDocument();
        expect(screen.getByTestId('reach-text')).toBeInTheDocument();
        expect(screen.getByText('£30')).toBeInTheDocument();
        expect(mockStores.marketStore.formatMoney).toHaveBeenCalledWith(
            30,
            expect.objectContaining({
                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                maximumFractionDigits: 0,
            }),
        );
        expect(mockCalloutProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isShownOnHover: true,
                className: 'tooltip',
                orientation: CalloutOrientation.Top,
                position: CalloutPosition.Right,
            }),
        );
        expect(mockRichTextProps).toHaveBeenCalledWith(
            expect.objectContaining({ tag: 'div', field: { value: 'priceTooltipContent' } }),
        );
    });

    it('Should NOT render callout when priceTooltipContent has not been provided', () => {
        mockProps.priceTooltipContent = undefined;
        render(<CalloutPrice {...mockProps} />);

        expect(screen.queryByTestId('callout')).not.toBeInTheDocument();
        expect(screen.queryByTestId('circle-icon')).not.toBeInTheDocument();
        expect(screen.queryByTestId('reach-text')).not.toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<CalloutPrice {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
