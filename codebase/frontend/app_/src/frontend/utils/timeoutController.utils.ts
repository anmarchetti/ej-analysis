import { logger } from 'frontend/services/logging';

export const createTimeoutController = (timeout: number): AbortController => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);

    return controller;
};

export const callOperationWithTimeout = async <T>(
    operation: (signal?: AbortSignal) => Promise<T>,
    timeout: number,
    eventType: string,
    browserId?: string,
    friendlyId?: string,
): Promise<T | null> => {
    const controller = createTimeoutController(timeout);

    try {
        return await Promise.race([
            operation(controller.signal),
            new Promise<never>((_, reject) => {
                controller.signal.addEventListener('abort', () => {
                    if (typeof DOMException === 'undefined') {
                        const error = new Error('The operation was aborted.');
                        error.name = 'AbortError';
                        reject(error);
                    }

                    reject(new DOMException('The operation was aborted.', 'AbortError'));
                });
            }),
        ]);
    } catch (error) {
        if (error.name === 'AbortError') {
            logger.warn(
                `Sitecore Personalize API call timed out for event: ${eventType} with timeout: ${timeout}ms${
                    friendlyId ? ' and friendlyId: ' + friendlyId : ''
                }${browserId ? ' and browserId: ' + browserId : ''}`,
            );

            return null;
        }

        logger.error(error);
        throw error;
    }
};
