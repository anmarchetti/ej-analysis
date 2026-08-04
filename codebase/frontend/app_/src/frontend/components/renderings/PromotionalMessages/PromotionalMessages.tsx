import { FC } from 'react';
import { observer } from 'mobx-react';

import { getLangByCMSLang } from 'code/cmsLang';
import { cmsUrls } from 'code/endpoints';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getDate, getDaysDifferenceRoundedFloor } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IOffer } from 'models/data/IOffer';
import { IPromotionalMessageItem } from 'models/data/IPromotionalMessageItem';
import { IRoute } from 'models/data/IRoute';
import ImageWithFilter, { SVGFilterMatrix } from 'frontend/components/common/ImageWithFilter/ImageWithFilter';
import Pill from 'frontend/components/common/Pills/Pill/Pill';
import BestPrice from 'frontend/components/icons-new/BestPrice';

import {
    Colors,
    NUMBER_OF_DAYS_BEFORE_DEPARTURE,
    PROMOTIONAL_MESSAGES_DATA_TID,
    PROMOTIONAL_MESSAGES_VISIBILITY_SETTINGS,
    PromotionalMessagesTypes,
} from './constants';

import styles from './PromotionalMessages.module.scss';

export interface IPromotionalMessagesProps {
    fields: { items: IPromotionalMessageItem[] };
    offer: IOffer;
    routeDep: IRoute;
}

const PromotionalMessages: FC<IPromotionalMessagesProps> = ({ routeDep, fields, offer }) => {
    const { isPillVisible, getDefaultDepositPrice, lang } = useStore((stores: IHolidaysStores) => ({
        isPillVisible: stores.layoutStore.isPillVisible,
        getDefaultDepositPrice: stores.marketStore.getDefaultDepositPrice,
        lang: stores.layoutStore.lang,
    }));

    const items = fields?.items;
    const { deposit, hotel } = offer;
    const countryCode = hotel?.country?.code;

    const getPromoMessageFilterMatrix = (promoMessageItem: IPromotionalMessageItem): SVGFilterMatrix =>
        promoMessageItem.fields?.Color?.value === Colors.Grey ? SVGFilterMatrix.Grayscale : SVGFilterMatrix.Green;

    const isMessageVisible = (item: IPromotionalMessageItem): boolean => {
        const itemVisibilitySetting = PROMOTIONAL_MESSAGES_VISIBILITY_SETTINGS[getItemType(item)];

        return !countryCode || !itemVisibilitySetting ? true : isPillVisible(itemVisibilitySetting, countryCode);
    };

    const getItemType = (item: IPromotionalMessageItem): string => item.fields?.Type?.value || '';

    const getItemByType = (type: string): IPromotionalMessageItem | undefined =>
        items.find(item => getItemType(item) === type);

    const getPromoMessagesToRender = (): IPromotionalMessageItem[] => {
        if (!items?.length) return [];

        const promoMessages = [] as IPromotionalMessageItem[];
        const daysDifference = getDaysDifferenceRoundedFloor(getDate(routeDep.depDate), new Date());
        const isMore28DaysBeforeDep = daysDifference >= NUMBER_OF_DAYS_BEFORE_DEPARTURE;

        if (!!deposit && deposit > 0 && isMore28DaysBeforeDep) {
            const depositItem = getItemByType(PromotionalMessagesTypes.Deposit);

            if (depositItem) {
                const updatedDepositItem = updateDepositItemTitle(depositItem, offer);
                promoMessages.push(updatedDepositItem);
            }
        }

        const withConfidence = getItemByType(
            isMore28DaysBeforeDep
                ? PromotionalMessagesTypes.WithConfidenceMore28
                : PromotionalMessagesTypes.WithConfidenceLess28,
        );
        !!withConfidence && promoMessages.push(withConfidence);

        return (promoMessages || []).filter(item => isMessageVisible(item));
    };

    const updateDepositItemTitle = (item: IPromotionalMessageItem, offer: IOffer): IPromotionalMessageItem => {
        const offerLang = getLangByCMSLang(offer.shortlist?.language || '') || lang;
        const updatedTitle = Tokenizer.replaceToken(
            item.fields?.Title.value,
            Tokens.DepositPrice,
            getDefaultDepositPrice(offerLang),
        );

        return {
            ...item,
            fields: {
                ...item.fields,
                Title: {
                    ...item.fields?.Title,
                    value: updatedTitle,
                },
            },
        } as IPromotionalMessageItem;
    };

    const messages = getPromoMessagesToRender();

    return (
        <div className={styles.wrapper} data-tid='promotional-messages-wrapper'>
            {messages.map(item => {
                const bestPrice = item.fields?.Type?.value === PromotionalMessagesTypes.WithConfidenceLess28;

                const isGreen = item.fields?.Color?.value === Colors.Green;

                return (
                    <div key={item.id} data-tid={PROMOTIONAL_MESSAGES_DATA_TID[getItemType(item)]}>
                        <Pill
                            contentClass={isGreen ? styles.greenContent : styles.grayContent}
                            titleClass={isGreen ? styles.greenTitle : styles.grayTitle}
                            icon={
                                bestPrice ? (
                                    <BestPrice />
                                ) : (
                                    <ImageWithFilter
                                        imageSrc={cmsUrls.media(item.fields?.Icon?.value?.src as string)}
                                        filterMatrix={getPromoMessageFilterMatrix(item)}
                                    />
                                )
                            }
                            title={item.fields?.Title?.value}
                            text={item.fields?.Tooltip?.value}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default observer(PromotionalMessages);
