import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import FakeInput from 'frontend/components/common/FakeInput/FakeInput';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import IconCalendar from 'frontend/components/icons/Calendar';
import CalendarWrapper from 'frontend/components/renderings/ContactUs/components/CalendarWrapper';
import styles from 'frontend/components/renderings/ContactUs/ContactForm.module.scss';

export interface IContactFormDatePickerProps {
    clearDates: () => void;
    dateOfHoliday: string;
    monthLimit: number;
    placeholder: string;
    text: ISitecoreField<string>;
    title: ISitecoreField<string>;
    toggle: () => void;
}

const ContactFormDatePicker: FC<IContactFormDatePickerProps> = ({
    dateOfHoliday,
    clearDates,
    toggle,
    placeholder,
    title,
    text,
    monthLimit,
}) => (
    <Popup
        containerClass={`popup-search-pod popup-search-pod__promo ${styles['date-picker-popup']}`}
        aria-labelledby='popup-search-pod'
        onClose={toggle}
    >
        <Text field={title} className='popup-search-pod__title' id='popup-search-pod-title' tag='h2' />
        <RichTextWithLinks field={text} className='popup-search-pod__subtitle' tag='div' />
        <div className='popup-search-pod__form search-bar sbv3 search-bar-box'>
            <div className='search-bar__input-wr' style={{ maxWidth: '400px', margin: '20px auto 0' }}>
                <FakeInput
                    id='date-picker-field'
                    placeholderIcon={<IconCalendar />}
                    placeholder={placeholder}
                    value={dateOfHoliday}
                    showClearButton
                    onClearButtonClick={clearDates}
                />
            </div>
        </div>
        <div className='popup-search-pod__body search-bar-box search-bar sbv3'>
            <CalendarWrapper monthLimit={monthLimit} />
        </div>
    </Popup>
);

export default ContactFormDatePicker;
