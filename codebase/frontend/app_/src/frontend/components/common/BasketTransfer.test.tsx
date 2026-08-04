import React from 'react';
import { render, screen } from '@testing-library/react';

import { PackageIconTypes } from 'models/enum/PackageIconTypes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';

import { BasketTransfer } from './BasketTransfer';

jest.mock('frontend/components/icons-new/TaxiFilled', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-taxi-filled' />,
}));

jest.mock('frontend/components/icons-new/TransferFilled', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-transfer-filled' />,
}));

jest.mock('./ImageWithFilter/ImageWithFilter', () => ({
    __esModule: true,
    default: () => <svg data-tid='image-with-filter' />,
    SVGFilterMatrix: {
        Grayscale: 'mocked-grayscale',
    },
}));

const resetMocks = () => ({
    transfer: null,
    packageIcons: null,
    getPhrase: jest.fn(p => p),
});

let mocks;

describe('<BasketTransfer />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('Should be empty render', () => {
        const { container } = render(<BasketTransfer {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render default icon for shared transfer type when no props.packageIcons', () => {
        mocks.transfer = { type: TransferType.Shared };
        render(<BasketTransfer {...mocks} />);

        expect(screen.getByTestId('transfer-included')).toBeInTheDocument();
        expect(screen.getByTestId('icon-transfer-filled')).toBeInTheDocument();
    });

    it('Should render Private transfer with default icon', () => {
        mocks.transfer = { type: TransferType.Private };
        render(<BasketTransfer {...mocks} />);

        expect(screen.getByTestId('transfer-included')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.TransferLabelsPrivateTransfer)).toBeInTheDocument();
        expect(screen.getByTestId('icon-taxi-filled')).toBeInTheDocument();
    });

    it('Should render Shared transfer with package icon', () => {
        mocks.transfer = { type: TransferType.Shared };
        mocks.packageIcons = [{ key: PackageIconTypes.SharedTransfer, iconUrl: 'test' }];
        render(<BasketTransfer {...mocks} />);

        expect(screen.getByText(SitecoreDictionary.TransferLabelsIncluded)).toBeInTheDocument();
        expect(screen.getByTestId('image-with-filter')).toBeInTheDocument();
    });

    it('Should render default transfer icon if there is not approriate package icon for current transfer type', () => {
        mocks.transfer = { type: TransferType.Private };
        mocks.packageIcons = [{ key: 'test', iconUrl: 'test' }];
        render(<BasketTransfer {...mocks} />);

        expect(screen.getByText(SitecoreDictionary.TransferLabelsPrivateTransfer)).toBeInTheDocument();
        expect(screen.getByTestId('icon-taxi-filled')).toBeInTheDocument();
    });
});
