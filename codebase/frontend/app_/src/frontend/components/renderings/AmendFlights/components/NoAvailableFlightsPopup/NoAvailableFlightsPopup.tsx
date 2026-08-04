import React, { FunctionComponent } from 'react';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './NoAvailableFlightsPopup.module.scss';

export interface INoAvailableFlightsPopupProps {
    arrAirportName: string;
    date: string;
    depAirportName: string;
}

export const NoAvailableFlightsPopup: FunctionComponent<INoAvailableFlightsPopupProps> = ({
    date,
    depAirportName,
    arrAirportName,
}) => {
    const { getPhrase, toggleNoAvailableFlightsPopup } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        toggleNoAvailableFlightsPopup: stores.amendFlightsStore.toggleNoAvailableFlightsPopup,
    }));

    const onClose = () => toggleNoAvailableFlightsPopup(false);

    const title = Tokenizer.replaceTokens(
        getPhrase(SitecoreDictionary.AmendFlightsNoAvailableFlightsPopupLabelsTitle),
        { [Tokens.Destination]: arrAirportName },
    );
    const description = Tokenizer.replaceTokens(
        getPhrase(SitecoreDictionary.AmendFlightsNoAvailableFlightsPopupLabelsDescriptionHTML),
        { [Tokens.Date]: formatDateL10n(date, DATE_FORMATS.L), [Tokens.Airport]: depAirportName },
    );

    return (
        <Popup showCloseButton isContentCentered onClose={onClose} title={title}>
            {!!description && <RichTextWithLinks field={{ value: description }} />}
            <RichTextWithLinks
                className={styles.popupButtons}
                onLinkClick={onClose}
                field={{
                    value: getPhrase(SitecoreDictionary.AmendFlightsNoAvailableFlightsPopupButtonsContactUsHTML),
                }}
            />
        </Popup>
    );
};

export default observer(NoAvailableFlightsPopup);
