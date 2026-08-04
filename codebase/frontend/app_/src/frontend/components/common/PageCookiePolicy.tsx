import * as React from 'react';
import { inject } from 'mobx-react';
import sanitize from 'sanitize-html';

import { TWO } from 'code/commonNumbers';
import settings from 'code/settings';
import { TStores } from 'frontend/store/IStores';
import { getCookie, setCookie } from 'frontend/utils/cookies.utils';
import { CookiesKeys } from 'models/enum/CookiesKeys';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';

import Button from './Button';

interface ICookiePolicyProps extends IComponentWithDictionary {
    getSetting: (setting: SiteSettings) => string;
}

interface ICookiePolicyState {
    isShown: boolean;
}

export class PageCookiePolicy extends React.Component<ICookiePolicyProps, ICookiePolicyState> {
    state = {
        isShown: false,
    };

    componentDidMount(): void {
        if (!getCookie(CookiesKeys.CookiePolicy)) {
            this.setState({ isShown: true });
        }
    }

    acceptPolicy(): void {
        // Set cookie with expiration date 2 years after now
        const date = new Date();
        date.setFullYear(date.getFullYear() + TWO);

        setCookie(CookiesKeys.CookiePolicy, '1', date);
        this.setState({ isShown: false });
    }

    render(): React.ReactNode {
        if (!this.state.isShown || !this.props.getSetting(SiteSettings.CookiePolicyText)) {
            return null;
        }

        return (
            <div className='cookie-policy' data-tid='cookie-policy-wrapper'>
                <div className='wrapper-container wrapper-container--px'>
                    <div className='row flex-nowrap mx-xl-n4 m-1'>
                        <div className='col'>
                            <div className='cookie-policy__wrapper row flex-sm-nowrap px-xl-4'>
                                <div
                                    className='cookie-policy__content col-12 col-sm-9 col-md-10 py-3'
                                    dangerouslySetInnerHTML={{
                                        __html: sanitize(this.props.getSetting(SiteSettings.CookiePolicyText), {
                                            allowedTags: settings.Default.allowedTags,
                                            allowedAttributes: settings.Default.allowedAttributes,
                                            allowVulnerableTags: true,
                                        }),
                                    }}
                                />

                                <div className='cookie-policy__button offset-1 offset-sm-0 col-10 col-sm-3 col-md-2 align-items-center pb-3 pb-sm-0 d-flex justify-content-center'>
                                    <Button
                                        type='button'
                                        id='acceptCookiePolicy'
                                        className='flex-grow-1'
                                        onClick={(): void => this.acceptPolicy()}
                                    >
                                        {this.props.getPhrase(SitecoreDictionary.CookiePolicyLabelsAccept)}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const ConnectedPageCookiePolicy = inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    getSetting: stores.layoutStore.getSetting,
}))(PageCookiePolicy);

export default ConnectedPageCookiePolicy;
