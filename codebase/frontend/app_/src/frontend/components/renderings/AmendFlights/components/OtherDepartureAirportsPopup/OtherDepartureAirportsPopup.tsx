import React from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import Checkbox from 'frontend/components/common/Checkbox';
import { Popup } from 'frontend/components/common/Popup';

import styles from './OtherDepartureAirportsPopup.module.scss';

interface IOtherDepartureAirportsPopupProps {
    airportName: string;
}

export const OtherDepartureAirportsPopup = ({ airportName }: IOtherDepartureAirportsPopupProps) => {
    const {
        departureAirports,
        selectedDepartureAirports,
        getPhrase,
        toggleOtherDepartureAirportsPopup,
        isFilterSelected,
        onSelectFilter,
        redirectToAmendFlightsPage,
    } = useStore((stores: IHolidaysStores) => ({
        departureAirports: stores.amendFlightsStore.departureAirports,
        selectedDepartureAirports: stores.amendFlightsStore.selectedDepartureAirports,
        getPhrase: stores.layoutStore.getPhrase,
        toggleOtherDepartureAirportsPopup: stores.amendFlightsStore.toggleOtherDepartureAirportsPopup,
        onSelectFilter: stores.amendFlightsStore.onSelectFilter,
        isFilterSelected: stores.amendFlightsStore.isFilterSelected,
        redirectToAmendFlightsPage: stores.routerStore.redirectToAmendFlightsPage,
    }));

    const title = Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.AmendFlightsOtherAirportsPopupLabelsTitle),
        Tokens.Airport,
        airportName,
    );
    const description = Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.AmendFlightsOtherAirportsPopupLabelsDescription),
        Tokens.Airport,
        airportName,
    );

    const onClose = () => toggleOtherDepartureAirportsPopup(false);

    const onApplyAirports = (event?: React.MouseEvent | React.FormEvent) => {
        event?.preventDefault();

        redirectToAmendFlightsPage();
        onClose();
    };

    return (
        <Popup
            containerClass={styles.container}
            title={title}
            onClose={onClose}
            showCloseButton
            isContentCentered
            bodyClass={styles.popupBody}
            contentClass={styles.popupContent}
        >
            <form onSubmit={onApplyAirports}>
                {!!description && <p className='my-0'>{description}</p>}

                <div className={styles.airportCheckboxes}>
                    {departureAirports
                        .filter(airport => airport.count > 0)
                        .map(airport => (
                            <div className={styles.airportCheckbox} key={airport.code}>
                                <Checkbox
                                    checked={isFilterSelected(airport)}
                                    onChange={() => onSelectFilter(airport)}
                                    tick
                                    medium
                                >
                                    {airport.name}
                                </Checkbox>
                            </div>
                        ))}
                </div>
                <div className={styles.popupButtons}>
                    <Button
                        isMedium
                        disabled={!selectedDepartureAirports.length}
                        type='submit'
                        dataTid='amend-flights-popup-submit'
                    >
                        {getPhrase(SitecoreDictionary.AmendFlightsOtherAirportsPopupButtonsSeeFlights)}
                    </Button>
                    <Button isOutlined isMedium type='button' onClick={onClose} dataTid='amend-flights-popup-cancel'>
                        {getPhrase(SitecoreDictionary.AmendFlightsOtherAirportsPopupButtonsCancel)}
                    </Button>
                </div>
            </form>
        </Popup>
    );
};

export default observer(OtherDepartureAirportsPopup);
