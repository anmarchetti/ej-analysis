import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores, mockTransferFields } from 'frontend/__mocks__';
import { TransferType } from 'models/enum/transfer/TransferType';

import SportEquipmentFees, { ISportEquipmentFeesProps } from './SportEquipmentFees';

const createProps = (): ISportEquipmentFeesProps => ({
    fields: mockTransferFields,
    largeSeSurcharge: 40,
    smallSeSurcharge: 20,
    type: TransferType.Shared,
});

const createStores = () =>
    createMockStores({
        bookingStore: {
            extraLuggage: { sportEquipmentNumber: 3 },
        },
        marketStore: {
            currency: CurrencyCode.GBP,
        },
        layoutStore: {
            isPricesHidden: false,
        },
    });

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/store/tradePortal', () => ({
    isTradeStore: jest.fn(() => true),
}));

const mockExpandableItemProps = jest.fn();
jest.mock('frontend/components/common/ExpandableItem/ExpandableItem', () => ({
    __esModule: true,
    default: ({ icon, children, ...restProps }) => {
        mockExpandableItemProps(restProps);

        return (
            <div data-tid='expandable-item'>
                {icon} {children}
            </div>
        );
    },
}));

let mockProps;
let mockStores;

describe('<SportEquipmentFees />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    describe('should render default ', () => {
        it('for Shared transfer with multiple surcharges', () => {
            render(<SportEquipmentFees {...mockProps} />);

            expect(screen.getByTestId('sport-equipment-transfer-fees')).toHaveClass('warning');
            expect(screen.getByText(mockProps.fields.SharedFeesTitle.value)).toHaveClass('warningTitle');
            expect(
                screen.getAllByText(
                    'Our transfer partner charges £20 per small and £40 per large item for accommodating your sport equipment.',
                ),
            ).toHaveLength(2);

            expect(screen.getByTestId('expandable-item')).toBeInTheDocument();
            expect(mockExpandableItemProps).toHaveBeenCalledWith({
                className: 'warningContainerMobile',
                title: mockProps.fields.SharedFeesTitle.value,
                titleClassName: 'warningTitle',
                contentClassName: 'contentMobile',
            });
        });

        it('for Private transfer', () => {
            mockProps.type = TransferType.Private;

            render(<SportEquipmentFees {...mockProps} />);

            expect(screen.getByTestId('sport-equipment-transfer-fees')).toHaveClass('warning');
            expect(screen.getByText(mockProps.fields.PrivateFeesTitle.value)).toHaveClass('warningTitle');
            expect(screen.getAllByText('PrivateFeesDescription')).toHaveLength(2);

            expect(screen.getByTestId('expandable-item')).toBeInTheDocument();
            expect(mockExpandableItemProps).toHaveBeenCalledWith({
                className: 'warningContainerMobile',
                title: mockProps.fields.PrivateFeesTitle.value,
                titleClassName: 'warningTitle',
                contentClassName: 'contentMobile',
            });
        });
    });

    describe('should NOT render component ', () => {
        describe('for Shared transfer ', () => {
            it('when NO largeSeSurcharge and NO smallSeSurcharge', () => {
                mockProps.largeSeSurcharge = undefined;
                mockProps.smallSeSurcharge = undefined;

                render(<SportEquipmentFees {...mockProps} />);

                expect(screen.queryByTestId('sport-equipment-transfer-fees')).not.toBeInTheDocument();
            });

            it('when NO sport equipment in booking', () => {
                mockStores.bookingStore.extraLuggage.sportEquipmentNumber = 0;

                render(<SportEquipmentFees {...mockProps} />);

                expect(screen.queryByTestId('sport-equipment-transfer-fees')).not.toBeInTheDocument();
            });
        });

        describe('for Private transfer ', () => {
            beforeEach(() => {
                mockProps.type = TransferType.Private;
            });

            it('when NO sport equipment in booking', () => {
                mockStores.bookingStore.extraLuggage.sportEquipmentNumber = 0;

                render(<SportEquipmentFees {...mockProps} />);

                expect(screen.queryByTestId('sport-equipment-transfer-fees')).not.toBeInTheDocument();
            });
        });

        it('for no transfer', () => {
            mockProps.type = TransferType.NoTransfer;

            render(<SportEquipmentFees {...mockProps} />);

            expect(screen.queryByTestId('sport-equipment-transfer-fees')).not.toBeInTheDocument();
        });
    });

    it('should NOT render ExpandableItem when NO SharedFeesTitle field', () => {
        mockProps.fields = {};

        render(<SportEquipmentFees {...mockProps} />);

        expect(screen.getByTestId('sport-equipment-transfer-fees')).toBeInTheDocument();
        expect(screen.queryByTestId('expandable-item')).not.toBeInTheDocument();
    });

    describe('Trade Portal Price Toggle Off', () => {
        it('should render proper description fields for shared transfer when price toggle is OFF', () => {
            mockStores.layoutStore.isPricesHidden = true;

            render(<SportEquipmentFees {...mockProps} />);

            expect(screen.getAllByText(mockProps.fields.SharedFeesDescriptionPriceHidden.value)).toHaveLength(2);
        });
    });

    describe('should render proper description for single surcharge', () => {
        it('when only smallSeSurcharge is provided', () => {
            mockProps.largeSeSurcharge = undefined;

            render(<SportEquipmentFees {...mockProps} />);

            expect(screen.getByTestId('sport-equipment-transfer-fees')).toHaveClass('warning');
            expect(screen.getByText(mockProps.fields.SharedFeesTitle.value)).toHaveClass('warningTitle');
            expect(
                screen.getAllByText(
                    'Our transfer partner charges an additional £20 for each piece of sports equipment. This has been added to your total holiday cost.',
                ),
            ).toHaveLength(2);

            expect(screen.getByTestId('expandable-item')).toBeInTheDocument();
            expect(mockExpandableItemProps).toHaveBeenCalledWith({
                className: 'warningContainerMobile',
                title: mockProps.fields.SharedFeesTitle.value,
                titleClassName: 'warningTitle',
                contentClassName: 'contentMobile',
            });
        });

        it('when only largeSeSurcharge is provided', () => {
            mockProps.smallSeSurcharge = undefined;

            render(<SportEquipmentFees {...mockProps} />);

            expect(screen.getByTestId('sport-equipment-transfer-fees')).toHaveClass('warning');
            expect(screen.getByText(mockProps.fields.SharedFeesTitle.value)).toHaveClass('warningTitle');
            expect(
                screen.getAllByText(
                    'Our transfer partner charges an additional £40 for each piece of sports equipment. This has been added to your total holiday cost.',
                ),
            ).toHaveLength(2);

            expect(screen.getByTestId('expandable-item')).toBeInTheDocument();
            expect(mockExpandableItemProps).toHaveBeenCalledWith({
                className: 'warningContainerMobile',
                title: mockProps.fields.SharedFeesTitle.value,
                titleClassName: 'warningTitle',
                contentClassName: 'contentMobile',
            });
        });
    });
});
