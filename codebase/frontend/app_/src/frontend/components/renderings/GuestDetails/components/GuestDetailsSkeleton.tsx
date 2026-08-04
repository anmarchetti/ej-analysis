import classNames from 'classnames';

import { ONE } from 'code/commonNumbers';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SvgUserFilled from 'frontend/components/icons-new/UserFilled';

import GuestDetailsHeader from './section/GuestDetailsHeader';

import styles from './GuestDetailsSkeleton.module.scss';

const GuestDetailsSkeleton: React.FC = () => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <div className={styles.wrapper}>
            <GuestDetailsHeader
                title={`${getPhrase(SitecoreDictionary.GuestDetailsSectionHeadersAdult)} ${ONE}`}
                secondaryText={`(${getPhrase(SitecoreDictionary.GuestDetailsSectionHeadersLeadGuest)})`}
                icon={<SvgUserFilled />}
                isExpanded
            />

            <div className={styles.content}>
                <div className={classNames(styles.field, 'placeholder-shimmer')} />
                <div className={classNames(styles.field, 'placeholder-shimmer')} />
            </div>
        </div>
    );
};

export default GuestDetailsSkeleton;
