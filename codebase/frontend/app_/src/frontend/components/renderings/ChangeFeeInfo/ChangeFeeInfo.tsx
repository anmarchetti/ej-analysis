import { FC, useEffect } from 'react';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { AmendmentType } from 'models/data/IBookingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

import ChangeFeeInfoDesktop from './components/ChangeFeeInfoDesktop/ChangeFeeInfoDesktop';
import ChangeFeeInfoMobile from './components/ChangeFeeInfoMobile/ChangeFeeInfoMobile';
import { useChangeFeeInfo } from './hooks/useChangeFeeInfo';

export interface IChangeFeeInfoFields {
    BucketTwoDescription: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    FeeValue: ISitecoreField<number>;
    Icon: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
    TooltipIconAriaLabelMobile: ISitecoreField<string>;
    ViewLessCTA: ISitecoreField<string>;
    ViewMoreCTA: ISitecoreField<string>;
}

export interface IChangeFeeInfoProps {
    descriptionText: string;
    fields: IChangeFeeInfoFields;
}

interface IChangeFeeInfoParams {
    type: AmendmentType;
}

export type TChangeFeeInfo = ISitecoreComponent<IChangeFeeInfoFields, IChangeFeeInfoParams>;

export const ChangeFeeInfo: FC<TChangeFeeInfo> = ({ fields }) => {
    const { formatMoney, trackChangeFeeBannerAppearedAction, amendRoomAndBoardFeePP, getPhrase } = useStore(
        (stores: IHolidaysStores) => ({
            formatMoney: stores.marketStore.formatMoney,
            amendRoomAndBoardFeePP: stores.amendRoomAndBoardStore.feePP,
            getPhrase: stores.layoutStore.getPhrase,
            trackChangeFeeBannerAppearedAction: stores.trackingStore.changeFee.changeFeeBannerAppearedAction,
            amendHotelFeePP: stores.amendHotelStore.feePP,
        }),
    );

    const isMobile = useMobileViewport();

    const { isShown, feePP } = useChangeFeeInfo(fields);

    const shouldComponentBeShown = !!feePP && !!fields && isShown;

    useEffect(() => {
        if (!shouldComponentBeShown) return;

        trackChangeFeeBannerAppearedAction(feePP);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldComponentBeShown]);

    if (!shouldComponentBeShown) return null;

    const getDescription = (): string => {
        const data = {
            description: fields?.Description.value,
            flowDictionary: '',
        };

        if (amendRoomAndBoardFeePP) {
            data.description = `${fields?.Description.value} ${fields?.BucketTwoDescription.value}`;
            data.flowDictionary = SitecoreDictionary.GlobalsLabelsRoomAndBoard;
        }

        const pricePP = formatMoney(feePP, {
            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        });
        const marketFriendlyPricePP = Tokenizer.replaceToken(
            getPhrase(SitecoreDictionary.GlobalsPriceLabelsPerPerson),
            Tokens.Price,
            pricePP,
        );

        return Tokenizer.replaceTokens(data.description, {
            [Tokens.Price]: marketFriendlyPricePP,
            [Tokens.AmendType]: getPhrase(data.flowDictionary),
        });
    };

    const description = getDescription();

    const FeeComponent = isMobile ? ChangeFeeInfoMobile : ChangeFeeInfoDesktop;

    return <FeeComponent descriptionText={description} fields={fields} />;
};

export default observer(ChangeFeeInfo);
