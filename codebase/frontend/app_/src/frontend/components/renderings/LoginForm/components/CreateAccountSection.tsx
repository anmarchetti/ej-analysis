import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import RouterLink from 'frontend/components/common/RouterLink';

import styles from './CreateAccountSection.module.scss';

interface ICreateAccountSectionProps {
    className?: string;
    customButton?: any;
    onLinkClick?: (e: React.MouseEvent) => void;
}

const CreateAccountSection = ({ customButton, onLinkClick, className }: ICreateAccountSectionProps) => {
    const { getPhrase, getSetting } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        getSetting: stores.layoutStore.getSetting,
    }));

    const link = getSetting(SiteSettings.CreateAccountLink);

    return (
        <div className={classNames(styles.container, className)}>
            <h3 className={styles.title}>{getPhrase(SitecoreDictionary.LoginLabelsDontHaveAccount)}</h3>
            <p className={styles.description}>{getPhrase(SitecoreDictionary.LoginLabelsDontHaveAccountDescription)}</p>
            {customButton ? (
                customButton
            ) : (
                <>
                    {!!link?.Url && (
                        <RouterLink
                            className={classNames('btn btn--outlined btn--full-width', styles.btn)}
                            link={{
                                value: {
                                    href: link.Url,
                                    url: link.Url,
                                    linktype: link.LinkType,
                                    target: link.Target,
                                    text: link.Text,
                                },
                            }}
                            onClick={onLinkClick}
                        >
                            {getPhrase(SitecoreDictionary.LoginButtonsCreateAccount)}
                        </RouterLink>
                    )}
                </>
            )}
        </div>
    );
};

export default observer(CreateAccountSection);
