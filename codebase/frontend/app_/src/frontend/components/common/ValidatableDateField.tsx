import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import { DATE_FORMATS, DateLocalizedFormats } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { getLocalizedFormatValue, isLocalizedFormat, watermarkDate } from 'frontend/utils/date.utils';

import ValidatableField, { IValidatableFieldProps } from './ValidatableField/ValidatableField';

interface IValidatableDateFieldProps extends IValidatableFieldProps {
    dateFormat?: string | DateLocalizedFormats;
    hideWatermark?: boolean;
}

export const ValidatableDateField = ({
    dateFormat = DATE_FORMATS.inputField,
    hideWatermark,
    ...fieldProps
}: IValidatableDateFieldProps) => {
    const { dateLocale } = useStore(stores => ({
        dateLocale: stores.layoutStore.dateLocale,
    }));

    // If dateFormat is localized, need to get format for current locale, else use it as it's.
    const [watermark, setWatermark] = useState<string>(() => (isLocalizedFormat(dateFormat) ? '' : dateFormat));

    const onChange = (newValue: string) => {
        const maskedValue = watermarkDate(fieldProps.value, newValue, watermark);
        fieldProps.onChange(maskedValue);
    };

    /** Don't allow to enter more characters then watermark length  */
    const blockInputChange = (value: string) => (watermark ? value.length > watermark.length : false);

    /**
     * If dateFormat is localized, get format for current locale.
     * Pass dateLocale to dependencies, as localized format depends on it.
     */
    useEffect(() => {
        if (isLocalizedFormat(dateFormat)) {
            const watermark = getLocalizedFormatValue(dateFormat);
            setWatermark(watermark);
        }
    }, [dateLocale, dateFormat]);

    return (
        <ValidatableField
            {...fieldProps}
            onChange={onChange}
            watermark={hideWatermark ? '' : watermark}
            blockChange={blockInputChange}
            inputMode='numeric'
        />
    );
};

export default observer(ValidatableDateField);
