import React from 'react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { getNumberOfGuestsByCategory } from 'frontend/utils/guestsValidation';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IOffer } from 'models/data/IOffer';
import { ISelectOption } from 'models/data/ISelectOption';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import AmendmentSort from 'frontend/components/common/Amend/AmendmentSort/AmendmentSort';

interface IOtherRoutesPopupHeaderProps {
    offer: IOffer;
    onFlightsSort: (sortBy: AlternativeFlightsSortBy) => void;
    selectedSortOption?: ISelectOption | undefined;
    sortBy?: AlternativeFlightsSortBy;
    sortOptions?: ISelectOption[];
}

export const OtherRoutesPopupHeader = ({
    offer,
    onFlightsSort,
    selectedSortOption,
    sortBy,
    sortOptions,
}: IOtherRoutesPopupHeaderProps) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const formattedDate = formatDateL10n(offer.date, 'D MMM YYYY');
    const region = offer.hotel?.resort?.name || '';
    const rooms = offer.accom?.unit;
    const guests = rooms?.length
        ? getNumberOfGuestsByCategory(
              getPhrase,
              rooms.reduce((total, room) => total + room.occupation.adults, 0),
              rooms.reduce((total, room) => total + room.occupation.children, 0),
              rooms.reduce((total, room) => total + room.occupation.infants, 0),
          )
        : '';

    const title = Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.SearchResultsLabelsOtherRoutesTo),
        Tokens.Region,
        region,
    );

    const subTitle = Tokenizer.replaceTokens(getPhrase(SitecoreDictionary.SearchResultsLabelsMoreAvailableFlightsTo), {
        [Tokens.Region]: `<b>${region}</b>`,
        [Tokens.Date]: `<b>${formattedDate}</b>`,
        [Tokens.Guests]: `<b>${guests}</b>`,
    });

    return (
        <div className='pop-up_header'>
            <div className='sort-order-wrapper'>
                <div>
                    <h2 className='title'>{title}</h2>

                    <p
                        className='sub-title'
                        data-tid='other-routes-subtitle'
                        dangerouslySetInnerHTML={{ __html: subTitle }}
                    />
                </div>
                <div className='sort-order'>
                    {sortOptions && sortBy && (
                        <AmendmentSort
                            options={sortOptions}
                            selectedSortOption={selectedSortOption}
                            sortBy={sortBy}
                            onChangeSortBy={onFlightsSort}
                            selectClassName='sort-order-select'
                            wrapperClassName='alternative-flights__sort'
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default OtherRoutesPopupHeader;
