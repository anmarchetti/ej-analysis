import classNames from 'classnames';
import { observer } from 'mobx-react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import RadioButton from 'frontend/components/common/RadioButton';
import ResetPassword from 'frontend/components/common/ResetPassword/ResetPassword';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';
import ValidatableFieldNew from 'frontend/components/common/ValidatableField/ValidatableFieldNew';
import SVGHide from 'frontend/components/icons-new/Hide';
import SVGView from 'frontend/components/icons-new/View';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';

import useEmailVerificationSignIn from './EmailVerificationSignIn.utils';

import styles from './EmailVerificationSignIn.module.scss';

export const EmailVerificationSignIn: React.FC = () => {
    const {
        isDisplayed,
        getPhrase,
        toggleSignIn,
        isSignInChecked,
        customerLogin,
        isScreenMedium,
        onChangePassword,
        isPasswordVisible,
        setIsPasswordVisible,
        onForgotPasswordClick,
        continueWithoutSignIn,
        renderSignInButton,
        isResetPasswordVisible,
        onCancel,
    } = useEmailVerificationSignIn();

    if (!isDisplayed) return null;

    return (
        <div className={styles.options}>
            <div className={classNames(styles.option, styles.signIn)} data-tid='signing-in'>
                <RadioButton
                    label={getPhrase(SitecoreDictionary.GuestDetailsRadioButtonsSignInIntoYourAccount)}
                    name='signing-in'
                    onChange={(): void => toggleSignIn(true)}
                    checked={isSignInChecked === true}
                />

                {isSignInChecked === true && customerLogin.isEmailExists && (
                    <>
                        <div className={styles.fieldWrapper}>
                            <ValidatableFieldNew
                                id='password'
                                vertical
                                label={getPhrase(SitecoreDictionary.GuestDetailsLabelsPassword)}
                                value={customerLogin.password}
                                errors={customerLogin.passwordErrors}
                                onChange={onChangePassword}
                                type={isPasswordVisible ? 'text' : 'password'}
                                autoComplete='current-password'
                                postfix={
                                    <Button
                                        isText
                                        onClick={(): void => setIsPasswordVisible(v => !v)}
                                        disabled={!customerLogin.password}
                                    >
                                        {isPasswordVisible ? <SVGHide /> : <SVGView />}
                                    </Button>
                                }
                            >
                                <div className={classNames(styles.forgotPasswordInfo)}>
                                    <Button
                                        type='button'
                                        onClick={(): void => onForgotPasswordClick()}
                                        isLink
                                        dataTid='forgot-password-link'
                                    >
                                        {getPhrase(SitecoreDictionary.GuestDetailsButtonsForgotYourPassword)}
                                    </Button>
                                </div>
                            </ValidatableFieldNew>

                            {isScreenMedium && <div className={styles.buttonWrapper}>{renderSignInButton()}</div>}
                        </div>

                        {customerLogin.firstError && (
                            <div className={styles.errorWrapper}>
                                <ErrorMessage
                                    message={getPhrase(customerLogin.firstError.title)}
                                    description={
                                        customerLogin.firstError.description &&
                                        getPhrase(customerLogin.firstError.description)
                                    }
                                    errorMessageClass='error-container'
                                    icon={
                                        <i className='error-message__icon'>
                                            <SvgWarningFilled />
                                        </i>
                                    }
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className={classNames(styles.option, styles.withoutSignIn)} data-tid='continue-without-sign-in'>
                <RadioButton
                    label={getPhrase(SitecoreDictionary.GuestDetailsRadioButtonsContinueWithoutSingIn)}
                    name='continue-without-sign-in'
                    onChange={(): void => continueWithoutSignIn()}
                    checked={isSignInChecked === false}
                >
                    {!!getPhrase(SitecoreDictionary.GuestDetailsRadioButtonsContinueWithoutSingInTooltip) && (
                        <Tooltip>
                            <TooltipTrigger />
                            <TooltipContent
                                text={getPhrase(
                                    SitecoreDictionary.GuestDetailsRadioButtonsContinueWithoutSingInTooltip,
                                )}
                            />
                        </Tooltip>
                    )}
                </RadioButton>
            </div>

            {isSignInChecked === true && customerLogin.isEmailExists && !isScreenMedium && renderSignInButton()}

            {isResetPasswordVisible && (
                <ResetPassword
                    defaultEmail={customerLogin.email}
                    afterReset={(email: string): void => {
                        customerLogin.onChangeEmail(email);
                        customerLogin.toggleEmailExists(true);
                        customerLogin.toggleEmailValidated(true);
                        customerLogin.cleanUpErrors();
                        customerLogin.rerender();
                    }}
                    onCancelClick={onCancel}
                />
            )}
        </div>
    );
};

export default observer(EmailVerificationSignIn);
