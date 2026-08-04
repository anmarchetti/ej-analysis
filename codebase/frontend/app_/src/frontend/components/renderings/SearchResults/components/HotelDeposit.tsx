import { FC } from 'react';
import { inject } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { isPricePPShown } from 'frontend/utils/offer.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import PricePill from 'frontend/components/common/Pills/PricePill/PricePill';

interface IHotelDepositProps extends IComponentWithDictionary {
    countryCode: string;
    defaultDepositPrice: string;
    isPillVisible: (pillCode: SiteSettings, countryCode: string) => boolean;
    offer: Nullable<IOffer>;
    isFlightAndHotelPackage?: boolean;
    isPricePPShown?: boolean;
    isSmall?: boolean;
    tooltipMessage?: string;
}

export const HotelDeposit: FC<IHotelDepositProps> = props => {
    const hasPricePP = props.isPricePPShown ?? isPricePPShown(props.offer);

    const getDepositDictionaryKey = (isSmall: boolean | undefined, hasPricePP: boolean): string => {
        if (isSmall) {
            return hasPricePP
                ? SitecoreDictionary.BasketLabelsHotelDeposit
                : SitecoreDictionary.BasketLabelsHotelDepositOneGuest;
        }

        return hasPricePP
            ? SitecoreDictionary.SearchResultsLabelsHotelDeposit
            : SitecoreDictionary.SearchResultsLabelsHotelDepositOneGuest;
    };

    const depositDictionaryKey = getDepositDictionaryKey(props.isSmall, hasPricePP);
    const depositLabel = Tokenizer.replaceToken(
        props.getPhrase(depositDictionaryKey),
        Tokens.DepositPrice,
        props.defaultDepositPrice,
    );

    return props.isPillVisible(SiteSettings.DepositPill, props.countryCode) && !props.isFlightAndHotelPackage ? (
        <PricePill isGreen isSmall={props.isSmall} tooltipMessage={props.tooltipMessage}>
            {depositLabel}
        </PricePill>
    ) : null;
};

const ConnectedHotelDeposit = inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    isPillVisible: stores.layoutStore.isPillVisible,
    defaultDepositPrice: stores.marketStore.defaultDepositPrice,
    isFlightAndHotelPackage: isHolidayStore(stores) && stores.bookingStore.isFlightAndHotelPackage,
}))(HotelDeposit);

export default ConnectedHotelDeposit;
