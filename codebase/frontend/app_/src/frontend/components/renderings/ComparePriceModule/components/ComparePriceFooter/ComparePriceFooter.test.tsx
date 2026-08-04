import React from 'react';
import { render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ComparePriceFooter, { IComparePriceFooterProps } from './ComparePriceFooter';

const mockButtonComponent = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonComponent(props);

        return <button onClick={props.onClick}>{props.children}</button>;
    },
}));

const createProps = (): IComparePriceFooterProps => ({
    disabled: false,
    isCancelTransparent: true,
    getPhrase: jest.fn(p => p),
    isDisabled: false,
    onCancel: jest.fn(),
    onClick: jest.fn(),
    confirmButtonText: 'confirm button',
});

let props;

describe('<ComparePriceFooter />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should be rendered', () => {
        const { container } = render(<ComparePriceFooter {...props} />);

        expect(container.querySelectorAll('button')).toHaveLength(2);
        expect(screen.getByText(SitecoreDictionary.GlobalsButtonsCancel)).toBeInTheDocument();
        expect(screen.getByText('confirm button')).toBeInTheDocument();
    });

    it('should pass valid props to cancel-button', () => {
        render(<ComparePriceFooter {...props} />);

        expect(mockButtonComponent).toHaveBeenNthCalledWith(1, {
            children: SitecoreDictionary.GlobalsButtonsCancel,
            dataTid: 'cancel-button',
            className: 'cancel',
            isTransparent: true,
            onClick: expect.any(Function),
        });
    });

    it('should pass valid props to confirm-button', () => {
        render(<ComparePriceFooter {...props} />);

        expect(mockButtonComponent).toHaveBeenNthCalledWith(2, {
            children: 'confirm button',
            dataTid: 'confirm-button',
            className: 'confirm',
            disabled: false,
            isDisabled: false,
            onClick: expect.any(Function),
        });
    });
});
