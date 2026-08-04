export const createDropdownState = (dropdowns, collapsedByDefaultKeys: string[]): Record<string, boolean> =>
    dropdowns?.reduce(
        (acc, child, i) => ({
            ...acc,
            [child?.key || i]: !collapsedByDefaultKeys?.includes(child?.key?.toString() || ''),
        }),
        {},
    ) || {};
