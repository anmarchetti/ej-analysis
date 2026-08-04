import * as React from 'react';
import { inject } from 'mobx-react';

import { IHolidaysStores } from 'frontend/store/holidays';
import { ShortlistStore } from 'frontend/store/holidays/shortlist/ShortlistStore';
import { LoginCustomer } from 'models/data/LoginCustomer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import LoginPopup from 'frontend/components/common/LoginPopup/LoginPopup';

export interface ILoginToShortlistPopupProps extends IComponentWithDictionary {
    customerLogin: LoginCustomer;
    isFullMaintenance: boolean;
    isRedirectToShortlistPage: boolean;
    isShowLoginPopup: boolean;
    redirectToShortlistNoResultsPage: () => void;
    redirectToShortlistPage: () => void;
    savedOffersCount: ShortlistStore['savedOffersCount'];
    setIsRedirectPreventedAfterLogin: (value: boolean) => void;
    setRedirectToShortlistPage: (state: boolean) => void;
    toggleShowLoginPopup: (state: boolean) => void;
    updateCandidateInShortlist: () => void;
}

export class LoginToShortlistPopup extends React.Component<ILoginToShortlistPopupProps> {
    componentDidMount() {
        if (this.props.isFullMaintenance) {
            return;
        }

        if (this.props.isShowLoginPopup) {
            this.props.setIsRedirectPreventedAfterLogin(true);
        }
    }

    componentDidUpdate(prevProps: ILoginToShortlistPopupProps) {
        if (this.props.isFullMaintenance) {
            return;
        }

        if (!prevProps.isShowLoginPopup && this.props.isShowLoginPopup) {
            this.props.setIsRedirectPreventedAfterLogin(true);
        }
    }

    private afterLoginAction = () => {
        if (this.props.isRedirectToShortlistPage) {
            if (this.props.customerLogin.errors.length) {
                return;
            }

            this.props.toggleShowLoginPopup(false);
            this.props.savedOffersCount === 0
                ? this.props.redirectToShortlistNoResultsPage()
                : this.props.redirectToShortlistPage();
            this.props.setRedirectToShortlistPage(false);
        } else {
            this.props.toggleShowLoginPopup(false);
            this.props.updateCandidateInShortlist();
        }
    };

    private onClose = () => {
        this.props.toggleShowLoginPopup(false);
        this.props.isRedirectToShortlistPage && this.props.setRedirectToShortlistPage(false);
    };

    render() {
        const { getPhrase } = this.props;

        if (this.props.isFullMaintenance || !this.props.isShowLoginPopup) {
            return null;
        }

        return (
            <LoginPopup
                title={getPhrase(
                    this.props.isRedirectToShortlistPage
                        ? SitecoreDictionary.ShortlistLoginPopupRedirectTitle
                        : SitecoreDictionary.ShortlistLoginPopupTitle,
                )}
                description={getPhrase(
                    this.props.isRedirectToShortlistPage
                        ? SitecoreDictionary.ShortlistLoginPopupRedirectDescription
                        : SitecoreDictionary.ShortlistLoginPopupDescription,
                )}
                onClose={this.onClose}
                isHideRememberMe
                afterLoginAction={this.afterLoginAction}
                isLoginToAddShortlist
                isCreateAccountSectionShown
                onCreateAccountClick={() => this.props.toggleShowLoginPopup(false)}
            />
        );
    }
}

export default inject((stores: IHolidaysStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    toggleShowLoginPopup: stores.shortlistStore.toggleShowLoginPopup,
    updateCandidateInShortlist: stores.shortlistStore.updateCandidateInShortlist,
    customerLogin: stores.userStore.customerLogin,
    isRedirectToShortlistPage: stores.shortlistStore.isRedirectToShortlistPage,
    redirectToShortlistPage: stores.routerStore.redirectToShortlistPage,
    redirectToShortlistNoResultsPage: stores.routerStore.redirectToShortlistNoResultsPage,
    savedOffersCount: stores.shortlistStore.savedOffersCount,
    setRedirectToShortlistPage: stores.shortlistStore.setRedirectToShortlistPage,
    isShowLoginPopup: stores.shortlistStore.isShowLoginPopup,
    setIsRedirectPreventedAfterLogin: stores.userStore.setIsRedirectPreventedAfterLogin,
    isFullMaintenance: stores.layoutStore.isFullMaintenance,
}))(LoginToShortlistPopup);
