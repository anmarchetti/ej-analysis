import * as React from 'react';
import { configure, render } from '@testing-library/react';

import * as luggageUtils from 'frontend/utils/luggage.utils';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { ITransfer } from 'models/data/ITransfer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';

import { BasketThirdCell } from './BasketThirdCell';

configure({ testIdAttribute: 'data-tid' });

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p), isATOLProtectionEnabled: true },
    bookingStore: {
        transfer: null as Nullable<ITransfer>,
        defaultTransferFromUrl: '1',
        selectedTransferCode: '2',
        extraLuggage: {
            totalHoldLuggageItemsNumber: 5,
        },
    },
    guestDetailsStore: {
        infants: [{ value: 'infant 1' }, { value: 'infant 2' }],
    },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/luggage.utils', () => ({
    getHoldItemsLabel: jest.fn().mockReturnValue('getHoldItemsLabel result'),
}));

describe('<BasketThirdCell  />', () => {
    const resetMocks = () => ({
        className: '',
        isABTestingComponent: false,
        offer: {
            accom: {
                unit: [
                    {
                        occupation: {
                            adults: 2,
                            children: 0,
                        },
                    },
                ],
            },
            transport: {
                routes: [
                    {
                        direction: 'outbound',
                        arrDate: '2019-09-16T14:20:00+00:00',
                        arrName: 'Palma Airport',
                        arrPt: 'PMI',
                        depDate: '2019-09-16T11:55:00+00:00',
                        depName: 'London Gatwick Airport',
                        depPt: 'LGW',
                    },
                    {
                        direction: 'inbound',
                        depDate: '2019-09-16T14:20:00+00:00',
                        depName: 'Palma Airport',
                        depPt: 'PMI',
                        arrDate: '2019-09-16T11:55:00+00:00',
                        arrName: 'London Gatwick Airport',
                        arrPt: 'LGW',
                    },
                ],
            },
            stay: 7,
        } as IOfferWithoutAltBoards,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should render with className when className prop is defined', () => {
        mocks.className = 'third';
        const { container } = render(<BasketThirdCell {...mocks} />);

        expect(container.querySelector('.third-cell')).toBeInTheDocument();
    });

    it('should render correct luggage info', () => {
        const { queryByTestId } = render(<BasketThirdCell {...mocks} />);

        expect(luggageUtils.getHoldItemsLabel).toHaveBeenCalledWith(7, mockStores.layoutStore.getPhrase);
        expect(queryByTestId('luggage')).toHaveTextContent('getHoldItemsLabel result');
    });

    describe('Transfer', () => {
        it('should NOT render any transfer item when transfer is hidden', () => {
            mockStores.bookingStore.transfer = { isHidden: true } as Nullable<ITransfer>;
            const { queryByTestId } = render(<BasketThirdCell {...mocks} />);

            expect(queryByTestId('transfer-shared')).not.toBeInTheDocument();
            expect(queryByTestId('transfer-private')).not.toBeInTheDocument();
        });

        describe('Shared transfer', () => {
            beforeEach(() => {
                mockStores.bookingStore.transfer = { type: TransferType.Shared } as Nullable<ITransfer>;
            });

            it('should render TransferLabelsSelected label when selectedTransferCode is not equal with defaultTransferFromUrl and transfer is shared', () => {
                const { queryByTestId } = render(<BasketThirdCell {...mocks} />);

                expect(queryByTestId('transfer-shared')).toHaveTextContent(SitecoreDictionary.TransferLabelsSelected);
            });

            it('should render TransferLabelsIncluded label when selectedTransferCode the same as defaultTransferFromUrl and transfer is shared', () => {
                mockStores.bookingStore.selectedTransferCode = '1';
                const { queryByTestId } = render(<BasketThirdCell {...mocks} />);

                expect(queryByTestId('transfer-shared')).toHaveTextContent(SitecoreDictionary.TransferLabelsIncluded);
            });
        });

        describe('Private transfer', () => {
            it('should render TransferLabelsPrivateTransfer label when transfer is private', () => {
                mockStores.bookingStore.transfer = { type: TransferType.Private } as Nullable<ITransfer>;
                const { queryByTestId } = render(<BasketThirdCell {...mocks} />);

                expect(queryByTestId('transfer-private')).toHaveTextContent(
                    SitecoreDictionary.TransferLabelsPrivateTransfer,
                );
            });
        });
    });

    it('should render HotelDetailsLabelsAtolProtected label', () => {
        const { queryByTestId } = render(<BasketThirdCell {...mocks} />);

        expect(queryByTestId('atol-protected')).toHaveTextContent(SitecoreDictionary.HotelDetailsLabelsAtolProtected);
        expect(queryByTestId('atol-protected')).toHaveClass('list-item--icon list-item--no-icon');
    });

    it('should not render HotelDetailsLabelsAtolProtected label is it is AB testing component', () => {
        mocks.isABTestingComponent = true;
        const { queryByTestId } = render(<BasketThirdCell {...mocks} />);

        expect(queryByTestId('atol-protected')).toBeNull();
    });

    it('should not render ATOL label when ATOL is disabled on sitecore', () => {
        mockStores.layoutStore.isATOLProtectionEnabled = false;
        const { queryByTestId } = render(<BasketThirdCell {...mocks} />);

        expect(queryByTestId('atol-protected')).toBeNull();
    });

    it('should render holiday duration if transfer is hidden and it is AB testing component', () => {
        mocks.isABTestingComponent = true;
        mockStores.bookingStore.transfer = { isHidden: true } as Nullable<ITransfer>;
        const { queryByText } = render(<BasketThirdCell {...mocks} />);

        expect(queryByText(`7 ${SitecoreDictionary.GlobalsLabelsNightsPlural}`)).toBeInTheDocument();
    });

    it('should render holiday duration if there is no transport and it is AB testing component', () => {
        mocks.isABTestingComponent = true;
        mockStores.bookingStore.transfer = null;
        const { queryByText } = render(<BasketThirdCell {...mocks} />);

        expect(queryByText(`7 ${SitecoreDictionary.GlobalsLabelsNightsPlural}`)).toBeInTheDocument();
    });

    it('should have reverse class if it is AB testing component', () => {
        mocks.isABTestingComponent = true;
        mocks.className = 'third';
        const { container } = render(<BasketThirdCell {...mocks} />);

        expect(container.querySelector('.third-cell.reverse')).toBeInTheDocument();
    });
});
