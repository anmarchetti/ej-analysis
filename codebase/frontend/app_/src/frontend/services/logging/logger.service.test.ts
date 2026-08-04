import { envAll } from 'code/env';
import isBackend from 'frontend/utils/isBackend';

import { Logger } from './logger.service';

jest.mock('frontend/utils/isBackend');

const mockErrorLogger = jest.fn();
const mockWarnLogger = jest.fn();
const mockInfoLogger = jest.fn();

const mockWinston = {
    transports: {
        File: jest.fn(() => ({
            result: 'File transport',
        })),
        Console: jest.fn(() => ({
            result: 'Console transport',
        })),
        Http: jest.fn(() => ({
            result: 'Http transport',
        })),
    },
    createLogger: jest.fn().mockReturnValue({
        warn: mockWarnLogger,
        info: mockInfoLogger,
        error: mockErrorLogger,
    }),
    format: {
        printf: jest.fn().mockReturnValue('printf'),
    },
};
jest.mock('winston', () => mockWinston);

describe('Logger', () => {
    let logger: Logger;

    beforeEach(() => {
        logger = new Logger();
        jest.mocked(isBackend).mockReturnValue(false);
    });

    describe('loadWinston', () => {
        it('Create logger with File transport, when isBackend and ENABLE_WINSTON_FILE_LOGGING is true', async () => {
            jest.mocked(isBackend).mockReturnValue(true);
            envAll.ENABLE_WINSTON_FILE_LOGGING = true;

            await logger.warn('Message');

            expect(mockWinston.transports.File).toHaveBeenCalledWith({
                filename: 'logs/logs.txt',
                maxsize: 300000,
            });
            expect(mockWinston.transports.Console).toHaveBeenCalled();
            expect(mockWinston.format.printf).toHaveBeenCalledWith(expect.any(Function));
            expect(mockWinston.createLogger).toHaveBeenCalledWith({
                format: 'printf',
                transports: [{ result: 'File transport' }, { result: 'Console transport' }],
            });
        });

        it('DO NOT call createLogger with File logger when ENABLE_WINSTON_FILE_LOGGING is false', async () => {
            jest.mocked(isBackend).mockReturnValue(true);
            envAll.ENABLE_WINSTON_FILE_LOGGING = false;

            await logger.warn('Message');

            expect(mockWinston.transports.File).not.toHaveBeenCalled();
            expect(mockWinston.transports.Console).toHaveBeenCalled();
            expect(mockWinston.createLogger).toHaveBeenCalledWith({
                format: 'printf',
                transports: [{ result: 'Console transport' }],
            });
        });

        it('Format string message by printf callback', async () => {
            await logger.warn('Message');

            const printfCallback = mockWinston.format.printf.mock.calls[0][0];
            const info = {
                level: 'info',
                message: 'Test message',
            };

            const formattedMessage = printfCallback(info);
            expect(formattedMessage).toBe('[frontend] [info] Test message');
        });

        it('Format object message by printf callback', async () => {
            await logger.warn('Message');

            const printfCallback = mockWinston.format.printf.mock.calls[0][0];
            const info = {
                level: 'error',
                message: { key: 'value' },
            };

            const formattedMessage = printfCallback(info);
            expect(formattedMessage).toBe('[frontend] [error] {"key":"value"}');
        });
    });

    describe('error', () => {
        it('call inner error logger', async () => {
            const mockError = new Error('Error');
            await logger.error({
                e: mockError,
            });

            expect(mockErrorLogger).toHaveBeenCalled();
        });
    });

    describe('warn', () => {
        it('call inner warn logger', async () => {
            await logger.warn(['message_1', 'message_2']);

            expect(mockWarnLogger).toHaveBeenCalledWith('message_1,message_2');
        });
    });

    describe('info', () => {
        it('call inner info logger', async () => {
            await logger.info(['message_1', 'message_2']);

            expect(mockInfoLogger).toHaveBeenCalledWith('message_1,message_2');
        });
    });
});
