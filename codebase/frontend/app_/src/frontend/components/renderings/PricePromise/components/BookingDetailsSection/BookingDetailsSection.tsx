import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { PricePromiseInfoFields } from 'models/data/PricePromiseInfo';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import Callout from 'frontend/components/common/Callout/Callout';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ValidatableDateField from 'frontend/components/common/ValidatableDateField';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import { IPricePromiseFields } from 'frontend/components/renderings/PricePromise/interfaces';
import styles from 'frontend/components/renderings/PricePromise/PricePromise.module.scss';
import { getFieldLabel, isFieldRequired } from 'frontend/components/renderings/PricePromise/pricePromise.utils';
import { PricePromiseStore } from 'frontend/components/renderings/PricePromise/PricePromiseStore';

export type TBookingDetailsSectionProps = {
    fields: IPricePromiseFields;
    store: PricePromiseStore;
};

export const BookingDetailsSection: FC<TBookingDetailsSectionProps> = ({ store, fields }) => {
    const {
        BookingReferenceTooltip,
        BookingDetailsSectionTitle,
        NameFieldLabel,
        BookingReferenceFieldLabel,
        BookingDepartureFieldLabel,
    } = fields;
    const { onChangeField, validateField } = store.pricePromiseInfo;
    const isNameFieldRequired = isFieldRequired(PricePromiseInfoFields.Name, store);
    const isBookingReferenceFieldRequired = isFieldRequired(PricePromiseInfoFields.BookingReference, store);
    const isDepartureDateFieldRequired = isFieldRequired(PricePromiseInfoFields.DepartureDate, store);

    return (
        <>
            <Text className={styles.sectionTitle} tag='h3' field={BookingDetailsSectionTitle} />

            <ValidatableField
                onChange={(value): void => onChangeField(PricePromiseInfoFields.Name, value)}
                value={store.pricePromiseInfo.name}
                label={getFieldLabel(NameFieldLabel.value, isNameFieldRequired)}
                errors={validateField(PricePromiseInfoFields.Name)}
                forceError={store.forceErrors}
                id={PricePromiseInfoFields.Name}
                autoComplete={false}
                shouldTrimOnBlur
                required={isNameFieldRequired}
                containerClass={styles.fieldMargin}
            />

            <ValidatableField
                onChange={(value): void => onChangeField(PricePromiseInfoFields.BookingReference, value)}
                value={store.pricePromiseInfo.bookingReference}
                label={getFieldLabel(BookingReferenceFieldLabel.value, isBookingReferenceFieldRequired)}
                errors={validateField(PricePromiseInfoFields.BookingReference)}
                forceError={store.forceErrors}
                id={PricePromiseInfoFields.BookingReference}
                autoComplete={false}
                shouldTrimOnBlur
                fieldClass={BookingReferenceTooltip?.value ? 'form-field--inner-callout' : undefined}
                required={isBookingReferenceFieldRequired}
                inputMode='numeric'
            >
                {BookingReferenceTooltip.value && (
                    <Callout
                        content={<RichTextWithLinks field={BookingReferenceTooltip} />}
                        orientation={CalloutOrientation.Top}
                        position={CalloutPosition.Center}
                        isShownOnHover
                    />
                )}
            </ValidatableField>

            <ValidatableDateField
                onChange={(value): void => onChangeField(PricePromiseInfoFields.DepartureDate, value)}
                value={store.pricePromiseInfo.departureDate}
                label={getFieldLabel(BookingDepartureFieldLabel.value, isDepartureDateFieldRequired)}
                errors={validateField(PricePromiseInfoFields.DepartureDate)}
                forceError={store.forceErrors}
                id={PricePromiseInfoFields.DepartureDate}
                autoComplete={false}
                inputContainerClass='form-control__label--focused'
                shouldMoveCursor
                required={isDepartureDateFieldRequired}
            />
        </>
    );
};

export default observer(BookingDetailsSection);
