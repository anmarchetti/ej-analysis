import { observer } from 'mobx-react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { GuestInfo } from 'models/GuestInfo';
import Button from 'frontend/components/common/Button';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import ValidatableFieldNew from 'frontend/components/common/ValidatableField/ValidatableFieldNew';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';

import useEmailVerification from './EmailVerification.utils';
import EmailVerificationSignIn from './EmailVerificationSignIn';

import styles from './GuestSection.module.scss';

interface IEmailVerificationProps {
    guest: GuestInfo;
    hasSignInPrompt: boolean;
}

export const EmailVerification: React.FC<IEmailVerificationProps> = ({ guest, hasSignInPrompt }) => {
    const { isDisplayed, title, getPhrase, customerLogin, onClick, onChange } = useEmailVerification({ guest });

    if (!isDisplayed) return null;

    const { isEmailValidated, email, emailErrors, firstError } = customerLogin;

    return (
        <div className={styles.wrapper}>
            <div>
                <h4 className={styles.title}>{title}</h4>

                {!isEmailValidated && (
                    <p className={styles.description}>
                        {getPhrase(SitecoreDictionary.GuestDetailsDescriptionsEmailForBookingConfirmation)}
                    </p>
                )}

                <div className={styles.fieldWrapper}>
                    <ValidatableFieldNew
                        id={`email-${guest.type}`}
                        type='email'
                        vertical
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsEmail)}
                        value={email}
                        errors={emailErrors}
                        onChange={onChange}
                        autoComplete={isEmailValidated && hasSignInPrompt ? 'off' : 'email'}
                        submitted={customerLogin.forceErrors}
                    />

                    {!isEmailValidated && (
                        <Button className={styles.button} onClick={onClick} hasDisabledStyles={emailErrors.length > 0}>
                            {getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
                        </Button>
                    )}
                </div>
            </div>

            {!isEmailValidated && firstError && (
                <div className={styles.emailWrapper}>
                    <ErrorMessage
                        message={getPhrase(firstError.title)}
                        description={firstError.description && getPhrase(firstError.description)}
                        errorMessageClass='error-container'
                        icon={
                            <i className='error-message__icon'>
                                <SvgWarningFilled />
                            </i>
                        }
                    />
                </div>
            )}

            {isEmailValidated && hasSignInPrompt && <EmailVerificationSignIn />}
        </div>
    );
};

export default observer(EmailVerification);
