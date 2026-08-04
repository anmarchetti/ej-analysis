import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { IBookingTransitionScreenTile } from 'frontend/components/renderings/BookingTransitionScreen/BookingTransitionScreen';

import bookingTransitionScreenStyles from './bookingTransitionScreen.module.scss';

const BookingCard = ({ TileTitle, TileDescription, TileIcon }: IBookingTransitionScreenTile) => (
    <div className={bookingTransitionScreenStyles['tile']}>
        <div className={bookingTransitionScreenStyles['tile-content']}>
            {!!TileIcon.value && (
                <div className={bookingTransitionScreenStyles['tile-icon-container']}>
                    <JSSImage field={TileIcon} className={bookingTransitionScreenStyles['tile-icon']} />
                </div>
            )}
            <div>
                {!!TileTitle.value && (
                    <Text field={TileTitle} tag='h3' className={bookingTransitionScreenStyles['tile-title']} />
                )}
                {!!TileDescription.value && (
                    <RichTextWithLinks
                        field={TileDescription}
                        tag='p'
                        className={bookingTransitionScreenStyles['tile-description']}
                    />
                )}
            </div>
        </div>
    </div>
);

export default BookingCard;
