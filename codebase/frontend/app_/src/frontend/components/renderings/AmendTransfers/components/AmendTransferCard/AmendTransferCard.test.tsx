import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { ITransfer } from 'models/data/ITransfer';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';

import AmendTransferCard, { IAmendTransferCardProps } from './AmendTransferCard';

expect.extend(toHaveNoViolations);

const getMockProps = (): IAmendTransferCardProps => ({
    currency: CurrencyCode.GBP,
    transfer: {
        type: TransferType.Shared,
        code: 'X9099191BERP',
        name: 'Transfer Name',
        content: 'Transfer Content',
        iconUrl: 'iconUrl',
        transferInfo: {
            duration: 13,
        },
    } as ITransfer,
    amendCharge: 10.01,
    className: 'additional-classname',
    contentClassName: 'content-classname',
    isSelected: false,
    isPayment: false,
    isAmendAppearance: false,
    isPriceBlockHidden: false,
    onSelect: jest.fn(),
    priceTitle: 'Total Price',
    errataMessages: ['errataMessages-1', 'errataMessages-2'],
    priceTooltipText: <div data-tid='price-tooltip-text' />,
});

let mockProps: IAmendTransferCardProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockDurationProps = jest.fn();
jest.mock('frontend/components/renderings/Transfer/components/TransferDuration/TransferDuration', () => ({
    __esModule: true,
    default: props => {
        mockDurationProps(props);

        return <div data-tid='duration' />;
    },
}));

const mockErrataMessagesProps = jest.fn();
jest.mock('frontend/components/renderings/AmendFlights/components/AmendErrataMessages/AmendErrataMessages', () => ({
    __esModule: true,
    default: props => {
        mockErrataMessagesProps(props);

        return <div data-tid='errata-messages' />;
    },
}));

const mockCalloutProps = jest.fn();
jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    default: ({ content, ...restProps }) => {
        mockCalloutProps(restProps);

        return <div data-tid='callout'>{content}</div>;
    },
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

const mockBlockSelectedProps = jest.fn();
jest.mock('frontend/components/common/BlockSelected', () => ({
    __esModule: true,
    default: props => {
        mockBlockSelectedProps(props);

        return <div data-tid='block-selected' />;
    },
}));

