import { FC, useEffect } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import { setBodyOverflow } from 'frontend/utils/ui.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import LoadingAnimation from 'frontend/components/common/LoadingAnimation/LoadingAnimation';
import { IBookingTransitionScreenFields } from 'frontend/components/renderings/BookingTransitionScreen/BookingTransitionScreen';

import BookingCard from './BookingCard';

import bookingTransitionScreenStyles from './bookingTransitionScreen.module.scss';

const BookingTransition: FC<IBookingTransitionScreenFields> = ({ Tiles, Title, Subtitle }) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    useEffect(() => {
        setBodyOverflow('hidden');

        return () => setBodyOverflow('');
    }, []);

    return (
        <div className={bookingTransitionScreenStyles['overlay']}>
            <div className={bookingTransitionScreenStyles['overlay-dialog']}>
                <div className={bookingTransitionScreenStyles['tiles-wrapper']}>
                    <div className={bookingTransitionScreenStyles['title-container']}>
                        {!!Title.value && (
                            <Text field={Title} tag='h2' className={bookingTransitionScreenStyles['title']} />
                        )}
                    </div>
                    <div className={bookingTransitionScreenStyles['tiles']}>
                        {!!Tiles.length && Tiles.map((tile, i) => <BookingCard key={i} {...tile.fields} />)}
                    </div>
                </div>
                <LoadingAnimation className={bookingTransitionScreenStyles['animation-container']} />
                <p className={bookingTransitionScreenStyles['description']}>
                    {Subtitle?.value || getPhrase(SitecoreDictionary.SearchPodFiltersPromoPageLabelsLoadingTitle)}
                </p>
            </div>
        </div>
    );
};

export default BookingTransition;
