import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { convertCountriesAirportsToSelectOptions } from 'frontend/utils/airports.utils';
import { scrollToErrorBlock } from 'frontend/utils/ui.utils';
import { CustomerDetails } from 'models/data/CustomerDetails';
import { ISelectOption } from 'models/data/ISelectOption';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { IAirportCountry } from 'models/sitecore/IAirportsData';
import Button from 'frontend/components/common/Button';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import PhonePrefix from 'frontend/components/common/PhonePrefix';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import ValidatablePasswordField from 'frontend/components/common/ValidatablePasswordField';
import ValidatableSelectField from 'frontend/components/common/ValidatableSelectField';
import SvgDepartureFilled from 'frontend/components/icons-new/DepartureFilled';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import SpecialOffersBlock, {
    IOffersAndUpdatesFields,
} from 'frontend/components/renderings/GuestDetails/components/SpecialOffersBlock';

import AccountSignIn from './components/AccountSignIn';
import { CreateAccountFieldSet } from './components/CreateAccountFieldSet';

import styles from './CreateAccount.module.scss';

export interface ICreateAccountFields extends IOffersAndUpdatesFields {
    AccountDetailsDescription: ISitecoreField<string>;
    AccountDetailsTitle: ISitecoreField<string>;
    AirportsDescription: ISitecoreField<string>;
    AirportsTitle: ISitecoreField<string>;
    LoginDetailsDescription: ISitecoreField<string>;
    LoginDetailsTitle: ISitecoreField<string>;
    OffersDescription: ISitecoreField<string>;
    OffersTitle: ISitecoreField<string>;
}

export interface ICreateAccountProps
    extends ISitecoreComponent<{ airportsGroups: IAirportCountry[]; data: ICreateAccountFields }> {
    actionAfterSubmitting?: () => void;
    resetShouldSubmit?: () => void;
    shouldSubmit?: boolean;
}

