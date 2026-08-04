import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockAmendRoomAndBoardStore } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import AmendRoomAndBoardHeader, { IAmendRoomAndBoardHeaderProps } from './AmendRoomAndBoardHeader';

expect.extend(toHaveNoViolations);

let mockStores;
let mockProps: IAmendRoomAndBoardHeaderProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockStickyHeaderProps = jest.fn();
jest.mock('frontend/components/common/AmendPageStickyHeader/AmendPageStickyHeader', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockStickyHeaderProps(props);

        return <div data-tid='sticky-header'>{children}</div>;
    },
}));

const mockImageProps = jest.fn();
jest.mock('frontend/components/common/ImageWithFilter/ImageWithFilter', () => ({
    __esModule: true,
    SVGFilterMatrix: {
        Grayscale: 'grayscale',
    },
    default: props => {
        mockImageProps(props);

        return <div data-tid='image' />;
    },
}));

jest.mock('frontend/components/icons-new/HotelBedFilled', () => ({
    __esModule: true,
    default: () => <div data-tid='hotel-icon' />,
}));

describe('<AmendRoomAndBoardHeader />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendRoomAndBoardStore: {
                ...mockAmendRoomAndBoardStore,
                chosenRoomVariant: { ...mockAmendRoomAndBoardStore.chosenRoomVariant, fullAmendmentCharges: 10.01 },
            },
        });
        mockProps = {
            additionalCostLabel: 'additionalCostLabel',
            refundAmountLabel: 'refundAmountLabel',
            priceTooltipContent: mockSitecoreField('priceTooltipContent'),
        };
    });

    it('Should render children', () => {
        render(<AmendRoomAndBoardHeader {...mockProps} />);

        expect(screen.getByTestId('sticky-header')).toBeInTheDocument();
        expect(screen.getByTestId('image')).toBeInTheDocument();
        expect(screen.getByTestId('rbc-header-board-type')).toBeInTheDocument();
        expect(screen.getByTestId('rbc-header-room-type')).toBeInTheDocument();
        expect(screen.getByTestId('hotel-icon')).toBeInTheDocument();
        expect(screen.getByText('Half Board')).toBeInTheDocument();
        expect(screen.getByText('roomType_title')).toBeInTheDocument();
        expect(mockStickyHeaderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isConfirmButtonDisabled: false,
                onContinueBtnClick: mockStores.amendRoomAndBoardStore.confirmChosenVariant,
                price: 11,
                isPriceHidden: false,
                priceLabel: mockProps.additionalCostLabel,
                priceTooltipContent: mockProps.priceTooltipContent,
            }),
        );
        expect(mockImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                imageSrc: 'https://example.com/hb-icon.png',
                filterMatrix: 'grayscale',
                className: 'icon',
            }),
        );
    });

    it('Should render header with refund label', () => {
        mockStores.amendRoomAndBoardStore.chosenRoomVariant.fullAmendmentCharges = -30;
        render(<AmendRoomAndBoardHeader {...mockProps} />);

        expect(mockStickyHeaderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                priceLabel: mockProps.refundAmountLabel,
            }),
        );
    });

    describe('Should render sticky header with isPriceHidden prop', () => {
        it('When original variant selected', () => {
            mockStores.amendRoomAndBoardStore.isOriginalVariantChosen = true;
            render(<AmendRoomAndBoardHeader {...mockProps} />);

            expect(mockStickyHeaderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    isPriceHidden: true,
                }),
            );
        });

        it('When isLoadingValidatedOptions', () => {
            mockStores.amendRoomAndBoardStore.isLoadingValidatedOptions = true;
            render(<AmendRoomAndBoardHeader {...mockProps} />);

            expect(mockStickyHeaderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    isPriceHidden: true,
                }),
            );
        });
    });

    describe('Should render nothing', () => {
        it('When no chosenRoom', () => {
            mockStores.amendRoomAndBoardStore.chosenRoom = null;
            const { container } = render(<AmendRoomAndBoardHeader {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('When no chosenBoard', () => {
            mockStores.amendRoomAndBoardStore.chosenBoard = null;
            const { container } = render(<AmendRoomAndBoardHeader {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('When no chosenRoomVariant', () => {
            mockStores.amendRoomAndBoardStore.chosenRoomVariant = null;
            const { container } = render(<AmendRoomAndBoardHeader {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendRoomAndBoardHeader {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
