import { FunctionComponent } from 'react';
import classnames from 'classnames';

import { SignDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import BlockSelected from 'frontend/components/common/BlockSelected';
import Button from 'frontend/components/common/Button';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';

import { getFormattedPriceLabel } from './RoomCardAction.utils';

import styles from './RoomCardAction.module.scss';

export interface IRoomCardActionProps {
    price: number;
    className?: string;
    isLoading?: boolean;
    isPriceVisible?: boolean;
    isSelected?: boolean;
    noPriceDictionary?: SitecoreDictionary;
    onClick?: () => void;
    pricePostfix?: SitecoreDictionary;
}

const RoomCardAction: FunctionComponent<IRoomCardActionProps> = ({
    isSelected,
    onClick,
    isLoading,
    isPriceVisible,
    price,
    pricePostfix,
    className,
    noPriceDictionary = SitecoreDictionary.AlternativeFlightsButtonsSelect,
}) => {
    const { getPhrase, formatMoney } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const formattedPrice = getFormattedPriceLabel(
        formatMoney(price, {
            maximumFractionDigits: 0,
            signDisplay: SignDisplay.ExceptZero,
        }),
        price,
    );

    return (
        <div className={classnames(className)} data-tid='room-card-action'>
            {isSelected && (
                <BlockSelected
                    siteCoreKey={SitecoreDictionary.RoomTypesLabelsSelected}
                    className={styles.selectedCta}
                />
            )}
            {!isSelected && (
                <Button
                    onClick={onClick}
                    dataTid='select-room-button'
                    disabled={isLoading}
                    isLoading={isLoading}
                    isMedium
                    isFullWidth
                    aria-label={formattedPrice}
                    className={styles.cta}
                >
                    {isPriceVisible && (
                        <PriceLabel
                            tag='span'
                            price={
                                <div>
                                    <span className={styles.price} data-tid='room-price'>
                                        {formattedPrice}
                                    </span>
                                    {!!pricePostfix && (
                                        <span className={styles.priceLabel} data-tid='room-price-postfix'>
                                            {getPhrase(pricePostfix)}
                                        </span>
                                    )}
                                </div>
                            }
                        />
                    )}
                    {!isPriceVisible && getPhrase(noPriceDictionary)}
                </Button>
            )}
        </div>
    );
};

export default RoomCardAction;
