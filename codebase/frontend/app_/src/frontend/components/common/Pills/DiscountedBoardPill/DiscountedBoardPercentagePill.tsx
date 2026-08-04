import classNames from 'classnames';
import { observer } from 'mobx-react';

import { ONE_HUNDRED } from 'code/commonNumbers';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import Pill from 'frontend/components/common/Pills/Pill/Pill';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import SvgCup from 'frontend/components/icons-new/Cup';

import styles from './DiscountedBoardPill.module.scss';

export interface IDiscountedBoardPercentagePillProps {
    large?: boolean;
    medium?: boolean;
    percent?: number;
}

const DiscountedBoardPercentagePill = (props: IDiscountedBoardPercentagePillProps): React.ReactElement | null => {
    const { isDisabled, getPhrase } = useStore(stores => ({
        isDisabled: !stores.layoutStore.getSetting(SiteSettings.IsFreeBoardUpgradePillEnabled),
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const { percent = 0, large, medium } = props;

    if (isDisabled || percent <= 0 || percent === ONE_HUNDRED) return null;

    const rounded = large || medium;

    const title = Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.PillsLabelsDiscountedBoardPercentage),
        Tokens.Discount,
        percent.toString(),
    );

    return (
        <div className={classNames({ [styles.wrapper]: rounded, [styles.large]: large, [styles.medium]: medium })}>
            <Pill
                contentClass={styles.pill}
                iconClass={styles.iconWrapper}
                icon={rounded ? <IconInfoCircle /> : <SvgCup />}
                title={rounded ? undefined : title}
                text={getPhrase(SitecoreDictionary.PillsTooltipsDiscountedBoard)}
            />
            {rounded && <span className={styles.text}>{title}</span>}
        </div>
    );
};

export default observer(DiscountedBoardPercentagePill);
