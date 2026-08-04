import { FC } from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { PillSizeVariants } from 'frontend/components/common/Pills/PillWithVariants/PillSizeVariants';
import PillWithVariants from 'frontend/components/common/Pills/PillWithVariants/PillWithVariants';

import styles from './DiscountPercentagePill.module.scss';

interface IDiscountPercentagePillProps {
    icon: JSX.Element;
    discountPercentage?: number;
    pillSize?: PillSizeVariants;
}

export const DiscountPercentagePill: FC<IDiscountPercentagePillProps> = ({ icon, discountPercentage, pillSize }) => {
    const { getPhrase, isDiscountPercentagePillEnabled } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        isDiscountPercentagePillEnabled: stores.layoutStore.isDiscountPercentagePillEnabled,
    }));

    if (!isDiscountPercentagePillEnabled || !discountPercentage) {
        return null;
    }

    const content = {
        icon: icon,
        text: Tokenizer.replaceTokens(getPhrase(SitecoreDictionary.DiscountForHBGHotelsText), {
            [Tokens.Number]: discountPercentage.toString(),
        }),
        tooltipMessage: getPhrase(SitecoreDictionary.DiscountForHBGHotelsTooltip),
    };

    return (
        <PillWithVariants
            content={content}
            dataIdPrefix='discount-percentage'
            pillSize={pillSize}
            pillClass={styles.pill}
        />
    );
};

export default observer(DiscountPercentagePill);
