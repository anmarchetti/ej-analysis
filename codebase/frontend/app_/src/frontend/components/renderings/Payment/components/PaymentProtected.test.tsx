import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import { PaymentProtected } from './PaymentProtected';

const mockImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockImage(props);

        return <div data-tid='jss-image' />;
    },
}));

describe('<PaymentProtected />', () => {
    const resetMocks = () => ({
        protectionImage: mockSitecoreField({ src: 'src' }),
        protectionTitle: mockSitecoreField('ProtectionTitle'),
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('Should standard render', () => {
        render(<PaymentProtected {...mocks} />);

        const component = screen.getByTestId('payment-protection');

        expect(component).toHaveClass('payment-protection');
        expect(component).toHaveTextContent(mocks.protectionTitle.value);
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockImage).toBeCalledWith({ field: mocks.protectionImage });
    });

    it('Should empty render when no props provided', () => {
        render(<PaymentProtected />);

        const component = screen.getByTestId('payment-protection');
        expect(component).toBeEmptyDOMElement();
    });
});