describe('<AmendTransferCard />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = getMockProps();
    });

    it('Should render component', () => {
        const { container } = render(<AmendTransferCard {...mockProps} />);

        const transferCard = screen.getByTestId('amend-transfer-card');

        expect(transferCard).toHaveClass('amend-transfer-card withDuration additional-classname');
        expect(screen.getByTestId('callout')).toBeInTheDocument();
        expect(screen.getByTestId('price-tooltip-text')).toBeInTheDocument();
        expect(mockCalloutProps).toHaveBeenCalledWith({
            orientation: CalloutOrientation.Top,
            position: CalloutPosition.Right,
            isShownOnHover: true,
            className: 'ms-2 mt-1 text-center',
        });
        expect(screen.getByTestId('button')).toHaveTextContent(SitecoreDictionary.TransferLabelsSelect);
        expect(mockButtonProps).toHaveBeenCalledWith({
            className: 'select-transfer',
        });
        expect(screen.getByTestId('errata-messages')).toBeInTheDocument();
        expect(mockErrataMessagesProps).toHaveBeenCalledWith({
            errataInfo: ['errataMessages-1', 'errataMessages-2'],
            expandId: 'Transfer Name',
        });
        expect(screen.getByTestId('duration')).toBeInTheDocument();
        expect(mockDurationProps).toHaveBeenCalledWith({
            className: 'transferDuration',
            duration: 13,
        });
        expect(screen.getByText('Transfer Name')).toBeInTheDocument();
        expect(screen.getByText('Transfer Content')).toBeInTheDocument();
        expect(screen.getByTestId('amend-transfer-price-title')).toHaveTextContent('Total Price');
        expect(screen.getByTestId('amend-transfer-price')).toHaveTextContent('£11');
        expect(screen.getByText(SitecoreDictionary.PriceSummaryLabelsTotal)).toBeInTheDocument();
        expect(container.querySelector('.card__icon')).toBeInTheDocument();

        expect(screen.queryByTestId('block-selected')).not.toBeInTheDocument();
        expect(screen.queryByTestId('amend-transfer-payment-block')).not.toBeInTheDocument();
    });

    it('Should render component with 0 price when amendCharge and revertPrice are undefined', () => {
        mockProps.amendCharge = undefined;
        mockProps.revertPrice = undefined;

        render(<AmendTransferCard {...mockProps} />);

        expect(screen.getByTestId('amend-transfer-price')).toHaveTextContent('£0');
    });

    it('Should be rendered component with revertPrice', () => {
        mockProps.amendCharge = 13.01;
        mockProps.revertPrice = 15.1;

        render(<AmendTransferCard {...mockProps} />);

        expect(screen.getByTestId('amend-transfer-price')).toHaveTextContent('£15');
    });

    it('Should NOT render transfer duration when transferInfo exists', () => {
        mockProps.transfer.transferInfo = undefined;

        render(<AmendTransferCard {...mockProps} />);

        expect(screen.queryByTestId('duration')).not.toBeInTheDocument();
    });

    it('Should NOT render price title if it was not provided', () => {
        mockProps.priceTitle = undefined;

        render(<AmendTransferCard {...mockProps} />);

        expect(screen.queryByTestId('amend-transfer-price-title')).not.toBeInTheDocument();
    });

    it('Should NOT render callout if no priceTooltipText', () => {
        mockProps.priceTooltipText = undefined;

        render(<AmendTransferCard {...mockProps} />);

        expect(screen.queryByTestId('callout')).not.toBeInTheDocument();
    });

    it('Should NOT render errata messages if they do not exists', () => {
        mockProps.errataMessages = undefined;

        render(<AmendTransferCard {...mockProps} />);

        expect(screen.queryByTestId('errata-messages')).not.toBeInTheDocument();
    });

    it('Should render BlockSelected component', () => {
        mockProps.isSelected = true;

        render(<AmendTransferCard {...mockProps} />);

        expect(screen.getByTestId('block-selected')).toBeInTheDocument();
        expect(mockBlockSelectedProps).toHaveBeenCalledWith({
            className: 'blockSelected',
            siteCoreKey: SitecoreDictionary.TransferButtonsSelected,
        });
    });

    describe('Payment block', () => {
        it('Should render payment block', () => {
            mockProps.isPayment = true;

            render(<AmendTransferCard {...mockProps} />);

            expect(screen.getByTestId('amend-transfer-payment-block')).toBeInTheDocument();
            expect(screen.getByTestId('amend-transfer-price')).toHaveTextContent('£11');
        });

        it('Should NOT render price block when isPriceBlockHidden prop is passed', () => {
            mockProps.isPayment = true;
            mockProps.isPriceBlockHidden = true;

            render(<AmendTransferCard {...mockProps} />);

            expect(screen.getByTestId('amend-transfer-payment-block')).toBeInTheDocument();
            expect(screen.queryByTestId('amend-transfer-price')).not.toBeInTheDocument();
        });
    });

    it('Should call onSelect from props when clock on select button', async () => {
        render(<AmendTransferCard {...mockProps} />);

        const button = screen.getByTestId('button');

        await userEvent.click(button);

        expect(mockProps.onSelect).toHaveBeenCalled();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendTransferCard {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });

    it('should render amendView className when isAmendAppearance props has been provided', () => {
        mockProps.isAmendAppearance = true;
        render(<AmendTransferCard {...mockProps} />);

        expect(screen.getByTestId('amend-transfer-card')).toHaveClass(
            'amend-transfer-card amendView withDuration additional-classname',
        );
    });

    it('should NOT render price when isAmendAppearance props has been provided', () => {
        mockProps.isAmendAppearance = true;
        render(<AmendTransferCard {...mockProps} />);

        expect(screen.queryByTestId('amend-transfer-price')).not.toBeInTheDocument();
    });

    it('should render price on button when isAmendAppearance props has been provided', () => {
        mockProps.isAmendAppearance = true;
        render(<AmendTransferCard {...mockProps} />);

        expect(screen.getByTestId('price-on-button')).toHaveTextContent(
            `£11 ${SitecoreDictionary.PriceSummaryLabelsTotal}`,
        );
    });
});