export const CreateAccount = ({
    fields,
    shouldSubmit,
    actionAfterSubmitting,
    resetShouldSubmit,
}: ICreateAccountProps) => {
    const {
        getPhrase,

        countryCodesSelectOptions,
        dialingCodesSelectOptions,
        titlesSelectOptions,

        initialize,
        customerDetails,
        customerDetailsKey,
        customerLogin,
        isCreateAccountForbidden,
        isCreateAccountSending,
        isFormValid,
        isSignInState,
        errors,
        forceErrors,
        toggleForceErrors,
        changeEmail,
        toggleSignInState,
        createAccount,
        signIn,
        isCreateAccountPage,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,

        countryCodesSelectOptions: stores.appCatalogStore.countryCodesSelectOptions,
        dialingCodesSelectOptions: stores.appCatalogStore.dialingCodesSelectOptions,
        titlesSelectOptions: stores.appCatalogStore.getCustomerTitlesSelectOptions(true),

        initialize: stores.createAccountStore.initialize,
        customerDetails: stores.createAccountStore.customerDetails,
        customerDetailsKey: stores.createAccountStore.customerDetailsKey,
        customerLogin: stores.createAccountStore.customerLogin,
        isCreateAccountForbidden: stores.createAccountStore.isCreateAccountForbidden,
        isCreateAccountSending: stores.createAccountStore.isCreateAccountSending,
        isFormValid: stores.createAccountStore.isFormValid,
        isSignInState: stores.createAccountStore.isSignInState,
        errors: stores.createAccountStore.createAccountErrors,
        forceErrors: stores.createAccountStore.forceErrors,
        toggleForceErrors: stores.createAccountStore.toggleForceErrors,
        changeEmail: stores.createAccountStore.changeEmail,
        toggleSignInState: stores.createAccountStore.toggleSignInState,
        createAccount: stores.createAccountStore.createAccount,
        signIn: stores.createAccountStore.signIn,
        isCreateAccountPage: stores.layoutStore.isCreateAccountPage,
    }));

    const [airportsSelectOptions] = useState(() =>
        fields?.airportsGroups?.length ? convertCountriesAirportsToSelectOptions(fields.airportsGroups) : [],
    );

    const [phoneState, setPhoneState] = useState({ phoneFocused: false, codeDigitsClass: '', phoneLabelClass: '' });

    const isFieldRequired = field => customerDetails.isFieldRequired(field);

    const validateField = (field: keyof CustomerDetails) => customerDetails.validateField(field);

    const onChangeField = (field: keyof CustomerDetails, value: any) => {
        customerDetails.onChangeField(field, value);
    };

    const onSubmitForm = async (event?) => {
        event?.preventDefault();

        if (isCreateAccountForbidden || isCreateAccountSending) {
            return;
        }

        if (isFormValid) {
            try {
                await createAccount(actionAfterSubmitting);
            } catch (e) {
                scrollIntoErrors();
            }
        } else {
            scrollIntoErrors();
        }

        resetShouldSubmit?.();
    };

    const scrollIntoErrors = async () => {
        // Trigger UI update before scroll
        await toggleForceErrors(true);
        // Scroll to invalid element
        scrollToErrorBlock();
    };

    const renderAirportsSelect = (airportName: 'airport1' | 'airport2' | 'airport3') => {
        const options = airportsSelectOptions.filter((option: ISelectOption) => {
            const value = option.value as string;

            return !customerDetails.preferredAirports.includes(value) || customerDetails[airportName] === value;
        });

        return (
            <ValidatableSelectField
                onChange={value => onChangeField(airportName, value)}
                id={`customer-${airportName}`}
                label={getPhrase(SitecoreDictionary.CreateAccountLabelsAirport)}
                value={customerDetails[airportName]}
                options={options}
                errors={[]}
                required={false}
                isSearchable
                isClearable
                fieldClass='select-airports'
            >
                <SvgDepartureFilled className='select-airports__icon' />
            </ValidatableSelectField>
        );
    };

    const phonePlaceholder = (): string => {
        const mobileNumberLabel = getPhrase(SitecoreDictionary.GuestDetailsLabelsPhone);

        if (phoneState.phoneFocused) {
            return `${mobileNumberLabel}`;
        }

        return `(+${customerDetails.dialingCode}) ${mobileNumberLabel}`;
    };

    const onPhoneFocus = () => {
        setPhoneState({
            phoneFocused: true,
            codeDigitsClass: `code-${customerDetails?.dialingCode?.length}-digits`,
            phoneLabelClass: 'form-control__label--active',
        });
    };

    const onChangeDialingCode = (value: string) => {
        customerDetails.onChangeField('dialingCode', value);
        updateCodeDigitsClass();
    };

    const updateCodeDigitsClass = () => {
        if (customerDetails.mobilePhone || !!phoneState.codeDigitsClass) {
            setPhoneState({
                phoneFocused: true,
                codeDigitsClass: `code-${customerDetails?.dialingCode?.length}-digits`,
                phoneLabelClass: phoneState.phoneLabelClass,
            });
        }
    };

    const phoneFilter = () => {
        if (customerDetails.dialingCode === '44' || customerDetails.dialingCode === '353') {
            return /^(0){1}/g;
        }

        return undefined;
    };

    useEffect(() => {
        initialize();
    }, []);

    useEffect(() => {
        if (shouldSubmit) {
            onSubmitForm();
        }
    }, [shouldSubmit]);

    if (!fields?.data) return null;

    return (
        <form className='create-account' onSubmit={onSubmitForm}>
            <CreateAccountFieldSet
                title={fields.data.LoginDetailsTitle}
                description={fields.data.LoginDetailsDescription}
            >
                {isSignInState ? (
                    <AccountSignIn
                        onSignIn={() => signIn()}
                        customerLogin={customerLogin}
                        changeEmail={() => toggleSignInState(false)}
                    />
                ) : (
                    <>
                        <ValidatableField
                            onChange={value => changeEmail(value)}
                            id='customer-email'
                            label={getPhrase(SitecoreDictionary.GuestDetailsLabelsEmail)}
                            value={customerDetails.email}
                            errors={validateField('email')}
                            forceError={forceErrors}
                            required={isFieldRequired('email')}
                            shouldTrimOnBlur
                        />
                        <ValidatablePasswordField
                            onChange={value => onChangeField('password', value)}
                            id='customer-password'
                            label={getPhrase(SitecoreDictionary.GuestDetailsLabelsCreatePassword)}
                            value={customerDetails.password}
                            errors={validateField('password')}
                            forceError={forceErrors}
                            containerClass={isCreateAccountForbidden ? 'create-account--disabled' : ''}
                            autoComplete={false}
                            disabled={isCreateAccountForbidden}
                            required={isFieldRequired('password')}
                            hasValidationIndicators
                        />
                    </>
                )}
            </CreateAccountFieldSet>

            <div
                className={classNames('create-account-details', isCreateAccountForbidden && 'create-account--disabled')}
                key={customerDetailsKey}
            >
                <CreateAccountFieldSet
                    title={fields.data.AccountDetailsTitle}
                    description={fields.data.AccountDetailsDescription}
                    disabled={isCreateAccountForbidden}
                >
                    <ValidatableSelectField
                        onChange={value => onChangeField('title', value)}
                        id='customer-title'
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsTitle)}
                        value={customerDetails.title}
                        options={titlesSelectOptions}
                        errors={validateField('title')}
                        forceError={forceErrors}
                        required={isFieldRequired('title')}
                    />

                    <ValidatableField
                        onChange={value => onChangeField('firstName', value)}
                        id='customer-firstName'
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsFirstName)}
                        value={customerDetails.firstName}
                        errors={validateField('firstName')}
                        forceError={forceErrors}
                        required={isFieldRequired('firstName')}
                        shouldTrimOnBlur
                    />

                    <ValidatableField
                        onChange={value => onChangeField('lastName', value)}
                        id='customer-lastName'
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsLastName)}
                        value={customerDetails.lastName}
                        errors={validateField('lastName')}
                        forceError={forceErrors}
                        required={isFieldRequired('lastName')}
                        shouldTrimOnBlur
                    />

                    <ValidatableSelectField
                        onChange={value => onChangeField('countryCode', value)}
                        id='customer-countryCode'
                        label={getPhrase(SitecoreDictionary.GlobalsDestinationTypesCountry)}
                        value={customerDetails.countryCode}
                        options={countryCodesSelectOptions}
                        errors={validateField('countryCode')}
                        forceError={forceErrors}
                        required={isFieldRequired('countryCode')}
                    />

                    <ValidatableField
                        onChange={value => onChangeField('address1', value)}
                        id='customer-address1'
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsAddress)}
                        value={customerDetails.address1}
                        errors={validateField('address1')}
                        forceError={forceErrors}
                        required={isFieldRequired('address1')}
                        shouldTrimOnBlur
                    />

                    <ValidatableField
                        onChange={value => onChangeField('address2', value)}
                        id='customer-address2'
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsAddress2)}
                        value={customerDetails.address2}
                        errors={validateField('address2')}
                        forceError={forceErrors}
                        required={isFieldRequired('address2')}
                        shouldTrimOnBlur
                    />

                    <ValidatableField
                        onChange={value => onChangeField('city', value)}
                        id='customer-city'
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsCity)}
                        value={customerDetails.city}
                        errors={validateField('city')}
                        forceError={forceErrors}
                        required={isFieldRequired('city')}
                        shouldTrimOnBlur
                    />

                    <ValidatableField
                        onChange={value => onChangeField('postalCode', value)}
                        id='customer-postalCode'
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsPostcode)}
                        value={customerDetails.postalCode}
                        errors={validateField('postalCode')}
                        forceError={forceErrors}
                        required={isFieldRequired('postalCode')}
                        shouldTrimOnBlur
                    />

                    <ValidatableSelectField
                        onChange={onChangeDialingCode}
                        id='customer-dialingCode'
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsInternationalDialingCode)}
                        value={customerDetails.dialingCode}
                        options={dialingCodesSelectOptions}
                        errors={validateField('dialingCode')}
                        forceError={forceErrors}
                        required={isFieldRequired('dialingCode')}
                    />

                    <ValidatableField
                        onChange={value => onChangeField('mobilePhone', value)}
                        Prefix={() => <PhonePrefix code={`(+${customerDetails.dialingCode})`} />}
                        id='customer-mobilePhone'
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsPhone)}
                        labelClass={phoneState.phoneLabelClass}
                        watermark={phonePlaceholder()}
                        value={customerDetails.mobilePhone}
                        errors={validateField('mobilePhone')}
                        forceError={forceErrors}
                        shouldTrimOnBlur
                        required={isFieldRequired('mobilePhone')}
                        inputContainerClass={classNames(
                            !!getPhrase(SitecoreDictionary.GuestDetailsTitlesPhoneTooltip) ? 'col-11' : 'col-12',
                            'form-control__phone-label',
                            phoneState.codeDigitsClass,
                        )}
                        blurFilter={phoneFilter()}
                        customErrorClass='col-md-7 form-control__error'
                        onFocus={onPhoneFocus}
                        note={
                            <div className='form-field__note'>
                                {getPhrase(SitecoreDictionary.GuestDetailsLabelsPhoneNote)}
                            </div>
                        }
                    >
                        {!!getPhrase(SitecoreDictionary.GuestDetailsTitlesPhoneTooltip) && (
                            <div className={classNames(styles.tooltipWrapper)}>
                                <Tooltip>
                                    <TooltipTrigger className={styles.icon} />
                                    <TooltipContent
                                        text={getPhrase(SitecoreDictionary.GuestDetailsTitlesPhoneTooltip)}
                                    />
                                </Tooltip>
                            </div>
                        )}
                    </ValidatableField>
                </CreateAccountFieldSet>

                {isCreateAccountPage && (
                    <CreateAccountFieldSet
                        title={fields.data.AirportsTitle}
                        description={fields.data.AirportsDescription}
                        disabled={isCreateAccountForbidden}
                    >
                        {renderAirportsSelect('airport1')}
                        {renderAirportsSelect('airport2')}
                        {renderAirportsSelect('airport3')}
                    </CreateAccountFieldSet>
                )}

                <CreateAccountFieldSet
                    title={fields.data.OffersTitle}
                    description={fields.data.OffersDescription}
                    disabled={isCreateAccountForbidden}
                >
                    <SpecialOffersBlock
                        fields={fields.data}
                        forceErrors={forceErrors}
                        isOffersOptedIn={customerDetails.mailingsFlag}
                        isPartnerOffersOptedIn={customerDetails.easyJetMailingsFlag}
                        changeOffersAndUpdates={customerDetails.onChangeMailingsFlag}
                    />
                </CreateAccountFieldSet>

                {errors && errors.length > 0 && (
                    <ErrorMessage
                        message={getPhrase(errors[0].title || '')}
                        description={getPhrase(errors[0].description || '')}
                        errorMessageClass='error'
                        icon={
                            <i className='error-message__icon'>
                                <SvgWarningFilled />
                            </i>
                        }
                    />
                )}

                {isCreateAccountPage && (
                    <div className='create-account__submit'>
                        <Button
                            onClick={e => onSubmitForm(e)}
                            isLarge
                            hasDisabledStyles={!isFormValid || isCreateAccountForbidden}
                            isLoading={isCreateAccountSending}
                            type='submit'
                        >
                            {getPhrase(SitecoreDictionary.CreateAccountButtonsRegister)}
                        </Button>
                    </div>
                )}
            </div>
        </form>
    );
};

export default observer(CreateAccount);
