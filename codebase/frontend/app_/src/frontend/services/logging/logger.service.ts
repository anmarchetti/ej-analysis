import Axios from 'axios';

import { webApiUrls } from 'code/endpoints';
import { envAll } from 'code/env';
import isBackend from 'frontend/utils/isBackend';
import { isEmptyObject } from 'frontend/utils/object.utils';

export interface ILoggingError {
    e: Error;
    message?: string;
}

const LOG_FILE_PATH = 'logs/logs.txt';
const LOG_FILE_MAX_SIZE = 300000;

export class Logger {
    private winston;
    private logger;

    private async loadWinston(): Promise<void> {
        if (!this.winston) {
            this.winston = await import(/* webpackChunkName: "logger" */ 'winston');
            const transports: any[] = [];

            if (isBackend()) {
                if (envAll.ENABLE_WINSTON_FILE_LOGGING) {
                    transports.push(
                        new this.winston.transports.File({
                            filename: LOG_FILE_PATH,
                            maxsize: LOG_FILE_MAX_SIZE,
                        }),
                    );
                }

                transports.push(new this.winston.transports.Console());
            } else {
                let httpTransport: any;
                const location = globalThis.location ?? ({} as Location);

                if (
                    !isEmptyObject(location) &&
                    !webApiUrls.logging.post().startsWith('http') &&
                    webApiUrls.logging.post().startsWith('/')
                ) {
                    httpTransport = new this.winston.transports.Http({
                        host: location.hostname,
                        port: location.port,
                        path: webApiUrls.logging.post(),
                        ssl: true,
                    });
                } else {
                    const match = webApiUrls.logging
                        .post()
                        .match(
                            /^(http|https|ftp)?(?:[\:\/]*)([a-z0-9\.-]*)(?:\:([0-9]+))?(\/[^?#]*)?(?:\?([^#]*))?(?:#(.*))?$/i,
                        );

                    if (match) {
                        httpTransport = new this.winston.transports.Http({
                            host: match[2] || location.hostname,
                            port: +match[3] || location.port,
                            path: match[4] || webApiUrls.logging.post(),
                            ssl: true,
                        });
                    }
                }

                if (httpTransport) {
                    transports.push(httpTransport);
                }

                transports.push(
                    new this.winston.transports.Console({
                        level: 'error', // log only error messages to console
                    }),
                );
            }

            this.logger = this.winston.createLogger({
                format: this.winston.format.printf(info => {
                    if (typeof info.message === 'object') {
                        info.message = JSON.stringify(info.message);
                    }

                    return `[frontend] [${info.level}] ${info.message}`;
                }),
                transports,
            });
        }
    }

    async error(e: ILoggingError, correlationId?: string): Promise<void> {
        await this.loadWinston();

        if (isBackend()) {
            this.logger.error({
                msg: e.message,
                errorMsg: e.e.message,
                errorStack: e.e.stack,
                correlationId,
            });
        } else if (!Axios.isCancel(e.e)) {
            // check if error is not axios request cancelation
            // serialization of js error because error properties is not enumerable
            const body = JSON.stringify({
                ...e,
                correlationId,
                e: JSON.stringify(e.e, ['stack', 'message', 'arguments', 'type']),
            });
            this.logger.error(body);
        }
    }

    async warn(...messages: any[]): Promise<void> {
        await this.loadWinston();
        this.logger.warn(messages.join('\n'));
    }

    async info(...messages: any[]): Promise<void> {
        await this.loadWinston();
        this.logger.info(messages.join('\n'));
    }
}

const logger = new Logger();

export default logger;
