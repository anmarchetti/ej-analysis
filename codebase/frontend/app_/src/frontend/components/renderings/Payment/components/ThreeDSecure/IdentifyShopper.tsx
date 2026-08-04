import React, { PureComponent } from 'react';

import { envPublic } from 'code/env';
import { logger } from 'frontend/services/logging';
import { encodeBase64URL } from 'frontend/utils/base64URL.utils';
import { isValidURL } from 'frontend/utils/url.utils';

export interface IIdentifyShopperRequestDate {
    threeDSMethodNotificationURL: string;
    threeDSServerTransID: string;
}

export interface IIdentifyShopperProps {
    methodNotificationURL: string;
    onError: () => void;
    onTimeoutError: () => void;
    threeDSMethodURL: string;
    threeDSServerTransID: string;
}

/**
 * 3DS2 Fingerprint step iframe component
 */
export class IdentifyShopper extends PureComponent<IIdentifyShopperProps> {
    private form = React.createRef<HTMLFormElement>();
    private expirationTimeout;

    get dataObj() {
        return {
            threeDSServerTransID: this.props.threeDSServerTransID,
            threeDSMethodNotificationURL: this.props.methodNotificationURL,
        } as IIdentifyShopperRequestDate;
    }

    private isValid = () => {
        const { threeDSMethodURL, threeDSServerTransID, methodNotificationURL } = this.props;

        return !!(isValidURL(threeDSMethodURL) && threeDSServerTransID && methodNotificationURL);
    };

    private emulateError = () => {
        // TODO Temporary code to emulate error. Should be deleted before go live
        let error = false;
        try {
            const prbEl = document.getElementById('fullName');
            const pEl = document.querySelector('[data-tid=billing-address]');
            const fullName = prbEl ? prbEl['value'] : pEl ? pEl['innerText'] : '';
            error = fullName.toLowerCase().indexOf('fingerprinttechnicalerror') >= 0;
        } catch (e) {}

        return error || window['FingerprintTechnicalError'];
    };

    componentDidMount() {
        this.expirationTimeout = setTimeout(() => {
            this.props.onTimeoutError();
        }, envPublic.THREEDS2_FINGERPRINT_TIMEOUT_MLS);

        if (this.emulateError()) {
            this.props.onError();

            return;
        }

        if (!this.isValid()) {
            this.props.onError();
        } else {
            logger.info(`3DS IdentifyShopper iframe rendered ${this.props.threeDSMethodURL}`);
            this.form.current?.submit();
        }
    }

    componentWillUnmount() {
        clearTimeout(this.expirationTimeout);
    }

    componentDidCatch(error, errorInfo) {
        logger.error({ e: { name: error, message: errorInfo ? JSON.stringify(errorInfo) : '' } });

        clearTimeout(this.expirationTimeout);
        this.props.onError();
    }

    render() {
        const threeDSMethodData = encodeBase64URL(this.dataObj);
        logger.info(`3DS Identify threeDSMethodData: ${threeDSMethodData}`);

        return (
            <>
                <form
                    id='identify-shopper'
                    method='POST'
                    target='identify-shopper-frame'
                    action={this.props.threeDSMethodURL}
                    ref={this.form}
                >
                    <input type='hidden' name='threeDSMethodData' value={threeDSMethodData} />
                </form>
                <iframe
                    style={{ width: '100%', height: '0px', border: 'none' }}
                    name='identify-shopper-frame'
                    id='identify-shopper-frame'
                    src='about:blank'
                    allow='local-network-access *'
                />
            </>
        );
    }
}

export default IdentifyShopper;
