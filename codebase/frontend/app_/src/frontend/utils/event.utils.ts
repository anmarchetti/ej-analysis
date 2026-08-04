import isBackend from './isBackend';
import { isMobile } from './isMobile';

/**
 * Execute function if "Enter" or "Space" was pressed.
 * @param event fire event
 * @param func function to execute
 */
export function handleEnterAndSpacePress(event: { charCode: number }, func: () => void): void {
    if (event.charCode === 13 || event.charCode === 32) {
        func?.();
    }
}

/**
 * Focus next html element
 * @param event key press event
 * @param selector target selector
 */
export function focusNextElementOnEnter(
    event: { key: string; keyCode: number; preventDefault: () => void; target: any },
    selector: string,
): void {
    if ((event?.keyCode == 13 || event?.key == 'Enter') && !isBackend() && isMobile(navigator.userAgent)) {
        event.preventDefault();
        const allInputs = Array.prototype.slice.call(document.querySelectorAll(selector));
        const currentElementIndex = allInputs.indexOf(event.target);
        allInputs[currentElementIndex + 1]?.focus();
    }
}
