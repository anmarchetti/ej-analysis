import { FC } from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import RouterLink from 'frontend/components/common/RouterLink';

interface IViewAllHolidaysProps {
    link: string;
}

const ViewAllHolidays: FC<IViewAllHolidaysProps> = props => {
    const {
        getPhrase,
        destinationsParentDisplayValue,
        fetchOffers,
        updateDataLayer,
        clearFilters,
        grabSearchValuesFromSearchStore,
        loadAllDestinations,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        destinationsParentDisplayValue: stores.searchStore.searchTo.destinationsParentDisplayValue,
        fetchOffers: stores.hotelsStore.fetchOffers,
        updateDataLayer: stores.trackingStore.searchSortUpdateTrigger,
        clearFilters: stores.searchFiltersStore.onClearAllFilters,
        grabSearchValuesFromSearchStore: stores.bookingStore.grabSearchValuesFromSearchStore,
        loadAllDestinations: stores.searchStore.searchTo.loadAllDestinations,
    }));

    const onClickButton = async (): Promise<void> => {
        clearFilters();
        /* need call loadAllDestinations for find parent destination and set to selectedDestination */
        await loadAllDestinations(true);
        grabSearchValuesFromSearchStore();
        await fetchOffers(true, true, true);
        updateDataLayer();
    };

    const destination = destinationsParentDisplayValue.main;
    const title = getPhrase(SitecoreDictionary.IframePromotingHolidaysTitlesWhatYouLookedFor);
    const description = Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.IframePromotingHolidaysLabelsViewAllHolidaysForDestination),
        Tokens.Destination,
        destination,
    );
    const buttonText = getPhrase(SitecoreDictionary.IframePromotingHolidaysButtonsViewAllHolidays);

    return (
        <div className='view-all-block'>
            <h3 className='view-all-block__title'>{title}</h3>
            <p>{description}</p>

            <RouterLink
                link={{ value: { href: props.link || '' } }}
                onClick={onClickButton}
                className='btn btn--large btn--full-width'
            >
                {buttonText}
            </RouterLink>
        </div>
    );
};

export default observer(ViewAllHolidays);
