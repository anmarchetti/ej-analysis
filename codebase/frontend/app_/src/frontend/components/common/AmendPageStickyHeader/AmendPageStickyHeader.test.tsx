import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores as createDefaultMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';

import AmendPageStickyHeader, { IAmendPageStickyHeaderProps } from './AmendPageStickyHeader';

expect.extend(toHaveNoViolations);

const createProps = (): IAmendPageStickyHeaderProps => ({
    isConfirmButtonDisabled: false,
    onContinueBtnClick: jest.fn(),
    price: 30,
    isPriceHidden: false,
    children: <div data-tid='children' />,
    priceLabel: 'priceLabel',
    priceTooltipContent: mockSitecoreField('priceTooltipContent'),
});

let mockProps: IAmendPageStickyHeaderProps;
let mockStores;

jest.mock('frontend/components/common/StickyBox', () => ({
    __esModule: true,
    default: ({ render }) => <div data-tid='sticky-box'>{render()}</div>,
}));

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='wrapper'>{children}</div>,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children, ...props }) => {
        mockButtonProps(props);

        return (
            <button data-tid='button' onClick={onClick}>
                {children}
            </button>
        );
    },
}));

const mockCalloutPriceProps = jest.fn();
jest.mock('frontend/components/common/CalloutPrice/CalloutPrice', () => ({
    __esModule: true,
    default: props => {
        mockCalloutPriceProps(props);

        return <div data-tid='callout-price' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AmendPageStickyHeader />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createDefaultMockStores();
    });

    it('Should render children', () => {
        render(<AmendPageStickyHeader {...mockProps} />);

        expect(screen.getByTestId('sticky-box')).toBeInTheDocument();
        expect(screen.getByTestId('wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.getByTestId('header-price')).toBeInTheDocument();
        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Globals.Buttons.ConfirmChanges' })).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({ isMedium: true, className: 'summary-edit', disabled: false }),
        );
        expect(screen.getByTestId('basket-additional-price')).toBeInTheDocument();
        expect(screen.getByText('priceLabel')).toBeInTheDocument();
        expect(mockCalloutPriceProps).toHaveBeenCalledWith(
            expect.objectContaining({
                priceTooltipContent: mockProps.priceTooltipContent,
                orientation: CalloutOrientation.Bottom,
                position: CalloutPosition.Right,
                price: 30,
            }),
        );
    });

    it('Should NOT render price when isPriceHidden set to true', () => {
        mockProps.isPriceHidden = true;
        render(<AmendPageStickyHeader {...mockProps} />);

        expect(screen.queryByTestId('header-price')).not.toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendPageStickyHeader {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
