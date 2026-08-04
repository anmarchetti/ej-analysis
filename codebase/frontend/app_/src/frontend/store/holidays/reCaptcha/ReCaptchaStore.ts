import { action, computed, makeObservable, observable, when } from 'mobx';

import { envPublic } from 'code/env';
import { logger } from 'frontend/services/logging';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { DataStatus } from 'models/enum/DataStatus';
import { ReCaptchaAction } from 'models/enum/ReCaptchaAction';
import SiteSettings from 'models/enum/SiteSettings';

const SCRIPT_SRC = `https://www.recaptcha.net/recaptcha/api.js?render=${envPublic.GOOGLE_RECAPTCHA_SITE_KEY}`;

class ReCaptchaStore {
    status: DataStatus = DataStatus.NotLoaded;

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this, {
            status: observable,
            isRecapchaEnabled: computed,
        });
    }

    get isRecapchaEnabled() {
        return !!this.rootStore.layoutStore.getSetting(SiteSettings.IsReCaptchaEnabled);
    }

    handleScriptLoad = action(() => {
        grecaptcha.ready(() => {
            /** Change status only if previos one was "Loading" */
            if (this.status === DataStatus.Loading) {
                this.status = DataStatus.Loaded;
            } else {
                /** If removeReCaptcha() was called right away after laodReCaptcha(), ready event can be fired after remove.
                 * In this case captcha badge will be visible, so need to call removeReCaptcha() again. */
                this.removeReCaptcha();
            }
        });
    });

    handleScriptError = action(() => {
        this.status = DataStatus.Error;
    });

    loadReCaptcha = action((overrideDefault: boolean) => {
        // If override default or global recapcha enabled then set recaptcha to enabled
        const isRecapchaEnabled = this.isRecapchaEnabled || overrideDefault;

        if (!isRecapchaEnabled || document.querySelectorAll(`script[src="${SCRIPT_SRC}"]`).length > 0) {
            return false;
        }

        this.status = DataStatus.Loading;

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = SCRIPT_SRC;

        script.async = true;
        script.defer = true;

        script.addEventListener('load', this.handleScriptLoad);
        script.addEventListener('error', this.handleScriptError);

        document.body.appendChild(script);

        return true;
    });

    removeReCaptcha = action(() => {
        this.status = DataStatus.NotLoaded;

        // Remove script
        const script = document.querySelectorAll(`script[src="${SCRIPT_SRC}"]`);

        if (script.length > 0) {
            document.body.removeChild(script[0]);
        }

        // Remove badge (shown at the bottom right corner of the page)
        const nodeBadge = document.querySelector('.grecaptcha-badge');

        if (nodeBadge?.parentNode) {
            document.body.removeChild(nodeBadge.parentNode);
        }
    });

    executeReCaptcha = async (action: ReCaptchaAction) => {
        try {
            if (this.status === DataStatus.Error || this.status === DataStatus.NotLoaded) {
                return;
            }

            if (this.status === DataStatus.Loading) {
                await when(() => this.status !== DataStatus.Loading);
            }

            const token = await grecaptcha.execute(envPublic.GOOGLE_RECAPTCHA_SITE_KEY, {
                action: action,
            });

            return token;
        } catch (e) {
            logger.error({
                e,
                message: 'Failed to execute reCAPTCHA',
            });

            return;
        }
    };

    toggleReCaptchaBadge = (isShown: boolean) => {
        const nodeBadge = <HTMLElement>document.querySelector('.grecaptcha-badge');

        if (nodeBadge) {
            nodeBadge.style.display = isShown ? 'block' : 'none';
        }
    };
}

export default ReCaptchaStore;
