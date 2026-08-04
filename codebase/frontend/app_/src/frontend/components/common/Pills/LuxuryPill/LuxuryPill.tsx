import { FC } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SvgLuxuryGradient from 'frontend/components/icons-new/LuxuryGradient';

import styles from './LuxuryPill.module.scss';

export type TLuxuryPillProps = {
    className?: string;
    isLabelVisible?: boolean;
};

export const LuxuryPill: FC<TLuxuryPillProps> = ({ isLabelVisible = true, className }) => {
    const { getPrase } = useStore(({ layoutStore }: TStores) => ({
        getPrase: layoutStore.getPhrase,
    }));

    return (
        <div className={classNames(styles.includedLux, className)} data-tid='luxury-pill'>
            <SvgLuxuryGradient />
            {isLabelVisible && <div className={styles.label}>{getPrase(SitecoreDictionary.LuggageLabelsIncluded)}</div>}
        </div>
    );
};

export default LuxuryPill;
