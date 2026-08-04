import { KeyboardKey } from 'models/enum/KeyboardKey';

/**
 * Get new active tab index on arrow press.
 * ArrowLeft (ArrowUp) moves focus to the previous tab, ArrowRight (ArrowDown) to the next tab.
 * ArrowUp / ArrowDown performs only if tab list is vertically oriented.
 */
export const switchTabOnArrowPress = (
    event: React.KeyboardEvent,
    activeTabIndex: number,
    tabsLength: number,
    isVerticalTabList: boolean = false,
): number | undefined => {
    const prevKey = isVerticalTabList ? KeyboardKey.ArrowUp : KeyboardKey.ArrowLeft;
    const nextKey = isVerticalTabList ? KeyboardKey.ArrowDown : KeyboardKey.ArrowRight;

    if (event.key === prevKey) {
        // Move to the prev tab. If active tab is first, move to the last tab.
        return activeTabIndex === 0 ? tabsLength - 1 : activeTabIndex - 1;
    }

    if (event.key === nextKey) {
        // Move to the next tab. If active tab is last, move to the first tab.
        return activeTabIndex === tabsLength - 1 ? 0 : activeTabIndex + 1;
    }

    return undefined;
};
