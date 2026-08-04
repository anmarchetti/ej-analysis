import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

interface INeedHelpBlockFields {
    ContactNote: ISitecoreField<string>;
    ContactNumber: ISitecoreField<string>;
    ContactText: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    ViewBookingText: ISitecoreField<string>;
}

export type TNeedHelpBlockProps = ISitecoreComponent<INeedHelpBlockFields>;

const NeedHelpBlock: FC<TNeedHelpBlockProps> = ({ fields }) => {
    const { trackHomepageAction } = useStore((stores: TStores) => ({
        trackHomepageAction: stores.trackingStore.trackHomepageAction,
    }));

    const handleNumberClick = (): void => {
        trackHomepageAction(EventTypes.NeedHelpPhone, {
            location: Title?.value || '',
            name: ContactText?.value || '',
            destination: contactNumber || '',
        });
    };

    if (!fields) {
        return null;
    }

    const { ContactNumber, ViewBookingText, Title, ContactText, ContactNote } = fields;
    const contactNumber = ContactNumber?.value;

    return (
        <div className='need-help-block' data-tid='need-help-block-wrapper'>
            {Title?.value && <Text tag='div' className='need-help-block__title' field={Title} />}
            {ContactText?.value && <Text className='need-help-block__call-text' tag='p' field={ContactText} />}
            {contactNumber && (
                <a className='need-help-block__call-link' onClick={handleNumberClick} href={`tel:${contactNumber}`}>
                    {contactNumber}
                </a>
            )}
            {ContactNote?.value && <Text tag='div' className='need-help-block__note' field={ContactNote} />}
            {ViewBookingText?.value && <RichTextWithLinks field={ViewBookingText} className='need-help-block__note' />}
        </div>
    );
};

export default NeedHelpBlock;
