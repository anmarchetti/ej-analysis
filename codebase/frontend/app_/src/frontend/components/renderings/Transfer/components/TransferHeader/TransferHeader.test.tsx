import React from 'react';
import { render, screen } from '@testing-library/react';

import { ITransfer } from 'models/data/ITransfer';
import TransferHeader, {
    ITransferHeaderProps,
} from 'frontend/components/renderings/Transfer/components/TransferHeader/TransferHeader';

const mockImageWithFilter = jest.fn();
jest.mock('frontend/components/common/ImageWithFilter/ImageWithFilter', () => ({
    __esModule: true,
    default: props => {
        mockImageWithFilter(props);

        return <div {...props} data-tid='image-with-filter' />;
    },
    SVGFilterMatrix: () => ({ Lightblack: '' }),
}));

const mockTransferDuration = jest.fn();
jest.mock('frontend/components/renderings/Transfer/components/TransferDuration/TransferDuration', () => ({
    __esModule: true,
    default: props => {
        mockTransferDuration(props);

        return <div {...props} data-tid='transfer-duration' />;
    },
}));

const mockProps: ITransferHeaderProps = {
    name: 'Transfer',
    iconUrl: 'test-icon-url',
    transferInfo: {
        duration: 60,
    } as ITransfer['transferInfo'],
    isNoTransfer: false,
    isShouldShowTransferDuration: true,
};

describe('<TransferHeader />', () => {
    it('should render default', () => {
        render(<TransferHeader {...mockProps} />);

        expect(screen.getByTestId('image-with-filter')).toBeInTheDocument();
        expect(mockImageWithFilter).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'icon',
                filterMatrix: undefined,
                imageSrc: 'test-icon-url',
            }),
        );

        expect(screen.getByTestId('name-Transfer')).toHaveTextContent('Transfer');

        expect(screen.getByTestId('transfer-duration')).toBeInTheDocument();
        expect(mockTransferDuration).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'transferDuration',
                duration: 60,
                hideOnMobile: true,
                iconClassName: 'transferDurationIcon',
            }),
        );
    });

    describe('should NOT render icon when ', () => {
        it('iconUrl is missing', () => {
            mockProps.iconUrl = undefined;

            render(<TransferHeader {...mockProps} />);

            expect(screen.queryByTestId('image-with-filter')).not.toBeInTheDocument();
        });

        it('is isNoTransfer', () => {
            mockProps.isNoTransfer = true;

            render(<TransferHeader {...mockProps} />);

            expect(screen.queryByTestId('image-with-filter')).not.toBeInTheDocument();
        });
    });

    it('should NOt render TransferDuration when isShouldShowTransferDuration is false', () => {
        mockProps.isShouldShowTransferDuration = false;

        render(<TransferHeader {...mockProps} />);

        expect(screen.queryByTestId('transfer-duration')).not.toBeInTheDocument();
    });
});
