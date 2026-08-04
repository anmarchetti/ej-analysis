import React from 'react';
import classNames from 'classnames';

import { cmsUrls } from 'code/endpoints';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

export interface IFeedbackScaleItemFields {
    Icon: ISitecoreField<ISitecoreImage>;
    Name: ISitecoreField<string>;
    ScaleValue: ISitecoreField<number>;
}

interface IFeedbackScaleItemProps {
    checked: boolean;
    fields: IFeedbackScaleItemFields;
    onChange: (value: number | null) => void;

    radioGroupName: string;
}

export const FeedbackScaleItem = ({ fields, checked, radioGroupName, onChange }: IFeedbackScaleItemProps) => {
    const iconUrl = fields?.Icon?.value?.src;
    const value = Number(fields?.ScaleValue?.value);

    if (!fields || isNaN(value)) {
        return null;
    }

    return (
        <label className={classNames('feedback-scale-item', checked && 'feedback-scale-item--selected')}>
            <input
                type='radio'
                name={radioGroupName}
                value={value}
                checked={checked}
                required
                onChange={() => onChange(value)}
                onClick={() => checked && onChange(null)}
            />

            {!!iconUrl && (
                <span
                    className='feedback-scale-item__icon icon--bg-image'
                    style={{ backgroundImage: `url(${cmsUrls.media(iconUrl)})` }}
                />
            )}

            <span className='feedback-scale-item__label'>{fields.Name?.value}</span>
        </label>
    );
};

export default FeedbackScaleItem;
