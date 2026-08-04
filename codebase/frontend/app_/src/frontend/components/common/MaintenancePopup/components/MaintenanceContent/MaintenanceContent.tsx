import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { isTradeStore } from 'frontend/store/tradePortal';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SvgCogs from 'frontend/components/icons-new/Cogs';

import styles from './MaintenanceContent.module.scss';

const MaintenanceContent = () => {
    const { getPhrase, isTrade } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        isTrade: isTradeStore(stores),
    }));

    return (
        <div className={classNames(styles.wrapper, isTrade && 'isTrade')} data-tid='maintenance-content'>
            <SvgCogs />
            <p className={styles.title}>{getPhrase(SitecoreDictionary.MaintenancePopupLabelsTitle)}</p>
            <p className={styles.description}>
                {getPhrase(SitecoreDictionary.MaintenancePopupLabelsFirstParagraph)}
                <br />
                {getPhrase(SitecoreDictionary.MaintenancePopupLabelsSecondParagraph)}
            </p>
        </div>
    );
};

export default MaintenanceContent;
