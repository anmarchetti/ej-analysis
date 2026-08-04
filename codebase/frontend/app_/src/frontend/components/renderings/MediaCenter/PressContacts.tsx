import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

interface IPressContactsFields {
    Contact1?: ISitecoreField<string>;
    Contact2?: ISitecoreField<string>;
    Title?: ISitecoreField<string>;
}

export type TPressContactsProps = ISitecoreComponent<IPressContactsFields>;

const PressContacts = (props: TPressContactsProps) => {
    if (!props.fields) {
        return null;
    }

    return (
        <div className='wrapper--solid'>
            <div className='wrapper-container wrapper-container--px pb-0'>
                <div className='press-contacts'>
                    {!!props.fields.Title && <Text field={props.fields.Title} tag='h4' />}
                    <ul>
                        {!!props.fields.Contact1 && (
                            <li data-tid='press-contacts-contact1'>
                                <div dangerouslySetInnerHTML={{ __html: props.fields.Contact1.value }} />
                            </li>
                        )}
                        {!!props.fields.Contact2 && (
                            <li data-tid='press-contacts-contact2'>
                                <div dangerouslySetInnerHTML={{ __html: props.fields.Contact2.value }} />
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};
export default PressContacts;
