import { KeyboardKey } from 'models/enum/KeyboardKey';

import { switchTabOnArrowPress } from './a11y.utils';

describe('a11y.utils', () => {
    describe('switchTabOnArrowPress()', () => {
        const tabsLength = 4;

        describe('horizontal tabs', () => {
            it('should switch to the next tab on Right Arrow', () => {
                const currentTabIdx = 2;
                const res = switchTabOnArrowPress(
                    { key: KeyboardKey.ArrowRight } as React.KeyboardEvent,
                    currentTabIdx,
                    tabsLength,
                );
                expect(res).toBe(3);
            });

            it('should switch to the first tab on Right Arrow and current tab is the last', () => {
                const currentTabIdx = 3;
                const res = switchTabOnArrowPress(
                    { key: KeyboardKey.ArrowRight } as React.KeyboardEvent,
                    currentTabIdx,
                    tabsLength,
                );
                expect(res).toBe(0);
            });

            it('should switch to the prev tab on Left Arrow', () => {
                const currentTabIdx = 2;
                const res = switchTabOnArrowPress(
                    { key: KeyboardKey.ArrowLeft } as React.KeyboardEvent,
                    currentTabIdx,
                    tabsLength,
                );
                expect(res).toBe(1);
            });

            it('should switch to the last tab on Left Arrow and current tab is the first', () => {
                const currentTabIdx = 0;
                const res = switchTabOnArrowPress(
                    { key: KeyboardKey.ArrowLeft } as React.KeyboardEvent,
                    currentTabIdx,
                    tabsLength,
                );
                expect(res).toBe(3);
            });

            it('should return undefined on any other key', () => {
                const currentTabIdx = 2;
                const res = switchTabOnArrowPress(
                    { key: KeyboardKey.ArrowUp } as React.KeyboardEvent,
                    currentTabIdx,
                    tabsLength,
                );
                expect(res).toBeUndefined();
            });
        });

        describe('vertical tabs', () => {
            const isVerticalTabList = true;

            it('should switch to the next tab on Down Arrow', () => {
                const currentTabIdx = 2;
                const res = switchTabOnArrowPress(
                    { key: KeyboardKey.ArrowDown } as React.KeyboardEvent,
                    currentTabIdx,
                    tabsLength,
                    isVerticalTabList,
                );
                expect(res).toBe(3);
            });

            it('should switch to the first tab on Down Arrow and current tab is the last', () => {
                const currentTabIdx = 3;
                const res = switchTabOnArrowPress(
                    { key: KeyboardKey.ArrowDown } as React.KeyboardEvent,
                    currentTabIdx,
                    tabsLength,
                    isVerticalTabList,
                );
                expect(res).toBe(0);
            });

            it('should switch to the prev tab on Up Arrow', () => {
                const currentTabIdx = 2;
                const res = switchTabOnArrowPress(
                    { key: KeyboardKey.ArrowUp } as React.KeyboardEvent,
                    currentTabIdx,
                    tabsLength,
                    isVerticalTabList,
                );
                expect(res).toBe(1);
            });

            it('should switch to the last tab on Up Arrow and current tab is the first', () => {
                const currentTabIdx = 0;
                const res = switchTabOnArrowPress(
                    { key: KeyboardKey.ArrowUp } as React.KeyboardEvent,
                    currentTabIdx,
                    tabsLength,
                    isVerticalTabList,
                );
                expect(res).toBe(3);
            });

            it('should return undefined on any other key', () => {
                const currentTabIdx = 2;
                const res = switchTabOnArrowPress(
                    { key: KeyboardKey.ArrowLeft } as React.KeyboardEvent,
                    currentTabIdx,
                    tabsLength,
                    isVerticalTabList,
                );
                expect(res).toBeUndefined();
            });
        });
    });
});
