import React from 'react';
import { render, screen } from '@testing-library/react';

import { TruncatedTooltip } from './TruncatedTooltip';

const createStores = () => ({
    appStore: {
        isScreenLarge: true,
    },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('react-tooltip', () => ({
    Tooltip: jest.fn().mockImplementation(() => <div role='tooltip' />),
}));

describe('TruncatedTooltip', () => {
    const originalScrollWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');
    const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');

    afterAll(() => {
        Object.defineProperty(HTMLElement.prototype, 'scrollWidth', originalScrollWidth || {});
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalClientWidth || {});
    });

    beforeEach(() => {
        mockStores = createStores();
    });

    it('should show tooltip when on desktop screen if text too long', async () => {
        Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 500 });
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 100 });

        render(
            <TruncatedTooltip
                text={'Lorem Ipsum is simply dummy text of the printing and typesetting industry'}
                id='test-id-1'
                className='tooltip'
            />,
        );

        expect(screen.queryByRole('tooltip')).toBeInTheDocument();
    });

    it('should not show tooltip on small screen', async () => {
        Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 500 });
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 100 });

        mockStores.appStore.isScreenLarge = false;

        render(
            <TruncatedTooltip
                text={'Lorem Ipsum is simply dummy text of the printing and typesetting industry'}
                id='test-id-1'
                className='tooltip'
            />,
        );

        expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('should not show tooltip if text small', async () => {
        Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 100 });
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 500 });

        render(
            <TruncatedTooltip
                text={'Lorem Ipsum is simply dummy text of the printing and typesetting industry'}
                id='test-id-1'
                className='tooltip'
            />,
        );

        expect(screen.queryByRole('tooltip')).toBeNull();
    });
});
