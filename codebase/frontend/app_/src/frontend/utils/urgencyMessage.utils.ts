import { Tokens } from 'code/tokens';
import { ExperimentTestIds, ExperimentVariants } from 'models/enum/cro/Experiment';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { findTestInDataLayer } from 'frontend/components/cro/Experiment/utils/experiment.utils';

import { Tokenizer } from './tokenizer';
import { getWebStorageItem } from './webStorage.utils';

export interface IUrgencyMessageStored {
    hasUrgencyMessage: boolean;
    urgencyMessageText: string;
}
export const getRoomsUrgencyMessageVisibility = (
    getSettingAsNumber: (key: string) => number,
    availableRooms: number = 0,
): boolean => {
    // AB Test - EHD-315 - Urgency Message EUX
    const activeTest = findTestInDataLayer(ExperimentTestIds.UrgencyEUX);

    if (!availableRooms || activeTest?.testVariant === ExperimentVariants.VariantA) {
        return false;
    }

    return availableRooms <= getSettingAsNumber(SiteSettings.UrgencyMessageMaxRooms);
};

export const getRoomsUrgencyMessage = (
    availableRooms: number = 0,
    getPhrase: (key: string) => string,
    getSetting: (key: string) => number,
): string => {
    if (!getRoomsUrgencyMessageVisibility(getSetting, availableRooms)) {
        return '';
    }

    return availableRooms > 1
        ? Tokenizer.replaceToken(
              getPhrase(SitecoreDictionary.SearchResultsLabelsHurrys),
              Tokens.Avail,
              availableRooms.toString(),
          )
        : getPhrase(SitecoreDictionary.SearchResultsLabelsHurry);
};

export const getCabinBagsUrgencyMessage = (): string | null =>
    getSessionStoredUrgencyMessage(WebStorageKeys.CabinBagsUrgencyMessageText);

export const getSeatsUrgencyMessage = (): string | null =>
    getSessionStoredUrgencyMessage(WebStorageKeys.SeatUrgencyMessageText);

export const getSessionStoredUrgencyMessage = (key: WebStorageKeys): string | null => {
    const urgencyMessage = getWebStorageItem<IUrgencyMessageStored>(key, true, sessionStorage);

    return urgencyMessage?.hasUrgencyMessage ? urgencyMessage.urgencyMessageText : null;
};
