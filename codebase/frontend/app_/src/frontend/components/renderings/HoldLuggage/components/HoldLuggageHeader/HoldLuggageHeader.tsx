import { FC, useMemo } from 'react';
import { RichText, Text } from '@sitecore-jss/sitecore-jss-react';
import { observer } from 'mobx-react-lite';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getIsSportEquipmentAvailableSeason } from 'frontend/utils/luggage.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import AncillariesHeader from 'frontend/components/common/Ancillaries/components/AncillariesHeader/AncillariesHeader';
import JSSImage from 'frontend/components/common/JSSImage';
import { IHoldLuggageFields } from 'frontend/components/renderings/HoldLuggage/IHoldLuggageFields';

import styles from './HoldLuggageHeader.module.scss';

export interface IHoldLuggageHeaderProps {
    fields: IHoldLuggageFields;
    luggageCount: number;
}

export const HoldLuggageHeader: FC<IHoldLuggageHeaderProps> = ({ fields, luggageCount }) => {
    const {
        extraLuggage,
        isFlightExtrasFailed,
        isConfirmationPage,
        extraLuggageCategoriesExist,
        travelDate,
        isLuxuryPackage,
    } = useStore(({ bookingStore, layoutStore }: TStores) => ({
        extraLuggage: bookingStore.extraLuggage,
        isFlightExtrasFailed: bookingStore.isFlightExtrasFailed,
        isConfirmationPage: layoutStore.isConfirmationPage,
        extraLuggageCategoriesExist: bookingStore.extraLuggageCategoriesExist,
        travelDate: bookingStore.travelDate,
        isLuxuryPackage: bookingStore.isLuxuryPackage,
    }));

    const { defaultBagsNumber, defaultBagsOneDirection, isHoldLuggageAvailable, isSportsEquipmentAvailable } =
        extraLuggage;
    const {
        Title,
        HoldLuggageAndSportsSubtitle,
        HoldLuggageSubtitle,
        SportsSubtitle,
        OutboundAndReturnIcon,
        OutboundAndReturnTextMultiple,
        OutboundAndReturnTextSingular,
        RequestFailureAltSubtitle,
        NoDefaultBagsSubtitle,
        SportEquipmentRestrictedSeasons,
        HoldLuggageLuxurySubtitle,
    } = fields || {};
    const { RestrictionSeasonsList } = SportEquipmentRestrictedSeasons?.fields || {};

    const subtitle = useMemo(() => {
        if (isConfirmationPage) return;

        let field = HoldLuggageAndSportsSubtitle;
        const isSEAvailableSeason = getIsSportEquipmentAvailableSeason(RestrictionSeasonsList, travelDate);
        const isSEAvailable = isSportsEquipmentAvailable && isSEAvailableSeason;

        if (isLuxuryPackage) {
            field = HoldLuggageLuxurySubtitle;
        } else if (!defaultBagsNumber) {
            field = NoDefaultBagsSubtitle;
        } else if (isFlightExtrasFailed || !extraLuggageCategoriesExist) {
            field = RequestFailureAltSubtitle;
        } else if (isHoldLuggageAvailable && isSEAvailable) {
            field = HoldLuggageAndSportsSubtitle;
        } else if (isHoldLuggageAvailable) {
            field = HoldLuggageSubtitle;
        } else if (isSEAvailable) {
            field = SportsSubtitle;
        }

        if (field && defaultBagsNumber) {
            const defaultBag = defaultBagsOneDirection[0];

            field.value = Tokenizer.replaceToken(
                field.value,
                Tokens.Number,
                defaultBag?.name?.match(/\d+/g)?.pop() || '',
            );
        }

        return field;
    }, [
        HoldLuggageAndSportsSubtitle,
        HoldLuggageSubtitle,
        RequestFailureAltSubtitle,
        SportsSubtitle,
        isFlightExtrasFailed,
        extraLuggageCategoriesExist,
        isHoldLuggageAvailable,
        isSportsEquipmentAvailable,
        NoDefaultBagsSubtitle,
        defaultBagsOneDirection,
        defaultBagsNumber,
    ]);

    if (!fields || Object.keys(fields).length === 0) {
        return null;
    }

    const itemCountLabel = Tokenizer.replaceTokens(OutboundAndReturnTextMultiple?.value, {
        [Tokens.Count]: luggageCount.toString(),
    });

    return (
        <AncillariesHeader title={Title} dataTid='hold-luggage-header' description={subtitle}>
            <div className={styles.container} data-tid='container'>
                {!!OutboundAndReturnIcon?.value && (
                    <JSSImage field={OutboundAndReturnIcon} className={styles.icon} data-tid='icon' />
                )}

                {(luggageCount === 0 || luggageCount > 1) && itemCountLabel && (
                    <RichText
                        field={{ value: itemCountLabel }}
                        tag='span'
                        className={styles.text}
                        data-tid='hold-luggage-details-multiple'
                    />
                )}
                {luggageCount === 1 && !!OutboundAndReturnTextSingular.value && (
                    <Text
                        field={OutboundAndReturnTextSingular}
                        tag='span'
                        className={styles.text}
                        data-tid='hold-luggage-details-singular'
                    />
                )}
            </div>
        </AncillariesHeader>
    );
};

export default observer(HoldLuggageHeader);
