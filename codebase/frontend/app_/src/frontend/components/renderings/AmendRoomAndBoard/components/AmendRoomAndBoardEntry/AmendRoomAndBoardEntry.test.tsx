import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AmendRoomAndBoardEntry from './AmendRoomAndBoardEntry';

const mockClickPropsFn = jest.fn();
const createProps = () => ({
    className: 'mockClassName',
    onClick: mockClickPropsFn,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, onClick, dataTid, ...props }) => {
        mockButtonProps(props);

        return (
            <button data-tid={dataTid} onClick={onClick}>
                {children}
            </button>
        );
    },
}));

const mockPriceLabelProps = jest.fn();
jest.mock('frontend/components/common/Amend/AmendUpsellMessage/AmendUpsellMessage', () => ({
    __esModule: true,
    default: props => {
        mockPriceLabelProps(props);

        return <div data-tid='price-label' />;
    },
}));

describe('<AmendRoomAndBoardEntry />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendRoomAndBoardStore: {
                isLoadingInitialData: false,
                upgradePrice: 10,
            },
        });
        mockProps = createProps();
    });

    describe('Entry button', () => {
        it('Should component be rendered with appropriate children props', () => {
            render(<AmendRoomAndBoardEntry {...mockProps} />);

            expect(screen.getByTestId('amend-room-and-board-cta')).toHaveTextContent('RoomAndBoard.Labels.Edit');
            expect(mockButtonProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: 'mockClassName',
                    isOutlined: true,
                    isSmall: true,
                    isPlaceholderShimmer: false,
                }),
            );
        });

        it('Should button be rendered with isPlaceholderShimmer prop when isLoadingInitialData set in store', () => {
            mockStores.amendRoomAndBoardStore.isLoadingInitialData = true;
            render(<AmendRoomAndBoardEntry {...mockProps} />);

            expect(mockButtonProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: 'mockClassName',
                    isOutlined: true,
                    isSmall: true,
                    isPlaceholderShimmer: true,
                }),
            );
        });

        it('Should cta be rendered with disabled prop', () => {
            mockStores.amendRoomAndBoardStore.isAmendCTADisabled = true;
            render(<AmendRoomAndBoardEntry {...mockProps} />);

            expect(mockButtonProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    disabled: true,
                }),
            );
        });
    });

    it('Should render AmendUpsellMessage component', () => {
        render(<AmendRoomAndBoardEntry {...mockProps} />);

        expect(screen.getByTestId('price-label')).toBeInTheDocument();
        expect(mockPriceLabelProps).toHaveBeenCalledWith({
            price: 10,
            priceLabel: SitecoreDictionary.ViewBookingLabelsUpgradeRoomOrBoard,
        });
    });

    it('Should onClick property be called', async () => {
        render(<AmendRoomAndBoardEntry {...mockProps} />);
        const button = screen.getByTestId('amend-room-and-board-cta');

        await userEvent.click(button);

        expect(mockClickPropsFn).toHaveBeenCalled();
    });
});
