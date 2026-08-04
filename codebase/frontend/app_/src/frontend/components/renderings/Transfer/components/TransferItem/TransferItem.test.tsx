import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockTransferFields } from 'frontend/__mocks__';
import { TStores } from 'frontend/store/IStores';
import { ITransfer } from 'models/data/ITransfer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';
import TransferItem, {
    ITransferItemProps,
} from 'frontend/components/renderings/Transfer/components/TransferItem/TransferItem';

const createStores = () =>
    createMockStores({
        bookingStore: {
            selectedOffer: null,
            isLoadingOffer: false,
            isLoadingAlternativeTransfers: false,
        },
        searchStore: {
            searchWho: { infantsQuantity: 0 },
        },
        layoutStore: {
            isTransferDurationEnabled: true,
        },
    });

const createProps = (): ITransferItemProps => ({
    isSelected: false,
    isDefault: false,
    onSelect: jest.fn(),
    transfer: {
        pricePP: 100.01,
        name: 'transfer',
        type: TransferType.Shared,
        content: 'transfer-content',
        iconUrl: 'url',
        smallSeSurcharge: 20,
        largeSeSurcharge: 50,
    } as ITransfer,
    fields: mockTransferFields,
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockBlockSelectedProps = jest.fn();
jest.mock('frontend/components/common/BlockSelected', () => ({
    __esModule: true,
    default: props => {
        mockBlockSelectedProps(props);

        return <div data-tid='block-selected' />;
    },
}));

const mockLuxuryWrapper = jest.fn();
jest.mock('frontend/components/common/LuxuryWrapper/LuxuryWrapper', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockLuxuryWrapper(props);

        return <div data-tid='luxury-wrapper'>{children}</div>;
    },
}));

jest.mock('frontend/components/common/ErrorMessage', () => ({
    __esModule: true,
    default: () => <div data-tid='error-message' />,
}));

jest.mock('frontend/components/renderings/Transfer/components/PriceInfo/PriceInfo', () => ({
    __esModule: true,
    default: () => <div data-tid='price-info' />,
}));

const mockSportEquipmentFeesProps = jest.fn();
jest.mock('frontend/components/renderings/Transfer/components/SportEquipmentFees/SportEquipmentFees', () => ({
    __esModule: true,
    default: ({ promo, ...restProps }) => {
        mockSportEquipmentFeesProps(restProps);

        return <div data-tid='se-fees'>{promo}</div>;
    },
}));

const mockButton = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockButton(props);

        return <button data-tid='select-transfer-button'>{children}</button>;
    },
}));

const mockTransferHeader = jest.fn();
jest.mock('frontend/components/renderings/Transfer/components/TransferHeader/TransferHeader', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockTransferHeader(props);

        return <button data-tid='transfer-header'>{children}</button>;
    },
}));

let mockProps;
let mockStores: TStores;

