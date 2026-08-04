import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import TransferDurationPromo, { ITransferDurationPromoProps } from './TransferDurationPromo';

const createProps = (): ITransferDurationPromoProps => ({
    timeDiff: 10,
    siteCoreValue: 'value',
    className: 'transferDurationPromo',
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Callout/Callout', () => () => <div data-tid='callout' />);

let mockProps;
let mockStores;

describe('<TransferDurationPromo />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render default', () => {
        render(<TransferDurationPromo {...mockProps} />);

        expect(screen.getByText('value')).toBeInTheDocument();
        expect(screen.getByTestId('callout')).toBeInTheDocument();
        expect(screen.getByTestId('transfer-duration-value')).toHaveClass(mockProps.className);
    });

    it('should NOT render when timeDiff is 0 or less', () => {
        mockProps.timeDiff = 0;

        const { container } = render(<TransferDurationPromo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render TransferLabelsDurationPromoTitle when siteCoreValue NOT provided', () => {
        mockProps.siteCoreValue = undefined;

        render(<TransferDurationPromo {...mockProps} />);

        expect(screen.getByText(SitecoreDictionary.TransferLabelsDurationPromoTitle)).toBeInTheDocument();
    });
});
