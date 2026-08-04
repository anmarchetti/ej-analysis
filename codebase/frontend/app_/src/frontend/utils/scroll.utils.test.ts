import { scrollIntoViewHorizontal, waitForFrames } from './scroll.utils';

describe('scroll.utils', () => {
    describe('scrollIntoViewHorizontal', () => {
        it('should call scrollIntoView with default config when element exists', () => {
            const mockElement = {
                scrollIntoView: jest.fn(),
            } as unknown as HTMLElement;

            scrollIntoViewHorizontal(mockElement);

            expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest',
            });
        });

        it('should call scrollIntoView with custom config when provided', () => {
            const mockElement = {
                scrollIntoView: jest.fn(),
            } as unknown as HTMLElement;

            const customConfig: ScrollIntoViewOptions = {
                behavior: 'auto',
                block: 'center',
                inline: 'start',
            };

            scrollIntoViewHorizontal(mockElement, customConfig);

            expect(mockElement.scrollIntoView).toHaveBeenCalledWith(customConfig);
        });

        it('should do nothing when element is null', () => {
            expect(() => scrollIntoViewHorizontal(null)).not.toThrow();
        });
    });

    describe('waitForFrames', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should resolve after default 3 frames', async () => {
            const promise = waitForFrames();
            let resolved = false;

            promise.then(() => {
                resolved = true;
            });

            expect(resolved).toBe(false);

            await jest.runOnlyPendingTimersAsync();
            expect(resolved).toBe(false);

            await jest.runOnlyPendingTimersAsync();
            expect(resolved).toBe(false);

            await jest.runOnlyPendingTimersAsync();
            expect(resolved).toBe(true);
        });

        it('should resolve after specified number of frames', async () => {
            const promise = waitForFrames(5);
            let resolved = false;

            promise.then(() => {
                resolved = true;
            });

            await jest.runOnlyPendingTimersAsync();
            await jest.runOnlyPendingTimersAsync();
            await jest.runOnlyPendingTimersAsync();
            await jest.runOnlyPendingTimersAsync();

            expect(resolved).toBe(false);

            await jest.runOnlyPendingTimersAsync();
            expect(resolved).toBe(true);
        });

        it('should resolve after 1 frame when frames=1', async () => {
            const promise = waitForFrames(1);
            let resolved = false;

            promise.then(() => {
                resolved = true;
            });

            expect(resolved).toBe(false);

            await jest.runOnlyPendingTimersAsync();
            expect(resolved).toBe(true);
        });

        it('should resolve immediately when frames=0', async () => {
            const promise = waitForFrames(0);
            let resolved = false;

            promise.then(() => {
                resolved = true;
            });

            await Promise.resolve();
            expect(resolved).toBe(true);
        });

        it('should resolve immediately when frames is negative', async () => {
            const promise = waitForFrames(-1);
            let resolved = false;

            promise.then(() => {
                resolved = true;
            });

            await Promise.resolve();
            expect(resolved).toBe(true);
        });

        it('should call requestAnimationFrame correct number of times', async () => {
            const rafSpy = jest.spyOn(window, 'requestAnimationFrame');

            const promise = waitForFrames(3);

            await jest.runOnlyPendingTimersAsync();
            await jest.runOnlyPendingTimersAsync();
            await jest.runOnlyPendingTimersAsync();

            await promise;

            expect(rafSpy).toHaveBeenCalledTimes(3);

            rafSpy.mockRestore();
        });

        it('should allow chaining multiple waitForFrames calls', async () => {
            let step = 0;

            const test = async () => {
                step = 1;
                await waitForFrames(1);
                step = 2;
                await waitForFrames(1);
                step = 3;
            };

            const promise = test();

            expect(step).toBe(1);

            await jest.runOnlyPendingTimersAsync();
            expect(step).toBe(2);

            await jest.runOnlyPendingTimersAsync();
            expect(step).toBe(3);

            await promise;
        });
    });
});
