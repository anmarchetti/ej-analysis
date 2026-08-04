import * as React from 'react';
import { render } from '@testing-library/react';

import OverlaySpinner from './OverlaySpinner';

const createStores = () => ({
    layoutStore: {
        getSetting: jest.fn(),
    },
});

const mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('PaymentSpinner', () => {
    it('Should standard render', () => {
        const { container } = render(<OverlaySpinner />);

        expect(container.querySelector('.overlay-spinner')).toBeTruthy();
        expect(container.querySelector('.overlay-spinner__icon')).toBeTruthy();
        expect(container.querySelector('.overlay-spinner__icon-container')).toContainElement(
            container.querySelector('.overlay-spinner__icon'),
        );
        expect(container.querySelector('.overlay-spinner__header')).toBeFalsy();
        expect(container.querySelector('.overlay-spinner__description')).toBeFalsy();
    });

    it('Should render header and description when they declared', () => {
        const props = {
            header: 'header',
            description: 'description',
        };
        const { container } = render(<OverlaySpinner {...props} />);

        expect(container.querySelector('.overlay-spinner')).toBeTruthy();
        expect(container.querySelector('.overlay-spinner__header')).toBeTruthy();
        expect(container.querySelector('.overlay-spinner__header')).toHaveTextContent(props.header);
        expect(container.querySelector('.overlay-spinner__description')).toBeTruthy();
        expect(container.querySelector('.overlay-spinner__description')).toHaveTextContent(props.description);
    });

    it('Should update body styles on mount and unmount', () => {
        const { unmount } = render(<OverlaySpinner />);

        expect(document.body.style.overflow).toEqual('hidden');

        unmount();

        expect(document.body.style.overflow).toEqual('');
    });
});
