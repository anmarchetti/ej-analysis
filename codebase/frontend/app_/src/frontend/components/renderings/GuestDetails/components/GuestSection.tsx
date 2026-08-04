import React, { PropsWithChildren } from 'react';
import classNames from 'classnames';
import { inject, observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import validationService from 'frontend/services/validation.service';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { stripLeadingZeroForUKAndIreland } from 'frontend/utils/phoneNumber.utils';
import { ICountryCodeSelectOption, ISelectOption } from 'models/data/ISelectOption';
import { LoginCustomer } from 'models/data/LoginCustomer';
import { IValidationError } from 'models/data/validation/IValidationError';
import { GuestDetailsPhase } from 'models/enum/GuestDetailsPhase';
import { GuestType } from 'models/enum/GuestType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { ValidationType } from 'models/enum/ValidationType';
import { DEFAULT_ADULT_BIRTHDAY, GuestInfo } from 'models/GuestInfo';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';
import Checkbox from 'frontend/components/common/Checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';
import ValidatableDateField from 'frontend/components/common/ValidatableDateField';
import ValidatableFieldNew from 'frontend/components/common/ValidatableField/ValidatableFieldNew';
import ValidatableSelectField from 'frontend/components/common/ValidatableSelectField';
import { ValidationIndicators } from 'frontend/components/common/ValidationIndicators/ValidationIndicators';
import SVGHide from 'frontend/components/icons-new/Hide';
import SvgUserFilled from 'frontend/components/icons-new/UserFilled';
import SVGView from 'frontend/components/icons-new/View';
import { IGuestPageFields } from 'frontend/components/renderings/GuestDetails/GuestDetails.utils';

import GuestDetailsBlock from './section/GuestDetailsBlock';
import GuestAddressSection from './GuestAddressSection';

import styles from './GuestSection.module.scss';

interface IGuestSection extends IComponentWithDictionary {
    countryCodesSelectOptions: ICountryCodeSelectOption[];
    dialingCodesSelectOptions: ISelectOption[];
    forceErrors: boolean;
    getCustomerTitlesSelectOptions: (isAdult: boolean) => ISelectOption[];
    getPrimarySectionText: (details: GuestInfo) => string;
    getSecondarySectionText: (details: GuestInfo) => string;
    getSetting: (setting: SiteSettings) => string;
    guestDetails: GuestInfo;
    id: number;
    isFormValid: boolean;
    isTradePortal: boolean;
    leadSurname: string;
    passengers: GuestInfo[];
    customerLogin?: LoginCustomer; // prop injected from Holidays Stores (undefined in Trade Portal)
    fields?: IGuestPageFields;
    ignoreAnimation?: boolean;
    updateValidateEmailPage?: () => void; // prop injected from Holidays Stores (undefined in Trade Portal)
}

interface IGuestSectionState {
    isPasswordVisible: boolean;
    isPhoneFieldTouched: boolean;
}

const PasswordIndicatorsMessages = [
    SitecoreDictionary.CreateAccountPasswordCriteriaLength,
    SitecoreDictionary.CreateAccountPasswordCriteriaNumber,
    SitecoreDictionary.CreateAccountPasswordCriteriaUppercaseLetter,
    SitecoreDictionary.CreateAccountPasswordCriteriaLowercaseLetter,
    SitecoreDictionary.CreateAccountPasswordCriteriaFirstCharacter,
    SitecoreDictionary.CreateAccountPasswordCriteriaSpecialCharacters,
];

export class GuestSection extends React.Component<PropsWithChildren<IGuestSection>, IGuestSectionState> {
    constructor(props: IGuestSection) {
        super(props);

        this.state = {
            isPasswordVisible: false,
            isPhoneFieldTouched: false,
        };
    }

    // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
    componentDidMount(): void {
        const { guestDetails, getSetting } = this.props;

        if (!guestDetails.dialingCode) {
            this.onChange('dialingCode')(getSetting(SiteSettings.DefaultDialingCode) || '');
        }

        if (!guestDetails.countryCode) {
            this.onChange('countryCode')(getSetting(SiteSettings.DefaultCountryCode) || '');
        }
    }

    // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
    componentDidUpdate(): void {
        const { guestDetails, getSetting } = this.props;

        //component shouldn't be without dialingCode
        if (!guestDetails.dialingCode) {
            this.onChange('dialingCode')(getSetting(SiteSettings.DefaultDialingCode) || '');
        }
    }

    private readonly onChangeDateOfBirth = (value: string): void => {
        if (this.props.guestDetails.isLead) {
            const date = formatDateL10n(new Date(1989, 6, 10), DATE_FORMATS.inputField);
            this.onChange('dateOfBirth')(date);

            return;
        }

        this.onChange('dateOfBirth')(value);
    };

    private readonly getGuestSrLabel = (label: string): string => {
        const { getPhrase, guestDetails, id } = this.props;
        let name = `${this.props.getPrimarySectionText(guestDetails)} ${id}`;

        if (guestDetails.isLead) {
            name += ` (${getPhrase(SitecoreDictionary.GuestDetailsSectionHeadersLeadGuest)})`;
        }

        return `${name} ${label}`;
    };

    private readonly getLastNameValue = (): string => {
        const { guestDetails, leadSurname } = this.props;

        if (!guestDetails.isLead && guestDetails.useSurnameAsLead) {
            this.onChange('lastName')(leadSurname || '');

            return leadSurname;
        }

        return guestDetails.lastName;
    };

    private readonly onChangeEmail = (): void => {
        this.props.updateValidateEmailPage?.();
    };

    private get ageOptions(): { label: string; value: string }[] {
        return [
            {
                value: this.props.getPhrase(SitecoreDictionary.GuestDetailsAgeOptions18Plus),
                label: this.props.getPhrase(SitecoreDictionary.GuestDetailsAgeOptions18Plus),
            },
        ];
    }

    private get phonePlaceholder(): string {
        const { isPhoneFieldTouched: isActive } = this.state;
        const { guestDetails, forceErrors, getPhrase } = this.props;

        const active = isActive || forceErrors;

        if (active) return '';

        return `(+${guestDetails.dialingCode}) ${getPhrase(SitecoreDictionary.GuestDetailsLabelsPhone)}`;
    }

    private get ageValue(): string | undefined {
        const { guestDetails, getPhrase } = this.props;

        if (
            guestDetails.isLeadLegalAdult() &&
            guestDetails.dateOfBirthObject?.getTime() !== DEFAULT_ADULT_BIRTHDAY?.getTime()
        ) {
            return getPhrase(SitecoreDictionary.GuestDetailsAgeOptions18Plus);
        }

        return undefined;
    }

    public get wrapperClassNames(): string {
        const { isFormValid, guestDetails, isTradePortal, customerLogin } = this.props;

        if (isFormValid) return '';

        const baseError = !!guestDetails.getErrorsBySiteName(isTradePortal).length;

        const passwordError =
            !isTradePortal &&
            guestDetails.isLead &&
            customerLogin?.isEmailValidated &&
            !customerLogin.isEmailExists &&
            !!customerLogin?.passwordErrors.length;

        return baseError || passwordError ? 'will-be-invalid' : '';
    }

    private readonly onClearSurnameInfo = (): void => {
        this.props.passengers.forEach(passenger =>
            passenger.toggleSurnameForEachPassenger(false, (passenger.lastName = '')),
        );
    };

    private readonly getSurnameTooltip = (): JSX.Element => (
        <div className={styles.tooltipWrapper}>
            <Tooltip>
                <TooltipTrigger />
                <TooltipContent
                    className={styles.tooltipContent}
                    text={this.props.fields?.SurnameTooltip?.value || ''}
                />
            </Tooltip>
        </div>
    );

    private readonly validateEmailAllowList = (email?: string): IValidationError[] => {
        const notAllowedEmails = this.props.fields?.BlacklistedEmails?.value.split(',') || [];
        const notAllowedDomains = this.props.fields?.BlacklistedDomains?.value.split(',') || [];
        const emailDomain = email?.split('@')[1];

        // Check if email and domain is in a not allowed list
        if (email && emailDomain && (notAllowedEmails.includes(email) || notAllowedDomains.includes(emailDomain))) {
            return [
                {
                    errorMessage: SitecoreDictionary.GuestDetailsErrorMessagesEmailNotAllowed,
                    trigger: ValidationType.OnBlur,
                },
            ];
        }

        return [];
    };

    private readonly validateEmailForPatternAndAllowList = (email?: string): IValidationError[] =>
        [
            ...validationService.validateField(this.props.guestDetails, 'email'),
            ...this.validateEmailAllowList(email),
        ].flat();

    private readonly onChange =
        (key: string): ((v: string) => void) =>
        (value: string): void =>
            this.props.guestDetails.onChangeField(key, value);

    // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
    render(): JSX.Element {
        const {
            getPhrase,
            guestDetails,
            id,
            passengers,
            getPrimarySectionText,
            getSecondarySectionText,
            customerLogin,
            isTradePortal,
            ignoreAnimation,
        } = this.props;

        return (
            <GuestDetailsBlock
                id={`guest-details-${getPrimarySectionText(guestDetails)}-${id}`}
                title={`${getPrimarySectionText(guestDetails)} ${id}`}
                secondaryText={getSecondarySectionText(guestDetails)}
                icon={<SvgUserFilled />}
                isLead={guestDetails.isLead}
                wrapperClassName={this.wrapperClassNames}
                ignoreAnimation={ignoreAnimation}
            >
                <div className={styles.wrapper}>
                    {guestDetails.isLead && (
                        <>
                            <h4 className={styles.title}>
                                {getPhrase(
                                    customerLogin?.isEmailValidated || isTradePortal
                                        ? SitecoreDictionary.GuestDetailsTitlesFillInDetails
                                        : SitecoreDictionary.GuestDetailsTitlesEnterYourEmailAddress,
                                )}
                            </h4>

                            {!isTradePortal && customerLogin && (
                                <>
                                    {!customerLogin.isEmailValidated && (
                                        <p className={styles.description}>
                                            {getPhrase(
                                                SitecoreDictionary.GuestDetailsDescriptionsEmailForBookingConfirmation,
                                            )}
                                        </p>
                                    )}

                                    <ValidatableFieldNew
                                        id={`email-${guestDetails.type}-${id}`}
                                        type='email'
                                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsEmail)}
                                        value={customerLogin.email}
                                        ariaLabel={this.getGuestSrLabel(
                                            getPhrase(SitecoreDictionary.GuestDetailsLabelsEmail),
                                        )}
                                        errors={[]}
                                        onChange={(value): void => customerLogin.onChangeEmail(value)}
                                        autoComplete='email'
                                        disabled
                                    >
                                        <div className='guest-login__change col-12'>
                                            <Button isText onClick={this.onChangeEmail}>
                                                {getPhrase(SitecoreDictionary.GuestDetailsButtonsChange)}
                                            </Button>
                                        </div>
                                    </ValidatableFieldNew>
                                </>
                            )}
                        </>
                    )}

                    {guestDetails.isLead &&
                        customerLogin &&
                        customerLogin.isEmailValidated &&
                        !customerLogin.isEmailExists &&
                        !isTradePortal && (
                            <>
                                <form autoComplete='off' action='javascript:void(0);'>
                                    <ValidatableFieldNew
                                        id='password'
                                        vertical
                                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsCreatePassword)}
                                        value={customerLogin.password}
                                        hideError
                                        errors={customerLogin.passwordErrors}
                                        onChange={(value): void => customerLogin.onChangePassword(value)}
                                        type={this.state.isPasswordVisible ? 'text' : 'password'}
                                        postfix={
                                            <Button
                                                isText
                                                onClick={(): void =>
                                                    this.setState(({ isPasswordVisible }) => ({
                                                        isPasswordVisible: !isPasswordVisible,
                                                    }))
                                                }
                                                disabled={!customerLogin.password}
                                            >
                                                {this.state.isPasswordVisible ? <SVGHide /> : <SVGView />}
                                            </Button>
                                        }
                                        autoComplete='new-password'
                                        submitted={this.props.forceErrors}
                                    >
                                        {({
                                            state,
                                        }: {
                                            state: { blurred: boolean; touched: boolean };
                                        }): React.ReactNode | null =>
                                            state.touched ? (
                                                <div className={classNames(styles.passwordInfoWrapper, 'col-md-12')}>
                                                    <ValidationIndicators
                                                        title={this.props.getPhrase(
                                                            SitecoreDictionary.CreateAccountPasswordCriteriaTitle,
                                                        )}
                                                        messages={PasswordIndicatorsMessages}
                                                        errors={customerLogin.passwordErrors}
                                                        hasFieldValue={!!customerLogin.password}
                                                        isFieldBlurred={state.blurred}
                                                    />
                                                </div>
                                            ) : null
                                        }
                                    </ValidatableFieldNew>
                                </form>

                                <div className='row'>
                                    <div className={classNames('col-md-12', styles.passwordInfo)}>
                                        {getPhrase(SitecoreDictionary.GuestDetailsTitlesPasswordInfo)}
                                    </div>
                                </div>
                            </>
                        )}

                    {guestDetails.type !== GuestType.Infant && (
                        <ValidatableSelectField
                            onChange={this.onChange('title')}
                            disabled={false}
                            id={`title-${guestDetails.type}-${id}`}
                            label={getPhrase(SitecoreDictionary.GuestDetailsLabelsTitle)}
                            srLabel={this.getGuestSrLabel(getPhrase(SitecoreDictionary.GuestDetailsLabelsTitle))}
                            value={guestDetails.title}
                            options={this.props.getCustomerTitlesSelectOptions(guestDetails.type === GuestType.Adult)}
                            errors={validationService.validateField(guestDetails, 'title')}
                            forceError={this.props.forceErrors}
                            disableValidationTraking
                            defaultValue={guestDetails.defaultTitle}
                            portal
                        />
                    )}

                    <ValidatableFieldNew
                        id={`first-name-${guestDetails.type}-${id}`}
                        label={getPhrase(
                            isTradePortal
                                ? SitecoreDictionary.GuestDetailsLabelsCustomerFirstName
                                : SitecoreDictionary.GuestDetailsLabelsFirstName,
                        )}
                        ariaLabel={this.getGuestSrLabel(getPhrase(SitecoreDictionary.GuestDetailsLabelsFirstName))}
                        value={guestDetails.firstName}
                        errors={validationService.validateField(guestDetails, 'firstName')}
                        onChange={this.onChange('firstName')}
                        autoComplete={`section-${guestDetails.type}-${id} given-name`}
                        submitted={this.props.forceErrors}
                    />

                    {!guestDetails.isLead && (
                        <div
                            className={classNames(
                                'form-group form-group-offer',
                                isTradePortal && 'col-md-6 col-lg-4 form-checkbox-tooltip-block',
                            )}
                        >
                            <Checkbox
                                small
                                tick
                                textRight
                                checked={guestDetails.useSurnameAsLead}
                                label={this.props.getPhrase(SitecoreDictionary.GuestDetailsLabelsSurnameAsLead)}
                                onChange={event =>
                                    guestDetails.toggleSurnameSameAsLead(event.target.checked, this.props.leadSurname)
                                }
                                dataTid='the-same-surname-checkbox'
                            />
                            {isTradePortal && this.getSurnameTooltip()}
                        </div>
                    )}

                    <ValidatableFieldNew
                        id={`surname-${guestDetails.type}-${id}`}
                        label={getPhrase(
                            isTradePortal
                                ? SitecoreDictionary.GuestDetailsLabelsCustomerSurname
                                : SitecoreDictionary.GuestDetailsLabelsLastName,
                        )}
                        fieldClassName={
                            (!isTradePortal || !guestDetails.isLead) && guestDetails.useSurnameAsLead
                                ? styles.pseudoDisabledField
                                : undefined
                        }
                        ariaLabel={this.getGuestSrLabel(getPhrase(SitecoreDictionary.GuestDetailsLabelsLastName))}
                        value={this.getLastNameValue()}
                        errors={validationService.validateField(guestDetails, 'lastName')}
                        onChange={this.onChange('lastName')}
                        disabled={(!isTradePortal || !guestDetails.isLead) && guestDetails.useSurnameAsLead}
                        autoComplete={`section-${guestDetails.type}-${id} family-name`}
                        submitted={this.props.forceErrors}
                    />

                    {isTradePortal && guestDetails.isLead && (
                        <div className='col-md-6 col-lg-4 form-group form-group-offer form-checkbox-tooltip-wrapper'>
                            <div className='form-checkbox-tooltip-block'>
                                <Checkbox
                                    small
                                    tick
                                    textRight
                                    checked={guestDetails.useSurnameAsLead}
                                    label={this.props.fields?.CheckboxLabel}
                                    onChange={event =>
                                        passengers.map(passenger =>
                                            passenger.toggleSurnameForEachPassenger(
                                                event.target.checked,
                                                this.props.leadSurname,
                                            ),
                                        )
                                    }
                                    dataTid='the-same-surname-for-all-passengers-checkbox'
                                />
                                {this.getSurnameTooltip()}
                            </div>

                            {guestDetails.lastName && guestDetails.useSurnameAsLead && (
                                <Button
                                    isText
                                    className='surnames-clear-btn'
                                    onClick={this.onClearSurnameInfo}
                                    dataTid='guest-section-remove-all-button'
                                >
                                    {this.props.fields?.RemoveAllLabel?.value}
                                </Button>
                            )}
                        </div>
                    )}

                    {guestDetails.isLead && isTradePortal && (
                        <ValidatableFieldNew
                            id={`email-${guestDetails.type}-${id}`}
                            type='email'
                            label={getPhrase(
                                isTradePortal && guestDetails.isLead
                                    ? SitecoreDictionary.GuestDetailsLabelsCustomerEmail
                                    : SitecoreDictionary.GuestDetailsLabelsEmail,
                            )}
                            ariaLabel={this.getGuestSrLabel(getPhrase(SitecoreDictionary.GuestDetailsLabelsEmail))}
                            value={guestDetails.email}
                            errors={this.validateEmailForPatternAndAllowList(guestDetails.email)}
                            onChange={this.onChange('email')}
                            autoComplete='email'
                            submitted={this.props.forceErrors}
                        />
                    )}

                    {guestDetails.isLead && (
                        <>
                            <ValidatableSelectField
                                onChange={this.onChange('dialingCode')}
                                disabled={false}
                                id={`country-${guestDetails.type}-${id}`}
                                label={getPhrase(SitecoreDictionary.GuestDetailsLabelsInternationalDialingCode)}
                                srLabel={this.getGuestSrLabel(
                                    getPhrase(SitecoreDictionary.GuestDetailsLabelsInternationalDialingCode),
                                )}
                                value={guestDetails.dialingCode}
                                options={this.props.dialingCodesSelectOptions}
                                errors={validationService.validateField(guestDetails, 'dialingCode')}
                                forceError={this.props.forceErrors}
                                disableValidationTraking
                                portal
                            />

                            <ValidatableFieldNew
                                id={`phone-${guestDetails.type}-${id}`}
                                type='tel'
                                inputMode='numeric'
                                fieldClassName={classNames(styles.phoneField, {
                                    [styles.active]:
                                        this.state.isPhoneFieldTouched ||
                                        this.props.forceErrors ||
                                        !!guestDetails.phone?.length,
                                })}
                                label={getPhrase(SitecoreDictionary.GuestDetailsLabelsPhone)}
                                ariaLabel={this.getGuestSrLabel(getPhrase(SitecoreDictionary.GuestDetailsLabelsPhone))}
                                value={guestDetails.phone}
                                errors={validationService.validateField(guestDetails, 'phone')}
                                onChange={this.onChange('phone')}
                                placeholder={this.phonePlaceholder}
                                blurTransform={(value: string): string =>
                                    stripLeadingZeroForUKAndIreland(value, guestDetails.dialingCode)
                                }
                                prefix={<span className={styles.prefix}>{`(+${guestDetails.dialingCode})`}</span>}
                                afterFieldRender={
                                    !!getPhrase(SitecoreDictionary.GuestDetailsTitlesPhoneTooltip) && (
                                        <div className={styles.tooltipWrapper}>
                                            <Tooltip>
                                                <TooltipTrigger className={styles.icon} />
                                                <TooltipContent
                                                    text={getPhrase(SitecoreDictionary.GuestDetailsTitlesPhoneTooltip)}
                                                />
                                            </Tooltip>
                                        </div>
                                    )
                                }
                                onFocus={(): void => this.setState({ isPhoneFieldTouched: true })}
                                submitted={this.props.forceErrors}
                            >
                                <div className={styles.note}>
                                    {getPhrase(SitecoreDictionary.GuestDetailsLabelsPhoneNote)}
                                </div>
                            </ValidatableFieldNew>

                            <ValidatableSelectField
                                onChange={this.onChangeDateOfBirth}
                                disabled={false}
                                id={`lead-age-${guestDetails.type}-${id}`}
                                label={getPhrase(SitecoreDictionary.GuestDetailsLabelsAge)}
                                srLabel={this.getGuestSrLabel(getPhrase(SitecoreDictionary.GuestDetailsLabelsAge))}
                                value={this.ageValue}
                                options={this.ageOptions}
                                errors={guestDetails.dateOfBirthErrors}
                                forceError={this.props.forceErrors}
                                disableValidationTraking
                                portal
                            />

                            {!isTradePortal && (
                                <GuestAddressSection
                                    id={id}
                                    guestDetails={guestDetails}
                                    getGuestSrLabel={this.getGuestSrLabel}
                                    onChange={this.onChange}
                                    forceErrors={this.props.forceErrors}
                                    countryCodesSelectOptions={this.props.countryCodesSelectOptions}
                                />
                            )}
                        </>
                    )}

                    {guestDetails.type === GuestType.Child && (
                        <ValidatableDateField
                            onChange={this.onChangeDateOfBirth}
                            disabled={false}
                            id={`dateOfBirth-${guestDetails.type}-${id}`}
                            label={getPhrase(SitecoreDictionary.GuestDetailsLabelsDateOfBirth)}
                            srLabel={this.getGuestSrLabel(getPhrase(SitecoreDictionary.GuestDetailsLabelsDateOfBirth))}
                            value={guestDetails.dateOfBirth}
                            errors={guestDetails.dateOfBirthErrors}
                            forceError={this.props.forceErrors}
                            inputContainerClass={classNames('form-control__label--focused', styles.inputWrapper)}
                            shouldMoveCursor
                            autoComplete={!isTradePortal}
                            disableValidationTraking
                            containerClass={styles.dateOfBirthContainer}
                        />
                    )}

                    {this.props.children}
                </div>
            </GuestDetailsBlock>
        );
    }
}

