import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { callChatBot } from 'frontend/utils/viewBooking.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { IContactChannelFields } from 'frontend/components/renderings/ContactUsBanner/ContactUsBanner';

import styles from './ContactUsChannel.module.scss';

export interface IContactUsChannelProps {
    fields: IContactChannelFields;
    onClose: () => void;
}

const ContactUsChannel: FC<IContactUsChannelProps> = ({ fields, onClose }) => {
    const { booking, buildContactUsFormQuery, getPhrase } = useStore(stores => ({
        booking: stores.viewBookingStore.booking,
        buildContactUsFormQuery: stores.queryParamStore.buildContactUsFormQuery,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const { Title, Description, OpenChatBot, Key } = fields;

    const contactFormLink = getPhrase(SitecoreDictionary.GenericLinkToContactFormHTML);

    const descriptionToShow = {
        value: Tokenizer.replaceToken(Description.value, Tokens.ContactFormLink, contactFormLink),
    };

    const onRichTextLinkClick = (e: MouseEvent): void => {
        const { href } = e.target as HTMLAnchorElement;
        const isContactFormLink = new RegExp(Tokens.ContactFormLink).test(Description.value);

        if (booking && isContactFormLink) {
            e.preventDefault();

            const urlParams = buildContactUsFormQuery(booking);

            window.open(href + urlParams);
        }

        if (OpenChatBot?.value || (e.target as HTMLElement).id === 'live-chat-btn') {
            callChatBot(e);
            onClose();
        }
    };

    return (
        <div data-tid={Key?.value || 'contact-us-item'}>
            <Text field={Title} className={styles.title} tag='h5' data-tid={'contact-us-item-title'} />
            <RichTextWithLinks
                className={styles.description}
                field={descriptionToShow}
                onLinkClick={onRichTextLinkClick}
                enableClickEventForEmptyLinks
                dataId='contact-us-item-description'
            />
        </div>
    );
};

export default observer(ContactUsChannel);
