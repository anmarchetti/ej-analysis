import React from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import SvgCross from 'frontend/components/icons-new/Cross';
import SvgInfoFilled from 'frontend/components/icons-new/InfoFilled';

export const FlightsPreFilteredMessage = () => {
    const { getPhrase, selectedDepartureAirports, togglePreFilteredMessage } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        selectedDepartureAirports: stores.amendFlightsStore.selectedDepartureAirports,
        togglePreFilteredMessage: stores.amendFlightsStore.togglePreFilteredMessage,
    }));

    const message = Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.AmendFlightsLabelsPreFilteredResultsMessage),
        Tokens.Airport,
        selectedDepartureAirports.map(a => a.name).join(','),
    );

    const onClose = () => togglePreFilteredMessage(false);

    return (
        <div className='filters-tooltip'>
            <div className='filters-tooltip__content'>
                <span className='filters-tooltip__icon'>
                    <SvgInfoFilled />
                </span>

                <div className='filters-tooltip__message'>{message}</div>

                <Button isText className='filters-tooltip__close' onClick={onClose}>
                    <SvgCross />
                </Button>
            </div>
        </div>
    );
};

export default observer(FlightsPreFilteredMessage);
