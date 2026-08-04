import { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { BigVariantPillAlignment } from 'models/enum/PromoBlocksBigVariantParams';
import { TouristTaxGenericTooltip } from 'frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip';

import styles from './PromoBlockItemBigPill.module.scss';

export interface IPromoBlockItemBigPillProps {
    pillPrice: string;
    pillText: string;
    alignment?: BigVariantPillAlignment;
}

export const PromoBlockItemBigPill: FC<IPromoBlockItemBigPillProps> = ({ pillText, pillPrice, alignment }) => {
    const { isTouristTaxEnabled } = useStore((stores: TStores) => ({
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
    }));

    if (!pillText) {
        return null;
    }

    const shouldShowTouristTaxTooltip = isTouristTaxEnabled && !!pillPrice;

    const pillContent = shouldShowTouristTaxTooltip
        ? pillText.split(Tokens.PillPrice).flatMap((part, index, arr) => {
              const isLastPart = index === arr.length - 1;

              if (isLastPart) {
                  return part;
              }

              return [
                  part,
                  <TouristTaxGenericTooltip key={`tooltip-${part}`} triggerClassName={styles.tooltip}>
                      {pillPrice}
                  </TouristTaxGenericTooltip>,
              ];
          })
        : Tokenizer.replaceToken(pillText, Tokens.PillPrice, pillPrice);

    return (
        <div
            className={classNames(styles.pill, {
                [styles.pillLeft]: alignment === BigVariantPillAlignment.Left,
            })}
            data-tid='pill-wrapper'
        >
            <span className={styles.pillText} data-tid='promo-block-pill'>
                {pillContent}
            </span>
        </div>
    );
};

export default observer(PromoBlockItemBigPill);
