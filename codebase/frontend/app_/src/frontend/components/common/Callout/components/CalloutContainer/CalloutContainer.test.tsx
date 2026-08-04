import * as React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CalloutContainer } from 'frontend/components/common/Callout/components/CalloutContainer/CalloutContainer';

describe('<CalloutContainer />', () => {
    const createProps = () => ({
        containerClass: 'containerClass',
        containerRef: {
            current: {
                contains: jest.fn(),
            },
        } as any,
        onClose: jest.fn(),
    });
    let props = createProps();

    beforeEach(() => {
        props = createProps();
    });

    it('should add/remove EventListener on mount/unmount', () => {
        const mockDocAddEvent = jest.spyOn(document, 'addEventListener');
        const mockDocRemoveEvent = jest.spyOn(document, 'removeEventListener');

        const { unmount } = render(<CalloutContainer {...props} />);

        expect(mockDocAddEvent).toBeCalled();
        unmount();
        expect(mockDocRemoveEvent).toBeCalled();
    });

    it('should call onClose if click is outside the callout', async () => {
        props.containerRef.current.contains.mockReturnValue(false);
        render(<CalloutContainer {...props} />);

        await userEvent.click(document.body);

        expect(props.onClose).toBeCalled();
    });

    it('should call onClose if click is inside the callout and isCloseWhenClickOnContent', async () => {
        props.containerRef.current.contains.mockReturnValue(true);
        render(<CalloutContainer {...props} isCloseWhenClickOnContent />);

        await userEvent.click(document.body);

        expect(props.onClose).toBeCalled();
    });

    it('should NOT call onClose if click is inside the callout', async () => {
        props.containerRef.current.contains.mockReturnValue(true);
        render(<CalloutContainer {...props} />);

        await userEvent.click(document.body);

        expect(props.onClose).not.toBeCalled();
    });

    it('should calculate width as 0', () => {
        const { container } = render(<CalloutContainer {...props} calculateWidth />);

        expect(container.firstChild).toHaveClass('centered-by-content hidden');
        expect(container.firstChild).toHaveStyle({ left: `calc(20% - 0px)` });
    });
});
