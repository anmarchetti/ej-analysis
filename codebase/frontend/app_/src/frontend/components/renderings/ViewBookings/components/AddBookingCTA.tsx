import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';
import { IViewBookingsSitecoreFields } from 'frontend/components/renderings/ViewBookings/ViewBookings';

import styles from './AddBookingCTA.module.scss';

interface IAddBookingCTAProps extends IComponentWithDictionary {
    fields: IViewBookingsSitecoreFields;
    toggleAddBooking: () => void;
}

const AddBookingCTA: FC<IAddBookingCTAProps> = ({ getPhrase, fields, toggleAddBooking }) => {
    const { AddBookingCTAText } = fields;

    return (
        <div
            className={classNames(styles.container, 'wrapper-component-container', 'wrapper-component-container--grey')}
            data-tid='add-booking-cta'
        >
            <div className='wrapper-component-container__inner'>
                <div className={styles.row}>
                    {AddBookingCTAText && (
                        <Text tag='div' className={styles.addBookingCTAText} field={AddBookingCTAText} />
                    )}
                    <div className={styles.addBookingCTA}>
                        <Button isLarge onClick={toggleAddBooking} dataTid='add-booking-button-cta'>
                            {getPhrase(SitecoreDictionary.ViewBookingsButtonsAddBooking)}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddBookingCTA;
