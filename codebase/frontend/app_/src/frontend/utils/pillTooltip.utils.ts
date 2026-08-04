import { CalloutPosition } from 'models/enum/Callout';

const MAX_PILL_OFFSET_RIGHT = 100;
const FLIGHT_GRID_MOBILE_SCREEN = 480;

export const changeTooltipPosition = (breakpoint: number, pillElement?: HTMLDivElement): [boolean, CalloutPosition] => {
    if (!pillElement?.parentElement?.offsetWidth || breakpoint <= FLIGHT_GRID_MOBILE_SCREEN) {
        return [true, CalloutPosition.IconLeft];
    }

    return [
        true,
        pillElement.parentElement?.offsetWidth - pillElement.offsetLeft < MAX_PILL_OFFSET_RIGHT
            ? CalloutPosition.Right
            : CalloutPosition.IconLeft,
    ];
};
