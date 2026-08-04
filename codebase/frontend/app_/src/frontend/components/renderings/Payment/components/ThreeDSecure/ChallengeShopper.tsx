import React, { PureComponent } from 'react';

import settings from 'code/settings';
import { logger } from 'frontend/services/logging';
import { encodeBase64URL } from 'frontend/utils/base64URL.utils';
import { isValidURL } from 'frontend/utils/url.utils';

export interface IChallengeShopperRequestData {
    acsTransID: string;
    challengeWindowSize: string;
    messageType: string;
    messageVersion: string;
    threeDSServerTransID: string;
}

export interface IChallengeShopperProps {
    acsTransID: string;
    acsURL: string;
    messageVersion: string;
    onError: () => void;
    threeDSServerTransID: string;
}

export class ChallengeShopper extends PureComponent<IChallengeShopperProps> {
    private form = React.createRef<HTMLFormElement>();

    get dataObj() {
        return {
            threeDSServerTransID: this.props.threeDSServerTransID,
            acsTransID: this.props.acsTransID,
            messageVersion: this.props.messageVersion,
            challengeWindowSize: settings.ThreeDSecure.challengeWindowSize,
            messageType: settings.ThreeDSecure.messageType,
        } as IChallengeShopperRequestData;
    }

    private isValid = () => {
        const { acsURL, threeDSServerTransID, acsTransID } = this.props;

        return !!(isValidURL(acsURL) && threeDSServerTransID && acsTransID);
    };

    componentDidMount() {
        if (!this.isValid()) {
            this.props.onError();
        } else {
            logger.info(`3DS ChallengeShopper iframe rendered, ${this.props.acsURL}`);
            this.form.current?.submit();
        }
    }

    componentDidCatch(error, errorInfo) {
        logger.error({ e: { name: error, message: errorInfo ? JSON.stringify(errorInfo) : '' } });
        this.props.onError();
    }

    render() {
        const creq = encodeBase64URL(this.dataObj);
        logger.info(`3DS Challenge threeDSMethodData: ${creq}`);

        return (
            <>
                <form
                    id='challenge-shopper'
                    method='POST'
                    target='challenge-shopper-frame'
                    action={this.props.acsURL}
                    ref={this.form}
                >
                    <input type='hidden' name='creq' value={creq} />
                </form>
                <iframe
                    style={{ width: '100%', minHeight: '620px', border: 'none', margin: '30px 0' }}
                    name='challenge-shopper-frame'
                    id='challenge-shopper-frame'
                    src='about:blank'
                    allow='local-network-access *'
                />
            </>
        );
    }
}

export default ChallengeShopper;
