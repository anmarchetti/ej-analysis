import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { StickyBox } from './StickyBox';

const createProps = () =>
    ({
        offsetCompensation: 0,
        render: jest.fn(() => <div data-tid='test-render' />),
        stickyMobile: true,
    } as any);

let props;
const mockAddEventListener = jest.spyOn(document, 'addEventListener');
const mockRemoveEventListener = jest.spyOn(document, 'removeEventListener');

describe('<StickyBox />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render without sticky class', () => {
        const { container } = render(<StickyBox {...props} />);

        expect(container.getElementsByClassName('sticky-box')[0]).toHaveClass('sticky-mobile');
        expect(screen.getByTestId('sticky-box')).toBeInTheDocument();
        expect(screen.getByTestId('test-render')).toBeInTheDocument();
        expect(mockAddEventListener).toHaveBeenCalled();
    });

    it('should call remove event listener on unmount', () => {
        const { unmount } = render(<StickyBox {...props} />);

        unmount();

        expect(mockRemoveEventListener).toHaveBeenCalled();
    });
});
