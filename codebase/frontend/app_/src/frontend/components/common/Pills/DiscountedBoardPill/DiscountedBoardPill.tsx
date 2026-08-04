import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import Pill from 'frontend/components/common/Pills/Pill/Pill';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import SvgCup from 'frontend/components/icons-new/Cup';

import styles from './DiscountedBoardPill.module.scss';

export interface IDiscountedBoardPillProps {
    className?: string;
    large?: boolean;
}

const DiscountedBoardPill = ({ large, className }: IDiscountedBoardPillProps): React.ReactElement | null => {
    const { isDisabled, getPhrase } = useStore(stores => ({
        isDisabled: !stores.layoutStore.getSetting(SiteSettings.IsFreeBoardUpgradePillEnabled),
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (isDisabled) return null;

    return (
        <div className={classNames({ [styles.wrapper]: large, [styles.large]: large }, className)}>
            <Pill
                ellipsis
                contentClass={styles.pill}
                iconClass={styles.iconWrapper}
                icon={large ? <IconInfoCircle /> : <SvgCup />}
                title={large ? undefined : getPhrase(SitecoreDictionary.PillsLabelsDiscountedBoard)}
                text={getPhrase(SitecoreDictionary.PillsTooltipsDiscountedBoard)}
            />
            {large && <span className={styles.text}>{getPhrase(SitecoreDictionary.PillsLabelsDiscountedBoard)}</span>}
        </div>
    );
};

export default observer(DiscountedBoardPill);
