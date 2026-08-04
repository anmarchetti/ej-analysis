import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { ITransfer } from 'models/data/ITransfer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';

import { TransferItem } from './TransferItem';

const createProps = () => ({
    transfer: {
        id: '1',
        name: 'Transfer Name',
        type: TransferType.NoTransfer,
        content: '<ul><li>content</li></ul>',
        iconUrl: 'iconUrl',
        quantity: 1,
        transferInfo: { duration: 60 },
    } as ITransfer,
    isPrintPreview: false,
});

const mockImageWithFilterProps = jest.fn();
jest.mock('frontend/components/common/ImageWithFilter/ImageWithFilter', () => ({
    __esModule: true,
    default: props => {
        mockImageWithFilterProps(props);

        return <div data-tid='image-with-filter' />;
    },
    SVGFilterMatrix: {
        Orange: 'orange',
    },
}));

const mockTransferDurationProps = jest.fn();
jest.mock('frontend/components/renderings/Transfer/components/TransferDuration/TransferDuration', () => ({
    __esModule: true,
    default: props => {
        mockTransferDurationProps(props);

        return <div data-tid='transfer-duration' />;
    },
}));

let props;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/hooks/useDataUrl', () => ({
    __esModule: true,
    default: () => 'dataUrl',
}));

describe('<TransferItem />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            layoutStore: {
                getPhrase: jest.fn(p => p),
                isTransferDurationEnabled: jest.fn(() => true),
            },
            amendTransfersStore: {
                isAmendCTAVisible: false,
                transfersWithAmendmendCharges: [],
                isAmendPriceEnabledOnViewBookingPage: false,
                upgradePrice: 0,
            },
        });
    });

    it('Should render transfer with text and default icon', () => {
        const { container } = render(<TransferItem {...props} />);

        expect(container.querySelector('holiday-summary-item__icon'));
        expect(screen.queryByTestId('image-with-filter')).not.toBeInTheDocument();
        expect(screen.getByText('Transfer Name')).toBeInTheDocument();
        expect(screen.getByText('content')).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: SitecoreDictionary.ViewBookingButtonsAmendTransfers }),
        ).not.toBeInTheDocument();
    });

    it('Should NOT render text if no content', () => {
        props.transfer.content = null;
        const { container } = render(<TransferItem {...props} />);

        expect(container.querySelector('.holiday-summary-item__text')).not.toBeInTheDocument();
    });

    it('Should render orange icon', () => {
        props.isIconOrange = true;
        render(<TransferItem {...props} />);

        expect(mockImageWithFilterProps).toBeCalledWith({
            className: 'holiday-summary-item__icon',
            filterMatrix: 'orange',
            imageSrc: 'iconUrl',
        });
        expect(screen.getByTestId('image-with-filter')).toBeInTheDocument();
    });

    it('should render printable icon', () => {
        props.isIconOrange = true;
        props.isPrintPreview = true;
        render(<TransferItem {...props} />);

        expect(mockImageWithFilterProps).toBeCalledWith(expect.objectContaining({ imageSrc: 'dataUrl' }));
    });

    it('Should render singular number of seats for Shared Transport', () => {
        props.transfer.type = TransferType.Shared;
        props.transfer.quantity = 1;
        props.showOccupancy = true;
        render(<TransferItem {...props} />);

        expect(screen.getByText(`Transfer Name, ${SitecoreDictionary.TransferLabelsSeatSingularPhrase}`));
    });

    it('Should render plural number of seats for Shared Transport', () => {
        props.transfer.type = TransferType.Shared;
        props.transfer.quantity = 8;
        props.showOccupancy = true;
        render(<TransferItem {...props} />);

        expect(screen.getByText(`Transfer Name, ${SitecoreDictionary.TransferLabelsSeatsPluralPhrase}`));
    });

    it('Should NOT render number of seats for Shared Transport if showOccupancy is false', () => {
        props.transfer.type = TransferType.Shared;
        props.transfer.quantity = 8;
        props.showOccupancy = false;
        const { container } = render(<TransferItem {...props} />);
        const title = container.querySelector('.holiday-summary-item__subtitle');

        expect(title).not.toContain(SitecoreDictionary.TransferLabelsSeatsPluralPhrase);
        expect(title).not.toContain(SitecoreDictionary.TransferLabelsSeatSingularPhrase);
    });

    it('Should render TransferDuration when TransferDurationEnabled and duration > 0', () => {
        render(<TransferItem {...props} />);

        expect(screen.getByTestId('transfer-duration')).toBeInTheDocument();
    });

    it('Should NOT render TransferDuration when no duration', () => {
        props.transfer.transferInfo.duration = null;
        render(<TransferItem {...props} />);

        expect(screen.queryByTestId('transfer-duration')).not.toBeInTheDocument();
    });

    it('Should NOT render TransferDuration when duration equals 0', () => {
        props.transfer.transferInfo.duration = 0;
        render(<TransferItem {...props} />);

        expect(screen.queryByTestId('transfer-duration')).not.toBeInTheDocument();
    });

    it('Should render transfer amend button', () => {
        mockStores.amendTransfersStore.isAmendCTAVisible = true;
        render(<TransferItem {...props} />);

        expect(
            screen.getByRole('button', { name: SitecoreDictionary.ViewBookingButtonsAmendTransfers }),
        ).toBeInTheDocument();
    });

    it('Should not render button if isTradePortal', () => {
        mockStores.layoutStore.isTradePortal = true;
        mockStores.amendTransfersStore.isAmendCTAVisible = true;

        render(<TransferItem {...props} />);

        expect(
            screen.queryByRole('button', { name: SitecoreDictionary.ViewBookingButtonsAmendTransfers }),
        ).not.toBeInTheDocument();
    });

    it('Should not render amend button if isFlightAndHotelPackage is true', () => {
        mockStores.amendTransfersStore.isAmendCTAVisible = true;
        mockStores.viewBookingStore.isFlightAndHotelPackage = true;

        render(<TransferItem {...props} />);

        expect(
            screen.queryByRole('button', { name: SitecoreDictionary.ViewBookingButtonsAmendTransfers }),
        ).not.toBeInTheDocument();
    });
});
