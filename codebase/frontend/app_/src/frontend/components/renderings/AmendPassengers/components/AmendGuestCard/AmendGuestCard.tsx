import React, { useCallback, useMemo, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { useEffectIfTruthy } from 'frontend/hooks/useEffectIfTruthy';
import useStore from 'frontend/hooks/useStore';
import validationService from 'frontend/services/validation.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { getPassengerParameters, updateRemainingCharactersToChange } from 'frontend/utils/AmendPassengers.utils';
import { GuestToEdit } from 'models/data/GuestToEdit';
import { ApiErrors } from 'models/enum/ApiErrors';
import { GuestType } from 'models/enum/GuestType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ValidationType } from 'models/enum/ValidationType';
import Button from 'frontend/components/common/Button';
import Card from 'frontend/components/common/Card';
import Drawer from 'frontend/components/common/Drawer';
import JSSImage from 'frontend/components/common/JSSImage';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import ValidatableSelectField from 'frontend/components/common/ValidatableSelectField';
import SvgChevronLeft from 'frontend/components/icons-new/ChevronLeft';
import { IAmendPassengersFields } from 'frontend/components/renderings/AmendPassengers/AmendPassengers';
import AmendGuestCardCantChangeTooltip from 'frontend/components/renderings/AmendPassengers/components/AmendGuestCardCantChangeTooltip/AmendGuestCardCantChangeTooltip';
import AmendGuestCardFooter from 'frontend/components/renderings/AmendPassengers/components/AmendGuestCardFooter/AmendGuestCardFooter';
import AmendGuestCardName from 'frontend/components/renderings/AmendPassengers/components/AmendGuestCardName/AmendGuestCardName';
import CharacterChangeWarning from 'frontend/components/renderings/AmendPassengers/components/CharacterChangeWarning/CharacterChangeWarning';
import ErrorPopup, {
    TPassengerErrorTypes,
} from 'frontend/components/renderings/AmendPassengers/components/ErrorPopup/ErrorPopup';
import { useAmendPassengersLocalStore } from 'frontend/components/renderings/AmendPassengers/stores/amendPassengerLocalStore';

import styles from './AmendGuestCard.module.scss';

interface IAmendGuestCardProps {
    guestToEdit: GuestToEdit;
    fields?: IAmendPassengersFields;
}

export const AmendGuestCard = observer(({ guestToEdit, fields }: IAmendGuestCardProps) => {
    const { getPhrase, isScreenMedium, isLoadingPassengers, characterCountLimit, booking } = useStore(
        (stores: HolidaysRootStore) => ({
            getPhrase: stores.layoutStore.getPhrase,
            isScreenMedium: stores.appStore.isScreenMedium,
            booking: stores.amendPassengerStore.booking,
            isLoadingPassengers: stores.amendPassengerStore.isLoadingPassengers,
            characterCountLimit: stores.amendPassengerStore.amendPassengerNameCharacterCount,
        }),
    );

    const { tracking } = useAmendPassengersLocalStore();

    const [errorType, setErrorType] = useState<TPassengerErrorTypes | undefined>(undefined);
    const [remainingCharactersToChange, setRemainingCharactersToChange] = useState(characterCountLimit);

    const { initialDetails, editedDetails, isSelected, error: guestError, canChangeName } = guestToEdit;

    const onPopupClose = useCallback(() => {
        guestToEdit.init(initialDetails);
        setErrorType(undefined);
        setRemainingCharactersToChange(characterCountLimit);
    }, [characterCountLimit, guestToEdit, initialDetails]);

    const onCardOpen = () => {
        if (guestToEdit.initialDetails.isLead) {
            return setErrorType('LeadPassengerRestriction');
        }

        tracking.clickToEditPassenger(booking!.bookingReference);

        return guestToEdit.openCard();
    };

    const onRemovePassenger = () => setErrorType('RemovePassengerRestriction');

    useEffectIfTruthy(() => {
        if (guestError!.errorCode === ApiErrors.CharactersChangeLimitExeeded) {
            setErrorType(ApiErrors.CharactersChangeLimitExeeded);
        } else if (guestError!.errorCode === ApiErrors.ChangeLimitExeeded) {
            setErrorType(ApiErrors.ChangeLimitExeeded);
        } else {
            setErrorType('Generic');
        }
    }, guestError);

    const { prevName, newName, noTitleName, icon, age, subtitle } = useMemo(
        () =>
            getPassengerParameters(
                guestToEdit,
                fields,
                getPhrase(SitecoreDictionary.GlobalsLabelsInfant),
                getPhrase(SitecoreDictionary.GuestDetailsAgeOptions18Plus),
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [editedDetails.firstName, editedDetails.lastName, fields, guestToEdit],
    );

    const [nameValidationErrors, surnameValidationErrors] = useMemo(
        () => [
            validationService.validateField(guestToEdit, 'tempName'),
            validationService.validateField(guestToEdit, 'tempSurname'),
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [guestToEdit.tempName, guestToEdit.tempSurname],
    );

    const updateRemainingCharactersToChangeWithParams = () =>
        updateRemainingCharactersToChange(
            nameValidationErrors,
            surnameValidationErrors,
            setRemainingCharactersToChange,
            characterCountLimit,
            guestToEdit,
        );

    const onCardClose = () => {
        guestToEdit.closeCard();
        updateRemainingCharactersToChangeWithParams();
    };

    const onSaveChanges = (e: React.SyntheticEvent) => {
        tracking.onSavePassengerDetails(booking!.bookingReference, characterCountLimit);
        guestToEdit.saveCard(e);
    };

    const characterChangeLimitExceeded = useMemo(() => remainingCharactersToChange < 0, [remainingCharactersToChange]);

    const isInfant = guestToEdit.initialDetails.type === GuestType.Infant;
    const disableSubmit =
        !guestToEdit.isEdited ||
        !!nameValidationErrors.length ||
        !!surnameValidationErrors.length ||
        characterChangeLimitExceeded;

    const isEditButtonDisabled = guestToEdit.initialDetails.isLead || !canChangeName;

    const form = (
        <form
            key={`guest-${guestToEdit.initialDetails.index}`}
            onSubmit={onSaveChanges}
            data-tid='amend-details-form'
            className={styles.form}
        >
            <div className={styles.passangerFields} data-cs-mask>
                {!isInfant && (
                    <ValidatableSelectField
                        disabled={true}
                        id={`title-${initialDetails.type}-${initialDetails.index}`}
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsTitle)}
                        value={editedDetails.title}
                        options={[
                            {
                                label: editedDetails.title,
                                value: editedDetails.title,
                            },
                        ]}
                        errors={[]}
                        disableValidationTraking
                    >
                        <AmendGuestCardCantChangeTooltip text={fields?.FieldCantBeChangedTooltipText} />
                    </ValidatableSelectField>
                )}

                <div className={styles.nameChange}>
                    <Text field={fields?.NameChangeTitle} tag='h4' data-tid='amend-passenger-card-title' />

                    <ValidatableField
                        onChange={guestToEdit.editName}
                        disabled={false}
                        id={`first-name-${initialDetails.type}-${initialDetails.index}`}
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsFirstName)}
                        srLabel={`${initialDetails.firstName} ${getPhrase(
                            SitecoreDictionary.GuestDetailsLabelsFirstName,
                        )}`}
                        value={guestToEdit.tempName}
                        errors={[
                            ...nameValidationErrors,
                            ...(characterChangeLimitExceeded
                                ? [
                                      {
                                          propertyName: 'tempName',
                                          trigger: ValidationType.OnBlur,
                                      },
                                  ]
                                : []),
                        ]}
                        shouldTrimOnBlur
                        forceError={characterChangeLimitExceeded}
                        hideErrorDetails={!nameValidationErrors.length}
                        disableValidationTraking
                        onBlur={updateRemainingCharactersToChangeWithParams}
                    />
                    <ValidatableField
                        onChange={guestToEdit.editSurname}
                        disabled={false}
                        id={`surname-${initialDetails.type}-${initialDetails.index}`}
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsLastName)}
                        srLabel={`${initialDetails.firstName} ${getPhrase(
                            SitecoreDictionary.GuestDetailsLabelsLastName,
                        )}`}
                        value={guestToEdit.tempSurname}
                        errors={[
                            ...surnameValidationErrors,
                            ...(characterChangeLimitExceeded
                                ? [
                                      {
                                          propertyName: 'tempSurname',
                                          trigger: ValidationType.OnBlur,
                                      },
                                  ]
                                : []),
                        ]}
                        shouldTrimOnBlur
                        disableValidationTraking
                        forceError={characterChangeLimitExceeded}
                        hideErrorDetails={!surnameValidationErrors.length}
                        onBlur={updateRemainingCharactersToChangeWithParams}
                    />

                    <CharacterChangeWarning fields={fields} remainingCharactersToChange={remainingCharactersToChange} />
                </div>

                {!isInfant && (
                    <ValidatableSelectField
                        onChange={() => {}}
                        disabled={true}
                        id={`age-${initialDetails.type}-${initialDetails.index}`}
                        label={getPhrase(SitecoreDictionary.GlobalLabelAge)}
                        srLabel={`${initialDetails.firstName} ${getPhrase(SitecoreDictionary.GlobalLabelAge)}`}
                        value={age}
                        options={[
                            {
                                label: age,
                                value: age,
                            },
                        ]}
                        errors={[]}
                        shouldTrimOnBlur
                        disableValidationTraking
                    >
                        <AmendGuestCardCantChangeTooltip text={fields?.FieldCantBeChangedTooltipText} />
                    </ValidatableSelectField>
                )}
            </div>
            <AmendGuestCardFooter
                onCloseCard={onCardClose}
                guest={guestToEdit}
                fields={fields}
                disabled={disableSubmit}
                onRemovePassenger={onRemovePassenger}
            />
        </form>
    );

    return (
        <>
            {errorType && (
                <ErrorPopup
                    id='amend-guests-popup'
                    onClose={onPopupClose}
                    error={{
                        ...guestError,
                        errorType,
                    }}
                    fields={fields}
                />
            )}
            <Card className={styles.card}>
                <div data-tid='guest-card' className={styles.cardContentWrap}>
                    <div className={styles.cardHeader}>
                        <div className={styles.guestInfo}>
                            <JSSImage data-tid='guest-icon' className={styles.guestIcon} field={icon} />
                            <AmendGuestCardName
                                age={age}
                                ageLabel={fields?.AgedLabel.value}
                                guestToEdit={guestToEdit}
                                newName={newName}
                                prevName={prevName}
                                subtitle={subtitle}
                            />
                        </div>
                        {(!isSelected || !isScreenMedium) && (
                            <Button
                                data-tid='edit-passenger'
                                className={styles.cardHeaderEditButton}
                                isOutlined={!isEditButtonDisabled}
                                onClick={onCardOpen}
                                disabled={isEditButtonDisabled}
                                isPlaceholderShimmer={isLoadingPassengers}
                            >
                                {fields?.EditPassengerDetailsCTA?.value}
                            </Button>
                        )}
                    </div>
                    {isSelected && isScreenMedium && form}
                    {!isScreenMedium && (
                        <Drawer open={isSelected}>
                            <div data-tid='drawer-header' className={styles.drowerHeader}>
                                <Button onClick={onCardClose} className={styles.backButton} isTransparent>
                                    <SvgChevronLeft className={styles.chevron} />
                                    {fields?.BackToPassengerDetailsBtnText?.value || ''}
                                </Button>
                                {!!fields?.EditingLabel?.value && (
                                    <span className={styles.drowerHeaderPassanger}>
                                        {fields?.EditingLabel?.value + ' '}
                                        <span className={styles.drowerHeaderPassangerName}>{noTitleName}</span>
                                    </span>
                                )}
                                <JSSImage className={styles.drawerBackground} field={fields?.MobileDrawerHeaderBg} />
                            </div>
                            {form}
                        </Drawer>
                    )}
                </div>
            </Card>
        </>
    );
});
