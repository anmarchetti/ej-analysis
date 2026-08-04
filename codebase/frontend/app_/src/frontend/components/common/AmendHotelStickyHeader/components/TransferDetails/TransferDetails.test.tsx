import { render, screen } from '@testing-library/react';

import { mockTransfer } from 'frontend/__mocks__';

import TransferDetails from './TransferDetails';

const createMockProps = () => ({
    transfer: mockTransfer,
});

let mockProps;

const mockImageFilterProps = jest.fn();
jest.mock('frontend/components/common/ImageWithFilter/ImageWithFilter', () => ({
    __esModule: true,
    SVGFilterMatrix: {
        Grayscale: 'Grayscale',
        orange: 'orange',
    },
    default: props => {
        mockImageFilterProps(props);

        return <div data-tid={props.dataTid ?? 'image-with-filter'} />;
    },
}));

describe('<TransferDetails />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should render TransferDetails component', () => {
        render(<TransferDetails {...mockProps} />);

        expect(screen.getByTestId('transfer-details')).toBeInTheDocument();
        expect(mockImageFilterProps).toHaveBeenCalledWith(
            expect.objectContaining({
                filterMatrix: 'Grayscale',
                imageSrc: 'https://example.com/transfer-icon.png',
                dataTid: 'transfer-details-icon',
            }),
        );
        expect(screen.getByText('Transfer Name')).toBeInTheDocument();
    });

    it('should render dataTid if provided', () => {
        mockProps.dataTid = 'test-id';
        render(<TransferDetails {...mockProps} />);

        expect(screen.getByTestId('test-id')).toBeInTheDocument();
        expect(screen.getByTestId('test-id-title')).toBeInTheDocument();
    });

    it('should render className if provided', () => {
        mockProps.className = 'test-class';
        render(<TransferDetails {...mockProps} />);

        expect(screen.getByTestId('transfer-details')).toHaveClass('test-class');
    });

    it('should NOT render transfer icon if transferIconUrl does not exist', () => {
        mockProps.transfer.iconUrl = null;
        render(<TransferDetails {...mockProps} />);

        expect(screen.queryByTestId('transfer-details-icon')).not.toBeInTheDocument();
    });
});
