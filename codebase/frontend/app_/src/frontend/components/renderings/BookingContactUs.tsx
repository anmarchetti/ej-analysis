import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

interface IBookingContactUsFields {
    Phone: ISitecoreField<string>;
    PhoneText: ISitecoreField<string>;
    Text: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

type TBookingContactUsProps = ISitecoreComponent<IBookingContactUsFields>;

const BookingContactUs: React.FC<TBookingContactUsProps> = ({ fields }) => (
    <div className='rounded-container'>
        <div className='booking-help'>
            <Text field={fields?.Title} tag='h2' className='booking-help__title' />
            <Text field={fields?.PhoneText} tag='p' className='booking-help__text booking-help__text--orange' />
            <Text field={fields?.Phone} tag='a' href={`tel:${fields?.Phone.value}`} className='booking-help__tel' />
            <RichTextWithLinks field={fields?.Text} tag='p' className='booking-help__text' />
        </div>
    </div>
);

export default BookingContactUs;
