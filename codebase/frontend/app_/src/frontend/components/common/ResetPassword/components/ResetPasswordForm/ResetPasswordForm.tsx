import React, { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { getCMSLang } from 'code/cmsLang';
import { envAll } from 'code/env';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { LoginCustomer } from 'models/data/LoginCustomer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableFieldNew';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';

import styles from './ResetPasswordForm.module.scss';

export enum ResetPasswordPhase {
    ProvideEmail = 'ProvideEmail',
    PasswordReset = 'PasswordReset',
}

enum ResetPasswordVariant {
    HolidayInFunnel = 'holiday-in-funnel',
    HolidayOutFunnel = 'holiday-out-funnel',
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        interface IntrinsicElements {
            'forgotten-password': {
                'api-url': string;
                lang: string;
                variant: ResetPasswordVariant;
                email?: string;
                env?: number;
            };
        }
    }
}

export interface IResetPasswordFormProps {
    customerLogin: LoginCustomer;
    isCIAMEnabled: boolean;
}

export const ResetPasswordForm: FC<IResetPasswordFormProps> = ({ isCIAMEnabled, customerLogin }) => {
    const { email, emailErrors, firstError, cleanUpErrors, onChangeEmail } = customerLogin;
    const { getPhrase, lang, isGuestDetailsPage } = useStore(({ layoutStore }: IHolidaysStores) => ({
        getPhrase: layoutStore.getPhrase,
        lang: layoutStore.lang,
        isGuestDetailsPage: layoutStore.isGuestDetailsPage,
    }));

    const onChangeEmailField = (value: string): void => {
        onChangeEmail(value);
        cleanUpErrors();
    };

    const renderError = (): JSX.Element | null =>
        firstError ? (
            <ErrorMessage
                message={getPhrase(firstError.title)}
                description={firstError.description && getPhrase(firstError.description)}
                errorMessageClass={classNames('error-container error', { [styles.errorCIAM]: isCIAMEnabled })}
                icon={
                    <i className='error-message__icon'>
                        <SvgWarningFilled />
                    </i>
                }
            />
        ) : null;

    const formVariant = isGuestDetailsPage
        ? ResetPasswordVariant.HolidayInFunnel
        : ResetPasswordVariant.HolidayOutFunnel;

    return (
        <div data-tid='provide-email-popup'>
            <div data-tid='forget-password-title'>
                {getPhrase(SitecoreDictionary.LoginDescriptionsIsThisCorrectEmail)}
            </div>

            {isCIAMEnabled ? (
                <forgotten-password
                    variant={formVariant}
                    lang={getCMSLang(lang)}
                    data-tid='ciam-forgotten-password'
                    email={customerLogin.email || undefined}
                    api-url={envAll.CIAM_API_URL}
                    env={envAll.CIAM_B2B_STREAM || undefined}
                />
            ) : (
                <div className={styles.wrapper}>
                    <ValidatableField
                        id='reset-email'
                        type='email'
                        vertical
                        label={getPhrase(SitecoreDictionary.LoginLabelsEmailAddress)}
                        value={email}
                        errors={emailErrors}
                        onChange={onChangeEmailField}
                        autoComplete='email'
                    />

                    {renderError()}

                    <div data-tid='forget-password-description'>
                        {getPhrase(SitecoreDictionary.LoginDescriptionsIfNoEnterCorrectEmail)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default observer(ResetPasswordForm);
