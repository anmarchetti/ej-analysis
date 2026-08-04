import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getRoomsUrgencyMessage } from 'frontend/utils/urgencyMessage.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

export interface IUseUrgencyMessage {
    avail: number | undefined;
}

export const useUrgencyMessageText = ({
    avail,
}: IUseUrgencyMessage): { urgencyMessageText: string; urgencyMessageTooltipText: string } => {
    const { getPhrase, getSetting, isHotelDetailsBookPage } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        getSetting: stores.layoutStore.getSetting,
        isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
    }));

    const urgencyMessageText = getRoomsUrgencyMessage(avail, getPhrase, getSetting);
    const urgencyMessageTooltipText = getPhrase(
        isHotelDetailsBookPage
            ? SitecoreDictionary.HotelDetailsLabelsHurryTooltip
            : SitecoreDictionary.SearchResultsLabelsHurryTooltip,
    );

    return {
        urgencyMessageText,
        urgencyMessageTooltipText,
    };
};
