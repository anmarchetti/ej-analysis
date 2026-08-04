import React, { PureComponent } from 'react';

import { logger } from 'frontend/services/logging';
import { isValidURL } from 'frontend/utils/url.utils';

export interface I3DS1FrameProps {
    issuerUrl: string;
    md: string;
    onError: () => void;
    paReq: string;
    termUrl: string;
}

export class ThreeDS1Frame extends PureComponent<I3DS1FrameProps> {
    private form = React.createRef<HTMLFormElement>();

    private isValid = () => {
        const { issuerUrl, paReq, md, termUrl } = this.props;

        return !!(isValidURL(issuerUrl) && paReq && md && termUrl);
    };

    componentDidMount(): void {
        if (!this.isValid()) {
            this.props.onError();
        } else {
            logger.info(`3DS1 iframe rendered ${this.props.issuerUrl}`);
            this.form.current?.submit();
        }
    }

    componentDidCatch(error, errorInfo): void {
        logger.error({ e: { name: error, message: errorInfo ? JSON.stringify(errorInfo) : '' } });
        this.props.onError();
    }

    render(): React.ReactNode {
        return (
            <>
                <form
                    id='three-ds-one'
                    method='POST'
                    target='three-ds-one-frame'
                    action={this.props.issuerUrl}
                    ref={this.form}
                    data-tid='three-ds-one-form'
                >
                    <input type='hidden' name='PaReq' value={this.props.paReq} data-tid='pa-req-input' />
                    <input type='hidden' name='MD' value={this.props.md} data-tid='md-input' />
                    <input type='hidden' name='TermUrl' value={this.props.termUrl} data-tid='term-url-input' />
                </form>
                <iframe
                    style={{ width: '100%', height: '450px', border: 'none' }}
                    name='three-ds-one-frame'
                    id='three-ds-one-frame'
                    src='about:blank'
                    data-tid='three-ds-one-iframe'
                    allow='local-network-access *'
                />
            </>
        );
    }
}

export default ThreeDS1Frame;
