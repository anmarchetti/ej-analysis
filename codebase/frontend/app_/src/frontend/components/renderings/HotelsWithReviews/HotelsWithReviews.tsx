import { FC, useMemo } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import ShowMorePanel from 'frontend/components/common/ShowMore/ShowMorePanel';

import HotelItem from './HotelItem';

import styles from './HotelsWithReviews.module.scss';

export interface IHotelItem {
    HotelRating: number;
    Name: string;
    StarRating: number;
    TotalNumberOfReviews: number;
    url: string;
    EcoFacility?: {
        Name?: string;
        Tooltip?: string;
    };
}

interface IHotelItems {
    items: IHotelItem[];
}

type THotelItemProps = ISitecoreComponent<IHotelItems>;
const DESKTOP_ITEMS_AMOUNT = 12;
const TABLET_ITEMS_AMOUNT = 6;

const HotelsWithReviews: FC<THotelItemProps> = ({ fields }) => {
    const { getPhrase, country, isScreenLessMedium } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        country: stores.layoutStore.displayName,
    }));

    const { items } = fields || {};

    const [visibleDestinations, hiddenDestinations] = useMemo(() => {
        const ARRAY_SPLIT = !isScreenLessMedium ? DESKTOP_ITEMS_AMOUNT : TABLET_ITEMS_AMOUNT;
        const hotels = items || [];

        return [hotels?.slice(0, ARRAY_SPLIT), hotels?.slice(ARRAY_SPLIT)];
    }, [items, isScreenLessMedium]);

    const title = `${getPhrase(SitecoreDictionary.GlobalsTitlesHotelsIn)} ${country}`;

    if (items && items?.length <= 0) return null;

    return (
        <div className={styles.wrapper}>
            <h3 className={styles.title} data-tid='hotels-title'>
                {title}
            </h3>
            <ShowMorePanel
                Component={HotelItem}
                visibleItems={visibleDestinations}
                hiddenItems={hiddenDestinations}
                bodyClass={styles.items}
                id='hotels'
            />
        </div>
    );
};

export default observer(HotelsWithReviews);
