import React from 'react';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

interface IManageCookiesPreferencesFields {
    Text: ISitecoreField<string>;
}

type TManageCookiesPreferencesProps = ISitecoreComponent<IManageCookiesPreferencesFields>;

const ManageCookiesPreferences = (props: TManageCookiesPreferencesProps) => {
    if (!props.fields?.Text) {
        return null;
    }

    const onLinkClick = (e: MouseEvent) => {
        e.preventDefault();
        // Open Ensighten Modal
        try {
            Bootstrapper.gateway.openModal();
        } catch (e) {}
    };

    return <RichTextWithLinks field={props.fields.Text} onLinkClick={onLinkClick} />;
};

export default ManageCookiesPreferences;
