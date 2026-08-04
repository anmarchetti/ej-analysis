const DEFAULT_FRAME_NUMBER = 3;

export const scrollIntoViewHorizontal = (element: HTMLElement | null, config?: ScrollIntoViewOptions): void => {
    element?.scrollIntoView(
        config || {
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
        },
    );
};

/**
 * Waits for multiple animation frames to allow DOM to fully render before scrolling
 *
 * @param frames - Number of frames to wait (default: 3 for lazy-loaded content)
 * @returns Promise that resolves after the specified number of animation frames
 *
 */
export const waitForFrames = (frames: number = DEFAULT_FRAME_NUMBER): Promise<void> =>
    new Promise<void>(resolve => {
        const tick = (remaining: number): void => {
            if (remaining <= 0) {
                resolve();
            } else {
                requestAnimationFrame(() => tick(remaining - 1));
            }
        };
        tick(frames);
    });
