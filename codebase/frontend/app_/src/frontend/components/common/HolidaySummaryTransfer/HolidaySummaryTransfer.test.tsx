import { render, screen } from '@testing-library/react';

import { mockTransfer } from 'frontend/__mocks__';

import HolidaySummaryTransfer, { IHolidaySummaryTransferProps } from './HolidaySummaryTransfer';

const createProps = (): IHolidaySummaryTransferProps => ({
    transfer: mockTransfer,
    dataTid: 'test-tid',
});

let props: IHolidaySummaryTransferProps;

const mockImageFilterProps = jest.fn();

jest.mock('frontend/components/common/ImageWithFilter/ImageWithFilter', () => ({
    __esModule: true,
    SVGFilterMatrix: {
        Grayscale: 'grayscale',
        Orange: 'orange',
    },
    default: props => {
        mockImageFilterProps(props);

        return <div data-tid='image-with-filter' />;
    },
}));

describe('<HolidaySummaryTransfer />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('Should render transfer information', () => {
        render(<HolidaySummaryTransfer {...props} />);

        expect(mockImageFilterProps).toHaveBeenCalledWith(expect.objectContaining({ filterMatrix: 'grayscale' }));
        expect(screen.getByText('Transfer Name')).toBeInTheDocument();
    });

    it('Should NOT render hidden transfer when isHidden field in current transfer is true', () => {
        props.transfer.isHidden = true;

        const { container } = render(<HolidaySummaryTransfer {...props} />);

        expect(container).toBeEmptyDOMElement();
    });
});
