import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { ScreenBreakpoints } from 'code/screenBreakpoints';
import useStore from 'frontend/hooks/useStore';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { TradePortalSitePath } from 'models/enum/SitePath';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import styles from 'frontend/components/renderings/TradePortalLoginForm/TradePortalLoginForm.module.scss';

export type TTradePortalSSOLoginFields = {
    SSOEnabled: ISitecoreField<boolean>;
    SSOLogInBackgroundImage: ISitecoreField<ISitecoreImage>;
    SSOLogInButtonLabel: ISitecoreField<string>;
    SSOLogInSubtitle: ISitecoreField<string>;
    SSOLogInTitle: ISitecoreField<string>;
};

export type TTradePortalSSOLoginProps = TTradePortalSSOLoginFields & {
    isCentered: boolean | undefined;
};

const TradePortalSSOLogin: FC<TTradePortalSSOLoginProps> = ({
    SSOEnabled,
    SSOLogInBackgroundImage,
    SSOLogInButtonLabel,
    SSOLogInSubtitle,
    SSOLogInTitle,
    isCentered,
}) => {
    const { isLoggingIn, onSSOLogin, setRedirectUrl, sitePath } = useStore((stores: ITradePortalStores) => ({
        isLoggingIn: stores.userStore.isLoggingIn,
        onSSOLogin: stores.userStore.onSSOLogin,
        setRedirectUrl: stores.userStore.setRedirectUrl,
        sitePath: stores.layoutStore.sitePath,
    }));

    if (!SSOEnabled.value) {
        return null;
    }

    const onSSOLoginClick = (event?: React.MouseEvent | React.FormEvent): void => {
        event?.preventDefault();
        setRedirectUrl(TradePortalSitePath.Home);
        onSSOLogin(`${sitePath}${TradePortalSitePath.Login}`);
    };

    return (
        <div
            className={classNames(styles.ssoLogin, styles.wrapper, {
                [styles.isCentered]: isCentered,
            })}
            data-tid='sso-login'
        >
            <div className={styles.ssoLoginBackground}>
                <JSSImageNext
                    field={SSOLogInBackgroundImage}
                    fill
                    sizes={`(max-width: ${ScreenBreakpoints.SM}px) 100vw`}
                />
            </div>
            <Text tag='h2' field={SSOLogInTitle} className={styles.ssoLoginTitle} />
            <RichTextWithLinks field={SSOLogInSubtitle} className={styles.ssoLoginSubtitle} />
            <Button
                isReversed
                onClick={onSSOLoginClick}
                disabled={isLoggingIn}
                dataTid='sso-sign-in-button'
                className={styles.ssoLoginButton}
            >
                {SSOLogInButtonLabel.value}
            </Button>
        </div>
    );
};

export default observer(TradePortalSSOLogin);
