import React from 'react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ViewAllCardBackground from './ViewAllCardBackground';

import styles from './ViewAllCard.module.scss';

interface IViewAllCardProps {
    href: string;
}

export const ViewAllCard = ({ href }: IViewAllCardProps) => {
    const { getPhrase, destination } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        destination: stores.searchStore.searchTo.destinationsDisplayValue.main,
    }));

    return (
        <div className={styles.card}>
            <ViewAllCardBackground />
            <div className={styles.content}>
                <h3 className={styles.title}>
                    {getPhrase(SitecoreDictionary.IframePromotingHolidaysTitlesWhatYouLookedFor)}
                </h3>
                <p className={styles.subtitle}>
                    {Tokenizer.replaceToken(
                        getPhrase(SitecoreDictionary.IframePromotingHolidaysLabelsViewAllHolidaysForDestination),
                        Tokens.Destination,
                        destination,
                    )}
                </p>
            </div>

            <a
                className='btn btn--full-width text-truncate'
                href={href}
                target='_blank'
                rel='noreferrer'
                data-tid='view-all-link'
            >
                {getPhrase(SitecoreDictionary.IframePromotingHolidaysButtonsViewAllHolidays)}
            </a>
        </div>
    );
};

export default ViewAllCard;
