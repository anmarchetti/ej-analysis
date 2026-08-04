import { logger } from 'frontend/services/logging';
import { DataStatus } from 'models/enum/DataStatus';

import ReCaptchaStore from './ReCaptchaStore';

jest.mock('frontend/services/logging/logger.service');

const createStores = () => ({
    layoutStore: { getSetting: jest.fn() },
});

const grecaptchaExecuteMock = jest.fn();
Object.defineProperties(window, {
    grecaptcha: {
        value: {
            execute: grecaptchaExecuteMock,
        },
    },
});

describe('ReCaptchaStore', () => {
    let rootStore: any = {};
    jest.spyOn(document.body, 'appendChild');
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => ({} as any));

    beforeEach(() => {
        rootStore = createStores();
    });

    describe('loadReCaptcha()', () => {
        it('Should load script if recaptcha enabled', () => {
            rootStore.layoutStore.getSetting.mockReturnValueOnce('1');
            const store = new ReCaptchaStore(rootStore);

            store.loadReCaptcha(false);
            expect(document.body.appendChild).toBeCalledWith(expect.any(HTMLScriptElement));
            expect(store.status).toBe(DataStatus.Loading);
        });

        it('Should NOT load script if recaptcha disaled', () => {
            const store = new ReCaptchaStore(rootStore);

            store.loadReCaptcha(false);
            expect(document.body.appendChild).not.toBeCalled();
            expect(store.status).toBe(DataStatus.NotLoaded);
        });
    });

    describe('removeReCaptcha()', () => {
        it('Should remove script and badge if they exist', () => {
            const store = new ReCaptchaStore(rootStore);

            jest.spyOn(document, 'querySelectorAll').mockImplementationOnce(() => [{}] as any);
            jest.spyOn(document, 'querySelector').mockImplementationOnce(() => ({ parentNode: {} } as any));

            store.removeReCaptcha();
            expect(document.body.removeChild).toHaveBeenCalledTimes(2);
        });

        it('Should NOT remove script and badge if they do NOT exist', () => {
            const store = new ReCaptchaStore(rootStore);

            jest.spyOn(document, 'querySelectorAll').mockImplementation(() => [] as any);
            jest.spyOn(document, 'querySelector').mockImplementation(() => null as any);

            store.removeReCaptcha();
            expect(document.body.removeChild).toHaveBeenCalledTimes(0);
        });
    });

    describe('executeReCaptcha()', () => {
        it('Should NOT execute if status is Not Loaded', async () => {
            const store = new ReCaptchaStore(rootStore);
            store.status = DataStatus.NotLoaded;
            await store.executeReCaptcha('test' as any);

            expect(grecaptchaExecuteMock).not.toBeCalled();
        });

        it('Should NOT execute if status is Error', async () => {
            const store = new ReCaptchaStore(rootStore);
            store.status = DataStatus.Error;
            await store.executeReCaptcha('test' as any);

            expect(grecaptchaExecuteMock).not.toBeCalled();
        });

        it('Should execute if status is Loaded', async () => {
            grecaptchaExecuteMock.mockResolvedValueOnce('token');
            const store = new ReCaptchaStore(rootStore);
            store.status = DataStatus.Loaded;
            const token = await store.executeReCaptcha('test' as any);

            expect(grecaptchaExecuteMock).toBeCalledWith(undefined, { action: 'test' });
            expect(token).toBe('token');
        });

        it('Should execute captha with error', async () => {
            grecaptchaExecuteMock.mockRejectedValue('error');
            const store = new ReCaptchaStore(rootStore);
            store.status = DataStatus.Loaded;
            await store.executeReCaptcha('test' as any);

            expect(logger.error).toHaveBeenCalledWith({
                e: 'error',
                message: 'Failed to execute reCAPTCHA',
            });
        });
    });
});
