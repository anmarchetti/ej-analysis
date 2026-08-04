import { useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IHoldLuggageItemFields } from 'models/data/IHoldLuggage';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ShowMoreButton from 'frontend/components/common/ShowMoreButton';
import ControlsHoldLuggagePopup from 'frontend/components/renderings/HoldLuggagePopup/components/ControlsHoldLuggagePopup/ControlsHoldLuggagePopup';
import OptionItemHoldLuggagePopup from 'frontend/components/renderings/HoldLuggagePopup/components/OptionItemHoldLuggagePopup/OptionItemHoldLuggagePopup';

import styles from './HoldLuggageSection.module.scss';

export interface IHoldLuggageSectionProps {
    LuggageItems: ISitecoreChildren<IHoldLuggageItemFields>[];
    PriceLabel: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    hideLabel: string;
    showMore: string;
    Subtitle?: ISitecoreField<string>;
    isSport?: boolean;
}

export const ITEMS_TO_SHOW_LUGGAGE = 3;
export const ITEMS_TO_SHOW_SPORT = 2;

const HoldLuggageSection = (props: IHoldLuggageSectionProps) => {
    const { Title, Subtitle, LuggageItems, PriceLabel, isSport, showMore, hideLabel } = props;
    const defaultItemsToShowCount = isSport ? ITEMS_TO_SHOW_SPORT : ITEMS_TO_SHOW_LUGGAGE;
    const [itemsToShowCount, setItemsToShowCount] = useState<number>(defaultItemsToShowCount);
    const { luggagePrices, isHoldLuggageInitialized } = useStore(({ bookingStore }: TStores) => ({
        luggagePrices: bookingStore.extraLuggage.luggagePrices,
        isHoldLuggageInitialized: bookingStore.holdLuggage.isHoldLuggageInitialized,
    }));

    if (!isHoldLuggageInitialized) {
        return null;
    }

    const items = LuggageItems.filter(({ fields: { Code } }) => luggagePrices[Code?.value]);
    const luggageCount = items?.length;

    if (!luggageCount) {
        return null;
    }

    const buttonLabel = itemsToShowCount === defaultItemsToShowCount ? showMore : hideLabel;
    const itemsToShow = items.slice(0, itemsToShowCount);

    const onCollapseClick = () => {
        if (itemsToShowCount === defaultItemsToShowCount) {
            setItemsToShowCount(luggageCount);
        } else {
            setItemsToShowCount(defaultItemsToShowCount);
        }
    };

    return (
        <div data-tid='hold-luggage-section' className={styles.holdLuggageSection}>
            <Text tag='h3' field={Title} className={styles.title} data-tid='hl-section-title' />
            {Subtitle?.value && <RichTextWithLinks field={Subtitle} className={styles.subtitle} />}
            <div>
                {itemsToShow.map(item => {
                    const { Code, Name, Icon, IsLuggageItemEnabled } = item.fields || {};

                    return (
                        <OptionItemHoldLuggagePopup
                            key={item.id}
                            name={Name?.value}
                            icon={Icon?.value?.src}
                            shouldRender={!!IsLuggageItemEnabled?.value}
                        >
                            <ControlsHoldLuggagePopup
                                code={Code?.value}
                                priceLabel={PriceLabel?.value}
                                isSport={!!isSport}
                            />
                        </OptionItemHoldLuggagePopup>
                    );
                })}
            </div>
            {luggageCount > defaultItemsToShowCount && (
                <ShowMoreButton
                    isChevronUp={itemsToShowCount !== defaultItemsToShowCount}
                    onClick={onCollapseClick}
                    title={buttonLabel}
                    className={styles.button}
                />
            )}
        </div>
    );
};

export default observer(HoldLuggageSection);