describe('<TransferItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render when no fields', () => {
        mockProps.fields = undefined;

        const { container } = render(<TransferItem {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render component correct', () => {
        render(<TransferItem {...mockProps} />);

        expect(screen.getByTestId('transfer-SHARED')).not.toHaveClass('card--selected');
        expect(screen.getAllByText('transfer-content')).toHaveLength(1);
        expect(screen.getByTestId('price-info')).toBeInTheDocument();
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
        expect(screen.getByTestId('line')).toBeInTheDocument();
        expect(screen.getByTestId('option-card-SHARED')).not.toHaveClass('noTransfer');

        expect(mockButton).toHaveBeenCalledWith(
            expect.objectContaining({
                isOutlined: false,
            }),
        );

        expect(screen.getByTestId('transfer-header')).toBeInTheDocument();
        expect(mockTransferHeader).toHaveBeenCalledWith(
            expect.objectContaining({
                iconUrl: 'url',
                isNoTransfer: false,
                isShouldShowTransferDuration: false,
                name: 'transfer',
                transferInfo: undefined,
            }),
        );
    });

    describe('when item selected', () => {
        beforeEach(() => {
            mockProps.isSelected = true;
        });

        it('should render component correct', () => {
            mockStores.searchStore.searchWho.infantsQuantity = 1;

            render(<TransferItem {...mockProps} />);

            expect(screen.getByTestId('transfer-SHARED')).toHaveClass('selected');
            expect(screen.getByTestId('block-selected')).toBeInTheDocument();
            expect(screen.getByTestId('error-message')).toBeInTheDocument();
        });

        it('should NOT show error message when type is NoTransfer', () => {
            mockProps.transfer.type = TransferType.NoTransfer;

            render(<TransferItem {...mockProps} />);

            expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
        });
    });

    describe('SportEquipmentFees', () => {
        it('should render SportEquipmentFees when item is selected', () => {
            mockProps.isSelected = true;

            render(<TransferItem {...mockProps} />);

            expect(screen.getByTestId('se-fees')).toBeInTheDocument();
            expect(mockSportEquipmentFeesProps).toHaveBeenCalledWith({
                fields: mockTransferFields,
                smallSeSurcharge: 20,
                largeSeSurcharge: 50,
                type: TransferType.Shared,
            });
        });

        it('should NOT render SportEquipmentFees when item NOT selected', () => {
            render(<TransferItem {...mockProps} />);

            expect(screen.queryByTestId('se-fees')).not.toBeInTheDocument();
        });
    });

    it('should render correctly for NoTransfer type', () => {
        mockProps.transfer.type = TransferType.NoTransfer;
        mockProps.isSelected = true;

        render(<TransferItem {...mockProps} />);

        expect(screen.queryByTestId('image-with-filter')).not.toBeInTheDocument();
        expect(screen.queryByTestId('price-info')).not.toBeInTheDocument();
        expect(screen.getByTestId('option-card-NO_TRANSFER')).toHaveClass('noTransfer');
        expect(screen.queryByTestId('line')).not.toBeInTheDocument();
    });

    describe('TransferItem CTA text ', () => {
        it('for Shared transfer', () => {
            mockProps.transfer.type = TransferType.Shared;

            render(<TransferItem {...mockProps} />);

            expect(screen.getByTestId('select-transfer-button')).toHaveTextContent('SharedCTADescription');
        });

        it('for Private transfer', () => {
            mockProps.transfer.type = TransferType.Private;

            render(<TransferItem {...mockProps} />);

            expect(screen.getByTestId('select-transfer-button')).toHaveTextContent('PrivateCTADescription');
        });

        it('for NoTransfer', () => {
            mockProps.transfer.type = TransferType.NoTransfer;

            render(<TransferItem {...mockProps} />);

            expect(screen.getByTestId('select-transfer-button')).toHaveTextContent('NoTransferCTADescription');
        });
    });

    describe('Block selected ', () => {
        beforeEach(() => {
            mockProps.isSelected = true;
        });

        it('should render siteCoreKey and NOT render sitecoreField when transfer is NOT default', () => {
            render(<TransferItem {...mockProps} />);

            expect(mockBlockSelectedProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    siteCoreKey: SitecoreDictionary.TransferButtonsSelected,
                    sitecoreField: undefined,
                }),
            );
        });

        it('should render sitecoreField and NOT render siteCoreKey when transfer is default', () => {
            mockProps.isDefault = true;

            render(<TransferItem {...mockProps} />);

            expect(mockBlockSelectedProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    siteCoreKey: undefined,
                    sitecoreField: mockTransferFields.IncludedForFreeText,
                }),
            );
        });
    });

    describe('Outline banner', () => {
        beforeEach(() => {
            mockProps.isSelected = true;
            mockProps.transfer.type = TransferType.Private;
        });

        it('should render outline banner', () => {
            Object.defineProperty(mockStores.bookingStore, 'isLuxuryPackage', {
                get: () => true,
            });
            render(<TransferItem {...mockProps} />);

            expect(mockLuxuryWrapper).toHaveBeenCalledWith({
                label: SitecoreDictionary.LuggageLabelsIncluded,
                wrapperClassName: 'luxuryWrapper',
                contentClassName: 'luxuryContent',
            });
            expect(screen.getByTestId('luxury-wrapper')).toBeInTheDocument();
            expect(screen.getByTestId('transfer-PRIVATE')).toHaveClass('cardContainer selected luxuryTransfer');
        });

        it('should NOT render luxury transfer styles when isSelected is false', () => {
            Object.defineProperty(mockStores.bookingStore, 'isLuxuryPackage', {
                get: () => true,
            });
            mockProps.isSelected = false;

            render(<TransferItem {...mockProps} />);

            expect(mockLuxuryWrapper).not.toHaveBeenCalled();
            expect(screen.queryByTestId('luxury-wrapper')).not.toBeInTheDocument();
            expect(screen.getByTestId('transfer-PRIVATE')).not.toHaveClass('luxuryTransfer');
        });

        it('should NOT render luxury transfer styles when selected transfer is not Private', () => {
            mockProps.transfer.type = TransferType.Shared;

            render(<TransferItem {...mockProps} />);

            expect(mockLuxuryWrapper).not.toHaveBeenCalled();
            expect(screen.queryByTestId('luxury-wrapper')).not.toBeInTheDocument();
            expect(screen.getByTestId('transfer-SHARED')).not.toHaveClass('luxuryTransfer');
        });
    });
});
