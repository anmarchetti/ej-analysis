import { fireEvent, render, screen } from '@testing-library/react';

import AccordionPanel from './AccordionPanel';

const mockedHeightAnimatedContainer = jest.fn();
jest.mock('frontend/components/common/HeightAnimatedContainer/HeightAnimatedContainer', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockedHeightAnimatedContainer(props);

        return <div data-tid='height-animated-container'>{children}</div>;
    },
}));

const resetMocks = () => ({
    panelId: 'id',
    title: 'title',
    content: 'content',
    isOpened: false,
    onTogglePanel: jest.fn(),
});

let mocks;

describe('AccordionPanel', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render closed panel', () => {
        const { container } = render(<AccordionPanel {...mocks} />);

        expect(container.querySelector('.accordion__panel')).not.toHaveClass('accordion__panel--open');
        expect(mockedHeightAnimatedContainer).toHaveBeenCalledWith({
            isOpened: mocks.isOpened,
            keepMounted: true,
        });
    });

    it('should render opened panel', () => {
        mocks.isOpened = true;
        const { container } = render(<AccordionPanel {...mocks} />);

        expect(container.querySelector('.accordion__panel')).toHaveClass('accordion__panel--open');
        expect(mockedHeightAnimatedContainer).toHaveBeenCalledWith({
            isOpened: mocks.isOpened,
            keepMounted: true,
        });
    });

    it('should call onTogglePanel()', () => {
        render(<AccordionPanel {...mocks} />);

        fireEvent.click(screen.getByRole('button', { name: mocks.title }));

        expect(mocks.onTogglePanel).toHaveBeenCalled();
    });
});
