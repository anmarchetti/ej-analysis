import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockAmendRoomAndBoardStore } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitePath from 'models/enum/SitePath';

import AmendRoomAndBoardFooter, { IAmendRoomAndBoardFooterProps } from './AmendRoomAndBoardFooter';

expect.extend(toHaveNoViolations);

let mockStores;
let mockProps: IAmendRoomAndBoardFooterProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
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
            <button data-tid={props['data-tid']} onClick={onClick}>
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

describe('<AmendRoomAndBoardFooter />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendRoomAndBoardStore: { ...mockAmendRoomAndBoardStore },
        });
        mockStores.amendRoomAndBoardStore.chosenRoomVariant.fullAmendmentCharges = 30;

        mockProps = {
            additionalCostLabel: 'additionalCostLabel',
            goBackLabel: 'goBackLabel',
            goBackNoChangesLabel: 'goBackNoChangesLabel',
            refundAmountLabel: 'refundAmountLabel',
            wasRerendered: true,
            priceTooltipContent: mockSitecoreField('priceTooltipContent'),
        };
    });

    it('Should render children', () => {
        render(<AmendRoomAndBoardFooter {...mockProps} />);

        expect(screen.getByTestId('wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('rbc-go-back-btn')).toBeInTheDocument();
        expect(screen.getByTestId('rbc-footer-continue')).toBeInTheDocument();
        expect(screen.queryByTestId('rbc-footer-price')).not.toBeInTheDocument();
        expect(screen.getByText(mockProps.goBackNoChangesLabel)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Globals.Buttons.ConfirmChanges' })).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'backButton',
                isTransparent: true,
            }),
        );
        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                disabled: false,
                className: 'confirm',
            }),
        );
    });

    it('Should be rendered with refund price label', () => {
        mockStores.appStore.isScreenMedium = false;
        mockStores.amendRoomAndBoardStore.chosenRoomVariant.fullAmendmentCharges = -30;
        render(<AmendRoomAndBoardFooter {...mockProps} />);

        expect(screen.getByText(mockProps.refundAmountLabel)).toBeInTheDocument();
        expect(screen.queryByText(mockProps.additionalCostLabel)).not.toBeInTheDocument();
    });

    it('Should render mobile variant', () => {
        mockStores.appStore.isScreenMedium = false;
        render(<AmendRoomAndBoardFooter {...mockProps} />);

        expect(screen.getByTestId('rbc-footer-continue')).toBeInTheDocument();
        expect(screen.getByTestId('wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('rbc-footer-price')).toBeInTheDocument();
        expect(screen.getByText(mockProps.additionalCostLabel)).toBeInTheDocument();
        expect(screen.queryByText(mockProps.refundAmountLabel)).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Globals.Buttons.ConfirmChanges' })).toBeInTheDocument();
        expect(screen.getByTestId('callout-price')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                disabled: false,
                className: 'confirm',
            }),
        );
    });

    it('Should price be rendered with 0 when no chosenRoomVariant', () => {
        mockStores.appStore.isScreenMedium = false;
        mockStores.amendRoomAndBoardStore.chosenRoomVariant = null;
        render(<AmendRoomAndBoardFooter {...mockProps} />);

        expect(screen.getByTestId('rbc-footer-price')).toBeInTheDocument();
        expect(screen.getByTestId('callout-price')).toBeInTheDocument();
    });

    it('Should be click on back button be handled by appropriate way', async () => {
        render(<AmendRoomAndBoardFooter {...mockProps} />);

        await userEvent.click(screen.getByTestId('rbc-go-back-btn'));

        expect(mockStores.amendRoomAndBoardStore.clearStore).toHaveBeenCalled();
        expect(mockStores.routerStore.redirectTo).toHaveBeenCalledWith(SitePath.ViewBooking);
    });

    describe('Render price', () => {
        it('Should NOT be rendered when isOriginalVariantChosen is true', () => {
            mockStores.amendRoomAndBoardStore.isOriginalVariantChosen = true;
            render(<AmendRoomAndBoardFooter {...mockProps} />);

            expect(screen.queryByTestId('rbc-footer-price')).not.toBeInTheDocument();
        });

        it('Should NOT be rendered when isLoading is true', () => {
            mockStores.amendRoomAndBoardStore.isLoading = true;
            render(<AmendRoomAndBoardFooter {...mockProps} />);

            expect(screen.queryByTestId('rbc-footer-price')).not.toBeInTheDocument();
        });
    });

    describe('Go back button rendering', () => {
        it('Should NOT be rendered when isOriginalVariantChosen is false', () => {
            mockStores.amendRoomAndBoardStore.isOriginalVariantChosen = false;
            render(<AmendRoomAndBoardFooter {...mockProps} />);

            expect(screen.queryByTestId('rbc-footer-price')).not.toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendRoomAndBoardFooter {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