const ConnectedGuestSection = inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    isTradePortal: stores.layoutStore.isTradePortal,
    leadSurname: stores.guestDetailsStore.leadSurname,
    forceErrors: stores.guestDetailsStore.forceErrors,
    passengers: isTradeStore(stores) && stores.guestDetailsStore.guestsDetails,
    getSecondarySectionText: stores.guestDetailsStore.getSecondarySectionText,
    getPrimarySectionText: stores.guestDetailsStore.getPrimarySectionText,
    getSetting: stores.layoutStore.getSetting,
    countryCodesSelectOptions: stores.appCatalogStore.countryCodesSelectOptions,
    dialingCodesSelectOptions: stores.appCatalogStore.dialingCodesSelectOptions,
    getCustomerTitlesSelectOptions: stores.appCatalogStore.getCustomerTitlesSelectOptions,
    isFormValid: stores.guestDetailsStore.isFormValid,

    ...(isHolidayStore(stores) && {
        updateValidateEmailPage: (): void =>
            stores.guestDetailsStore.toggleGuestDetailsPhase(GuestDetailsPhase.VerifyEmail),
        customerLogin: stores.guestDetailsStore.customerLogin,
    }),
}))(observer(class WrappedGuestSection extends GuestSection {}));

export default ConnectedGuestSection;
