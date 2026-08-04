import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TouristTaxGenericTooltip } from 'frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

import styles from './MonthViewDisclaimers.module.scss';

interface IMonthViewDisclaimersProps {
    cheapestMonthTestId: string;
}

const MonthViewDisclaimers: FC<IMonthViewDisclaimersProps> = ({ cheapestMonthTestId }) => {
    const { isTouristTaxEnabled, getPhrase } = useStore((stores: TStores) => ({
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const { fields: { CheapestMonthDescriptionLabel } = {} } = useSearchPodStore();

    return (
        <div className={styles.disclaimersWrapper}>
            <Text
                field={CheapestMonthDescriptionLabel}
                tag='p'
                className={styles.cheapestMonthDescription}
                data-tid={cheapestMonthTestId}
            />

            {isTouristTaxEnabled && (
                <TouristTaxGenericTooltip triggerClassName={styles.taxInfo}>
                    <span>{getPhrase(SitecoreDictionary.TouristTaxLabelsPricesIncludeLocalTax)}</span>
                </TouristTaxGenericTooltip>
            )}
        </div>
    );
};

export default MonthViewDisclaimers;
