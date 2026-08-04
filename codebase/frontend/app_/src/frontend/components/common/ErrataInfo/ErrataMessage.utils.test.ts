import React from 'react';
import { renderHook } from '@testing-library/react';

import { getMaxHeight, measureElement, resizeCallback, useReadMoreButton } from './ErrataMessage.utils';

const getBoundingClientRectSpy = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect');

const observer = {
    observe: jest.fn(),
    disconnect: jest.fn(),
};
global.ResizeObserver = jest.fn().mockImplementation(() => observer);

describe('ErrataMessage.utils', () => {
    describe('getMaxHeight', () => {
        it('should return MAX_DESKTOP_HEIGHT when document width is greater than MOBILE_WIDTH', () => {
            Object.defineProperty(document.documentElement, 'offsetWidth', { value: 800, configurable: true });
            expect(getMaxHeight()).toBe(320);
        });

        it('should return MAX_MOBILE_HEIGHT when document width is less than or equal to MOBILE_WIDTH', () => {
            Object.defineProperty(document.documentElement, 'offsetWidth', { value: 576, configurable: true });
            expect(getMaxHeight()).toBe(520);
        });
    });

    describe('measureElement', () => {
        it('should return correct dimensions for an element with styles applied', () => {
            const clone = document.createElement('div');
            const element = document.createElement('div');

            const excludeChild = { id: 'exclude-id', remove: jest.fn() };

            element.cloneNode = jest.fn(() => clone);
            clone.querySelectorAll = jest.fn().mockReturnValue([excludeChild]);
            clone.getBoundingClientRect = jest.fn();
            clone.remove = jest.fn();

            measureElement(element, [excludeChild.id]);

            expect(element.cloneNode).toHaveBeenCalledWith(true);
            expect(clone.querySelectorAll).toHaveBeenCalledWith('*');
            expect(excludeChild.remove).toHaveBeenCalled();
            expect(clone.getBoundingClientRect).toHaveBeenCalled();

            expect(clone.style.visibility).toBe('hidden');
            expect(clone.style.maxHeight).toBe('none');
            expect(clone.style.height).toBe('auto');
        });
    });

    describe('resizeCallback', () => {
        let wrapper;
        let content;
        const setIsRendered = jest.fn();

        beforeEach(() => {
            content = document.createElement('div');
            wrapper = document.createElement('div').appendChild(content);
        });

        it('should set isRendered to true when wrapper height exceeds max height', () => {
            getBoundingClientRectSpy
                .mockReturnValueOnce({
                    height: 1000,
                } as DOMRect)
                .mockReturnValueOnce({
                    height: 700,
                } as DOMRect)
                .mockReturnValueOnce({
                    height: 1000,
                } as DOMRect);

            resizeCallback({
                wrapper,
                content,
                excludeId: 'exclude-id',
                setIsRendered,
            })([{ target: content }]);

            expect(setIsRendered).toHaveBeenCalledWith(true);
        });

        it('should set isRendered to false when wrapper height is less than or equal to max height', () => {
            getBoundingClientRectSpy
                .mockReturnValueOnce({
                    height: 100,
                } as DOMRect)
                .mockReturnValueOnce({
                    height: 300,
                } as DOMRect);

            resizeCallback({
                wrapper,
                content,
                excludeId: 'exclude-id',
                setIsRendered,
            })([{ target: content }]);

            expect(setIsRendered).toHaveBeenCalledWith(false);
        });

        it('should set target height to content height when isRendered is false', () => {
            getBoundingClientRectSpy
                .mockReturnValueOnce({
                    height: 320,
                } as DOMRect)
                .mockReturnValueOnce({
                    height: 200,
                } as DOMRect);

            content.dataset.expanded = '0';

            resizeCallback({
                wrapper,
                content,
                excludeId: 'exclude-id',
                setIsRendered,
            })([{ target: content }]);

            expect(content.style.height).toBe('200px');
        });

        it('should set target height to adjusted max height when isRendered is true', () => {
            getBoundingClientRectSpy
                .mockReturnValueOnce({
                    height: 320,
                } as DOMRect)
                .mockReturnValueOnce({
                    height: 400,
                } as DOMRect)
                .mockReturnValueOnce({
                    height: 300,
                } as DOMRect);

            resizeCallback({
                wrapper,
                content,
                excludeId: 'exclude-id',
                setIsRendered,
            })([{ target: content }]);

            expect(content.style.height).toBe('400px');
        });
    });

    describe('useReadMoreButton', () => {
        it('should return default data', () => {
            document.getElementById = jest.fn().mockReturnValue({ id: 'element' });

            const { result, unmount } = renderHook(() =>
                useReadMoreButton({
                    wrapperId: 'wrapper-id',
                    contentId: 'content-id',
                    excludeId: 'exclude-id',
                    defaultIsExpanded: true,
                }),
            );

            expect(result.current).toStrictEqual({
                isButtonRendered: false,
                isExpanded: true,
                onClick: expect.any(Function),
            });

            expect(observer.observe).toHaveBeenCalledWith({ id: 'element' });

            unmount();

            expect(observer.disconnect).toHaveBeenCalled();
        });

        it('should NOT call observer when no elements', () => {
            document.getElementById = jest.fn();

            const { unmount } = renderHook(() =>
                useReadMoreButton({
                    wrapperId: '',
                    contentId: '',
                    excludeId: '',
                    defaultIsExpanded: false,
                }),
            );

            expect(observer.observe).not.toHaveBeenCalled();

            unmount();

            expect(observer.disconnect).not.toHaveBeenCalled();
        });

        describe('onClick', () => {
            it('should expand content and set dataset to 1 when isExpanded is false', () => {
                const content = {
                    id: 'content-id',
                    dataset: {
                        expanded: '',
                    },
                    style: {
                        height: '',
                    },
                    scrollHeight: 500,
                };
                document.getElementById = jest.fn().mockReturnValue(content);

                const { result } = renderHook(() =>
                    useReadMoreButton({
                        wrapperId: 'wrapper-id',
                        contentId: 'content-id',
                        excludeId: '',
                        defaultIsExpanded: false,
                    }),
                );

                result.current.onClick();

                expect(content.dataset.expanded).toBe('1');
                expect(content.style.height).toBe('500px');
            });

            it('should collapse content and set dataset to 0 when isExpanded is true', () => {
                const setIsRendered = jest.fn();
                jest.spyOn(React, 'useState').mockReturnValue([true, setIsRendered]);

                getBoundingClientRectSpy.mockReturnValue({
                    height: 300,
                } as DOMRect);

                const el = document.createElement('div');
                document.getElementById = jest.fn().mockReturnValue(el);

                const { result } = renderHook(() =>
                    useReadMoreButton({
                        wrapperId: 'wrapper-id',
                        contentId: 'content-id',
                        excludeId: '',
                        defaultIsExpanded: false,
                    }),
                );

                result.current.onClick();

                expect(el.dataset.expanded).toBe('0');
                expect(el.style.height).toBe('220px');
            });
        });
    });
});
