import React from 'react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { GuestToEdit } from 'models/data/GuestToEdit';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import styles from './AmendGuestCardName.module.scss';

interface IAmendGuestCardName {
    guestToEdit: GuestToEdit;
    newName: string;
    prevName: string;
    age?: string;
    ageLabel?: string;
    subtitle?: string;
}

const AmendGuestCardName = ({ newName, prevName, guestToEdit, age, ageLabel, subtitle }: IAmendGuestCardName) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <div className={styles.guestDescription}>
            <div className={styles.guestNamesContainer}>
                <span data-tid='guest-new-name' className={styles.guestName} data-cs-mask>
                    {newName}
                </span>
                {guestToEdit.isEdited && !guestToEdit.isSelected && (
                    <span data-tid='guest-old-name' className={styles.guestNamePrevious} data-cs-mask>
                        {prevName}
                    </span>
                )}
            </div>

            {guestToEdit.initialDetails.isLead && (
                <div className={styles.guestIsLead}>
                    {getPhrase(SitecoreDictionary.BookingPassengersLabelsLeadPassenger)}
                </div>
            )}
            {!!age && (
                <span data-tid='guest-age' data-cs-mask>
                    {Tokenizer.replaceToken(ageLabel, Tokens.PassengerAge, age)}
                </span>
            )}
            {!!subtitle && (
                <span data-tid='guest-subtitle' data-cs-mask>
                    {subtitle}
                </span>
            )}
        </div>
    );
};

export default AmendGuestCardName;
