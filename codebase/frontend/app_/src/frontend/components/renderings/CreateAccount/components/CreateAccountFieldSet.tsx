import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

export interface ICreateAccountFieldSetProps {
    children: any;
    description: ISitecoreField<string>;
    title: ISitecoreField<string>;
    disabled?: boolean;
}

export const CreateAccountFieldSet: React.FC<ICreateAccountFieldSetProps> = ({
    title,
    description,
    children,
    disabled,
}) => (
    <fieldset disabled={disabled}>
        {!!title && (
            <Text
                className={classNames(
                    'create-account__fieldset-title',
                    !description?.value && 'create-account__fieldset-title--delimiter',
                )}
                tag='legend'
                field={title}
            />
        )}
        {!!description && (
            <RichTextWithLinks className='create-account__fieldset-description' tag='div' field={description} />
        )}
        {children}
    </fieldset>
);
