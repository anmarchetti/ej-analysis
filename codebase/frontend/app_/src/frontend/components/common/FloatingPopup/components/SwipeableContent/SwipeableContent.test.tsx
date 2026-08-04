import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { FloatingPopupContext } from 'frontend/components/common/FloatingPopup/FloatingPopup';

import SwipeableContent from './SwipeableContent';

expect.extend(toHaveNoViolations);

const createProps = () => ({
    children: <div />,
});

const createContextValue = () => ({
    onClose: jest.fn(),
    setTranslateY: jest.fn(),
});

let mockProps;
let contextValue;

const mockSwipeable = jest.fn();

jest.mock('react-swipeable', () => ({
    __esModule: true,
    Swipeable: props => {
        mockSwipeable(props);

        return <div data-tid='swipeable' />;
    },
}));

let mockUseMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

describe('SwipeableContent', () => {
    beforeEach(() => {
        mockProps = createProps();
        contextValue = createContextValue();
    });

    it('should call Swipeable with props', () => {
        render(
            <FloatingPopupContext.Provider value={contextValue}>
                <SwipeableContent {...mockProps} />
            </FloatingPopupContext.Provider>,
        );

        expect(mockSwipeable).toHaveBeenCalledWith(
            expect.objectContaining({ className: 'swipeZone', children: mockProps.children }),
        );
    });

    it('should call setTranslateY with 0 when deltaY >= 0', () => {
        render(
            <FloatingPopupContext.Provider value={contextValue}>
                <SwipeableContent {...mockProps} />
            </FloatingPopupContext.Provider>,
        );

        mockSwipeable.mock.calls[0][0].onSwiping({
            absY: 0,
            deltaY: 0,
            event: { preventDefault: jest.fn(), stopPropagation: jest.fn() },
        });

        expect(contextValue.setTranslateY).toHaveBeenCalledWith(0);
    });

    it('should call setTranslateY with absY when deltaY < 0', () => {
        render(
            <FloatingPopupContext.Provider value={contextValue}>
                <SwipeableContent {...mockProps} />
            </FloatingPopupContext.Provider>,
        );

        mockSwipeable.mock.calls[0][0].onSwiping({
            absY: 5,
            deltaY: -10,
            event: { preventDefault: jest.fn(), stopPropagation: jest.fn() },
        });

        expect(contextValue.setTranslateY).toHaveBeenCalledWith(5);
    });

    it('should call onClose when direction Down', () => {
        render(
            <FloatingPopupContext.Provider value={contextValue}>
                <SwipeableContent {...mockProps} />
            </FloatingPopupContext.Provider>,
        );

        mockSwipeable.mock.calls[0][0].onSwiped({
            dir: 'Down',
        });

        expect(contextValue.onClose).toHaveBeenCalled();
    });

    it('should NOT call onClose when direction Up', () => {
        render(
            <FloatingPopupContext.Provider value={contextValue}>
                <SwipeableContent {...mockProps} />
            </FloatingPopupContext.Provider>,
        );

        mockSwipeable.mock.calls[0][0].onSwiped({
            dir: 'Up',
        });

        expect(contextValue.onClose).not.toHaveBeenCalled();
    });

    it('should NOT call onClose when not mobile', () => {
        mockUseMobileViewport = false;
        render(
            <FloatingPopupContext.Provider value={contextValue}>
                <SwipeableContent {...mockProps} />
            </FloatingPopupContext.Provider>,
        );

        mockSwipeable.mock.calls[0][0].onSwiped({
            dir: 'Down',
        });

        expect(contextValue.onClose).not.toHaveBeenCalled();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(
                <FloatingPopupContext.Provider value={contextValue}>
                    <SwipeableContent {...mockProps} />{' '}
                </FloatingPopupContext.Provider>,
            );
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
