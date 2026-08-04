import { FC, ReactNode } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import { DATA_TID_PREFIX as DATA_TID } from 'frontend/components/common/PriceBreakdown/PriceBreakdown.utils';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';
import SvgChevronUp from 'frontend/components/icons-new/ChevronUp';

import styles from './PriceBreakdownStickyBar.module.scss';

export interface IPriceBreakdownStickyBarProps {
    isMobileDrawerOpened: boolean;
    toggleMobileDrawer: () => void;
    transactionAmount: string;
    paidToUsTextNode?: ReactNode;
    paymentField?: ISitecoreField<string>;
    title?: ISitecoreField<string>;
}

const PriceBreakdownStickyBar: FC<IPriceBreakdownStickyBarProps> = ({
    title,
    paymentField,
    transactionAmount,
    isMobileDrawerOpened,
    toggleMobileDrawer,
    paidToUsTextNode,
}) => (
    <div
        className={classNames(styles.stickyFooter, !isMobileDrawerOpened && styles.stickyFooterShadow)}
        data-tid={`${DATA_TID}-mobile-footer`}
    >
        <Button className={styles.openButton} isText onClick={toggleMobileDrawer} dataTid={`${DATA_TID}-toggle-button`}>
            {isMobileDrawerOpened ? <SvgChevronDown /> : <SvgChevronUp />}
            <Text tag='span' field={title} data-tid={`${DATA_TID}-title`} />
        </Button>

        <div className={styles.amountDue} data-tid={`${DATA_TID}-summary`}>
            <div className={styles.leftColumn}>
                <Text tag='span' field={paymentField} data-tid={`${DATA_TID}-payment-instructions`} />
                {paidToUsTextNode}
            </div>

            <span className={styles.price} data-tid={`${DATA_TID}-transaction-amount`}>
                {transactionAmount}
            </span>
        </div>
    </div>
);

export default PriceBreakdownStickyBar;
