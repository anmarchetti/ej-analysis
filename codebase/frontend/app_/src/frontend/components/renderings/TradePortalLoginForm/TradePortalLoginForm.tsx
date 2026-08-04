import React, { FC, useEffect, useRef } from 'react';
import { Placeholder, RichText } from '@sitecore-jss/sitecore-jss-react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useSSOSession from 'frontend/hooks/useSSOSession';
import useStore from 'frontend/hooks/useStore';
import { isTradeStore, ITradePortalStores } from 'frontend/store/tradePortal';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { TradePortalSitePath } from 'models/enum/SitePath';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import MaintenanceContent from 'frontend/components/common/MaintenancePopup/components/MaintenanceContent/MaintenanceContent';
import Dialog from 'frontend/components/common/Popup/Dialog';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import ValidatablePasswordField from 'frontend/components/common/ValidatablePasswordField';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';

import TradePortalSSOLogin, { TTradePortalSSOLoginFields } from './components/TradePortalSSOLogin/TradePortalSSOLogin';

import styles from './TradePortalLoginForm.module.scss';

interface ITradePortalLoginParams {
    isCentered: boolean | undefined;
}

export interface ITradePortalLoginFields extends TTradePortalSSOLoginFields {
    AgentNumberPlaceholder: ISitecoreField<string>;
    BottomTipText: ISitecoreField<string>;
    ConsultantNamePlaceholder: ISitecoreField<string>;
    HeaderText: ISitecoreField<string>;
    LogInButtonText: ISitecoreField<string>;
    LogInErrorText: ISitecoreField<string>;
    OldLoginFlowEnabled: ISitecoreField<boolean>;
    PasswordPlaceholder: ISitecoreField<string>;
}

export type TTradePortalLoginFormProps = ISitecoreComponent<ITradePortalLoginFields, ITradePortalLoginParams>;

const TradePortalLoginForm: FC<TTradePortalLoginFormProps> = ({ fields, rendering, params: { isCentered } }) => {
    const {
        isLoggingIn,
        isLoginPage,
        isMaintenance,
        agentLogin,
        onLogin,
        setRedirectUrl,
        trackValidation,
        onLogout,
        clearQuery,
        needLogout,
    } = useStore((stores: ITradePortalStores) => ({
        isLoggingIn: stores.userStore.isLoggingIn,
        isLoginPage: isTradeStore(stores) && stores.layoutStore.isLoginPage,
        isMaintenance: stores.layoutStore.isMaintenance,
        agentLogin: stores.userStore.loginAgent,
        onLogin: stores.userStore.onLogin,
        onSSOLogin: stores.userStore.onSSOLogin,
        setRedirectUrl: stores.userStore.setRedirectUrl,
        trackValidation: stores.trackingStore.trackValidation,
        onLogout: stores.userStore.onLogout,
        clearQuery: stores.routerStore.clearQuery,
        needLogout: stores.queryParamStore.needLogout,
    }));

    useEffect(() => {
        if (needLogout()) {
            clearQuery();
            onLogout(true);
        }
    }, []);

    useSSOSession();

    const agentNumberRef = useRef<HTMLInputElement>(null);
    const passRef = useRef<HTMLInputElement>(null);
    const consultantNameRef = useRef<HTMLInputElement>(null);

    const errors = [...agentLogin.agentNumberErrors, ...agentLogin.consultantNameErrors, ...agentLogin.passwordErrors];

    const [showErrors, setShowErrors] = React.useState(false);

    if (!fields) {
        return null;
    }

    const onSubmitLogIn = (event: React.MouseEvent | React.FormEvent): void => {
        event.preventDefault();

        if (errors.length) {
            setShowErrors(true);
            errors.forEach(error => {
                trackValidation(error.propertyName, error.errorMessage);
            });

            return;
        }

        setRedirectUrl(TradePortalSitePath.Home);
        onLogin(true);
    };

    if (isMaintenance) {
        return (
            <div className={classNames(styles.dialogContainer, styles.maintenanceWrapper)}>
                <Dialog>
                    <MaintenanceContent />
                </Dialog>
            </div>
        );
    }

    const isOldLoginEnabled = fields.OldLoginFlowEnabled.value;

    return (
        <div className={classNames(styles.backgroundWrapper, isLoginPage && styles.isFullHeight)}>
            <Placeholder name={PlaceholderNames.Partnership} rendering={rendering} />
            <ComponentWrapper>
                <TradePortalSSOLogin
                    isCentered={isCentered}
                    SSOLogInBackgroundImage={fields.SSOLogInBackgroundImage}
                    SSOLogInButtonLabel={fields.SSOLogInButtonLabel}
                    SSOLogInSubtitle={fields.SSOLogInSubtitle}
                    SSOLogInTitle={fields.SSOLogInTitle}
                    SSOEnabled={fields.SSOEnabled}
                />
                {isOldLoginEnabled && (
                    <div className={classNames(styles.wrapper, isCentered && styles.isCentered)}>
                        <RichText tag='h2' className={styles.heading} field={fields.HeaderText} />
                        {fields.OldLoginFlowEnabled && agentLogin.firstError && (
                            <ErrorMessage
                                message={fields.LogInErrorText?.value}
                                errorMessageClass='error-message_trade error-container'
                                icon={
                                    <i className='error-message__icon'>
                                        <SvgWarningFilled />
                                    </i>
                                }
                            />
                        )}
                        <form className={styles.form} onSubmit={onSubmitLogIn} autoComplete='off'>
                            <ValidatableField
                                onChange={value => agentLogin.onChangeAgentNumber(value)}
                                id='agentNumber'
                                name='agentNumber'
                                label={fields.AgentNumberPlaceholder?.value}
                                value={agentLogin.agentNumber}
                                errors={agentLogin.agentNumberErrors}
                                autoComplete={false}
                                isVertical
                                inputRef={agentNumberRef}
                                shouldTrimOnBlur
                                forceError={showErrors}
                                notShowValidIcon
                                disableValidationTraking
                            />
                            <ValidatablePasswordField
                                onChange={value => agentLogin.onChangePassword(value)}
                                id='password'
                                name='password'
                                label={fields.PasswordPlaceholder?.value}
                                value={agentLogin.password}
                                errors={agentLogin.passwordErrors}
                                autoComplete={false}
                                isVertical
                                inputRef={passRef}
                                forceError={showErrors}
                                disableValidationTraking
                            />
                            <ValidatableField
                                onChange={value => agentLogin.onChangeConsultantName(value)}
                                id='consultantName'
                                name='consultantName'
                                label={fields.ConsultantNamePlaceholder?.value}
                                value={agentLogin.consultantName}
                                errors={agentLogin.consultantNameErrors}
                                autoComplete={false}
                                isVertical
                                inputRef={consultantNameRef}
                                shouldTrimOnBlur
                                forceError={showErrors}
                                notShowValidIcon
                                disableValidationTraking
                            />
                            <Button
                                disabled={isLoggingIn}
                                onClick={onSubmitLogIn}
                                dataTid='sign-in-button'
                                type='submit'
                                className={styles.submit}
                            >
                                {fields.LogInButtonText?.value}
                            </Button>
                        </form>
                        <RichText tag='p' className={styles.bottomInfo} field={fields.BottomTipText} />
                    </div>
                )}
            </ComponentWrapper>
        </div>
    );
};

export default observer(TradePortalLoginForm);
