import { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import JSSImage from 'frontend/components/common/JSSImage';

import styles from './AmendPaymentItemContainer.module.scss';

export interface IAmendPaymentItemContainerProps {
    children: React.ReactNode;
    className?: string;
    hideCta?: boolean;
    icon?: ISitecoreField<ISitecoreImage>;
    onContinue?: () => void;
    title?: ISitecoreField<string>;
}

const AmendPaymentItemContainer: FunctionComponent<IAmendPaymentItemContainerProps> = ({
    children,
    onContinue,
    icon,
    title,
    hideCta,
    className,
}) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const label = getPhrase(SitecoreDictionary.GlobalsButtonsContinue);
    const shouldRenderTitle = !!icon || !!title;

    return (
        <div className={classNames(styles.container, className)} data-tid='accordion-container'>
            {shouldRenderTitle && (
                <div className={styles.header}>
                    <JSSImage field={icon} className={styles.icon} dataTid='accordion-container-icon' />
                    <Text field={title} className={styles.title} tag='h3' data-tid='accordion-title' />
                </div>
            )}

            {children}

            {!hideCta && (
                <div className={styles.cta}>
                    <Button onClick={onContinue} isMedium>
                        {label}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default observer(AmendPaymentItemContainer);
