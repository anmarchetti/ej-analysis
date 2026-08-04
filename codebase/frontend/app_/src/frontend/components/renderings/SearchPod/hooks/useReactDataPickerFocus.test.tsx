import React, { useRef } from 'react';
import { fireEvent, render } from '@testing-library/react';

import { KeyboardKey } from 'models/enum/KeyboardKey';
import useReactDataPickerFocus from 'frontend/components/renderings/SearchPod/hooks/useReactDataPickerFocus';

let mockUseMobileViewPort = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewPort,
}));

const TestComponent = () => {
    const ref = useRef<HTMLDivElement>(null);
    useReactDataPickerFocus({ datePickerWrapper: ref });

    return (
        <div ref={ref}>
            <div className='react-datepicker__month'>
                <button className='react-datepicker__day' tabIndex={0}>
                    1
                </button>
            </div>
        </div>
    );
};

describe('useReactDataPickerFocus', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockUseMobileViewPort = false;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should NOT add event listener on mobile', () => {
        mockUseMobileViewPort = true;
        const { container } = render(<TestComponent />);
        const element = container.querySelector('.react-datepicker__month');

        fireEvent.keyDown(element!, { key: KeyboardKey.ArrowLeft });
        jest.runAllTimers();
        expect(container.querySelector('.react-datepicker__day[tabindex="0"]')).not.toHaveFocus();
    });

    it('should add event listener on component mount', () => {
        const addSpy = jest.spyOn(HTMLElement.prototype, 'addEventListener');

        render(<TestComponent />);

        expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        addSpy.mockRestore();
    });

    it('should remove event listener on component unmount', () => {
        const removeSpy = jest.spyOn(HTMLElement.prototype, 'removeEventListener');

        const { unmount } = render(<TestComponent />);

        unmount();

        expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        removeSpy.mockRestore();
    });

    it('should set focus after click by ArrowLeft', () => {
        const { container } = render(<TestComponent />);
        const element = container.querySelector('.react-datepicker__month');

        fireEvent.keyDown(element!, { key: KeyboardKey.ArrowLeft });
        jest.runAllTimers();
        expect(container.querySelector('.react-datepicker__day[tabindex="0"]')).toHaveFocus();
    });

    it('should set focus after click by ArrowRight', () => {
        const { container } = render(<TestComponent />);
        const element = container.querySelector('.react-datepicker__month');

        fireEvent.keyDown(element!, { key: KeyboardKey.ArrowRight });
        jest.runAllTimers();
        expect(container.querySelector('.react-datepicker__day[tabindex="0"]')).toHaveFocus();
    });

    it('should set focus after click by ArrowUp', () => {
        const { container } = render(<TestComponent />);
        const element = container.querySelector('.react-datepicker__month');

        fireEvent.keyDown(element!, { key: KeyboardKey.ArrowUp });
        jest.runAllTimers();
        expect(container.querySelector('.react-datepicker__day[tabindex="0"]')).toHaveFocus();
    });

    it('should set focus after click by ArrowDown', () => {
        const { container } = render(<TestComponent />);
        const element = container.querySelector('.react-datepicker__month');

        fireEvent.keyDown(element!, { key: KeyboardKey.ArrowDown });
        jest.runAllTimers();
        expect(container.querySelector('.react-datepicker__day[tabindex="0"]')).toHaveFocus();
    });

    it('should NOT set focus after click on Tab', () => {
        jest.useFakeTimers();
        const { container } = render(<TestComponent />);
        const element = container.querySelector('.react-datepicker__month');

        fireEvent.keyDown(element!, { key: KeyboardKey.Tab });
        jest.runAllTimers();
        expect(container.querySelector('.react-datepicker__day[tabindex="0"]')).not.toHaveFocus();
    });
});
