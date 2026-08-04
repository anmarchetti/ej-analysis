import React, { useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import Callout from 'frontend/components/common/Callout/Callout';
import Checkbox from 'frontend/components/common/Checkbox';
import ValidatableDateField from 'frontend/components/common/ValidatableDateField';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import ValidatableSelectField from 'frontend/components/common/ValidatableSelectField';
import ValidatableTextarea from 'frontend/components/common/ValidatableTextarea/ValidatableTextarea';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import styles from 'frontend/components/renderings/TradePortalGroupBooking/components/GroupBookingForm/GroupBookingForm.module.scss';
import { GroupBookingFormFields } from 'frontend/components/renderings/TradePortalGroupBooking/data/GroupBooking';
import { useGroupBookingStore } from 'frontend/components/renderings/TradePortalGroupBooking/store/createStore';
import { ITradePortalGroupBookingFields } from 'frontend/components/renderings/TradePortalGroupBooking/TradePortalGroupBooking';

interface IGroupBookingAgentInformationProps {
    fields: ITradePortalGroupBookingFields;
}

const GroupBookingAgentInformation = ({ fields }: IGroupBookingAgentInformationProps) => {
    const {
        DepartureDateLabel,
        DurationOfHolidayLabel,
        DurationOfHolidayNote,
        IsFlexibleLabel,
        IsFlexibleTooltipContent,
        DestinationLabel,
        DestinationNote,
        AdditionalDetailsLabel,
        AdditionalDetailsPlaceholder,
        DepartureAirportLabel,
        DepartureAirportsList,
        BoardsList,
        BoardsNote,
        BoardsLabel,
    } = fields;

    const { groupBooking, forceErrors } = useGroupBookingStore();
    const [dateFocused, setDateFocused] = useState(false);

    const airports = DepartureAirportsList.map(el => ({
        value: el?.fields?.Name?.value,
        label: el?.fields?.Name?.value,
    }));

    const boards = BoardsList.map(el => ({
        value: el?.fields?.Value?.value,
        label: el?.fields?.Value?.value,
    }));

    const onDateBlur = () => {
        setDateFocused(false);
    };

    const onDateFocus = () => {
        setDateFocused(true);
    };

    if (!groupBooking) {
        return null;
    }

    return (
        <div className={styles.formSectionHolidayInformation} data-tid='group-booking-holiday-information'>
            <ValidatableSelectField
                id={GroupBookingFormFields.DepartureAirport}
                label={DepartureAirportLabel?.value ?? ''}
                onChange={value => groupBooking.onChangeField(GroupBookingFormFields.DepartureAirport, value)}
                value={groupBooking.departureAirport}
                options={airports}
                errors={groupBooking.validateField(GroupBookingFormFields.DepartureAirport)}
                isVertical
                required={groupBooking.isFieldRequired(GroupBookingFormFields.DepartureAirport)}
                forceError={forceErrors}
                isGroupBooking
            />

            <div className={styles.checkboxContainer}>
                <Checkbox
                    label={IsFlexibleLabel?.value ?? ''}
                    medium
                    textRight
                    tick
                    checked={groupBooking.isFlexible}
                    onChange={value => groupBooking.onChangeCheckboxField(GroupBookingFormFields.IsFlexible, value)}
                    dataTid='flexible-checkbox'
                />

                <Callout
                    content={<div>{IsFlexibleTooltipContent?.value ?? ''}</div>}
                    orientation={CalloutOrientation.Right}
                    position={CalloutPosition.Center}
                    isShownOnHover
                >
                    <i className={styles.moreInfo}>
                        <IconInfoCircle />
                    </i>
                </Callout>
            </div>

            <ValidatableDateField
                onChange={value => groupBooking.onChangeField(GroupBookingFormFields.DepartureDate, value)}
                value={groupBooking.departureDate}
                label={DepartureDateLabel?.value ?? ''}
                errors={groupBooking.validateField(GroupBookingFormFields.DepartureDate)}
                forceError={forceErrors}
                id={GroupBookingFormFields.DepartureDate}
                autoComplete={false}
                shouldTrimOnBlur
                required={groupBooking.isFieldRequired(GroupBookingFormFields.DepartureDate)}
                isVertical
                onBlur={onDateBlur}
                onFocus={onDateFocus}
                shouldMoveCursor
                hideWatermark={!dateFocused}
            />

            <ValidatableField
                onChange={value => groupBooking.onChangeField(GroupBookingFormFields.Duration, value)}
                value={groupBooking.duration}
                label={DurationOfHolidayLabel?.value ?? ''}
                errors={groupBooking.validateField(GroupBookingFormFields.Duration)}
                forceError={forceErrors}
                id={GroupBookingFormFields.Duration}
                autoComplete={false}
                shouldTrimOnBlur
                required={groupBooking.isFieldRequired(GroupBookingFormFields.Duration)}
                isVertical
                inputMode='numeric'
                note={
                    <Text
                        field={DurationOfHolidayNote}
                        className={styles.formSectionAdditionalDescription}
                        tag='p'
                        data-tid='holiday-information-additional-description-duration'
                    />
                }
            />

            <ValidatableSelectField
                id={GroupBookingFormFields.Boards}
                label={BoardsLabel?.value ?? ''}
                onChange={value => groupBooking.onChangeField(GroupBookingFormFields.Boards, value)}
                value={groupBooking.boards}
                options={boards}
                errors={groupBooking.validateField(GroupBookingFormFields.Boards)}
                isVertical
                required={groupBooking.isFieldRequired(GroupBookingFormFields.Boards)}
                forceError={forceErrors}
                isGroupBooking
                isMultiSelect
                note={
                    <Text
                        field={BoardsNote}
                        className={styles.formSectionAdditionalDescription}
                        tag='p'
                        data-tid='holiday-information-additional-description-board-basis'
                    />
                }
            />

            <ValidatableField
                onChange={value => groupBooking.onChangeField(GroupBookingFormFields.Destination, value)}
                value={groupBooking.destination}
                label={DestinationLabel?.value ?? ''}
                errors={groupBooking.validateField(GroupBookingFormFields.Destination)}
                forceError={forceErrors}
                id={GroupBookingFormFields.Destination}
                autoComplete={false}
                shouldTrimOnBlur
                required={groupBooking.isFieldRequired(GroupBookingFormFields.Destination)}
                isVertical
                note={
                    <Text
                        field={DestinationNote}
                        className={styles.formSectionAdditionalDescription}
                        tag='p'
                        data-tid='holiday-information-additional-description-destination'
                    />
                }
            />

            <ValidatableTextarea
                id={GroupBookingFormFields.AdditionalDetails}
                label={AdditionalDetailsLabel?.value ?? ''}
                value={groupBooking.additionalDetails}
                onChange={value => groupBooking.onChangeField(GroupBookingFormFields.AdditionalDetails, value)}
                errors={groupBooking.validateField(GroupBookingFormFields.AdditionalDetails)}
                required={groupBooking.isFieldRequired(GroupBookingFormFields.AdditionalDetails)}
                textareaClass={styles['form-textarea']}
                maxCharacters={200}
                forceError={forceErrors}
                isVertical
                placeholder={AdditionalDetailsPlaceholder?.value ?? ''}
            />
        </div>
    );
};

export default observer(GroupBookingAgentInformation);
