import { FC } from 'react';

import TextWithTooltip from 'frontend/components/common/TextWithTooltip/TextWithTooltip';
import SvgCross from 'frontend/components/icons-new/Cross';
import SvgInfoLined from 'frontend/components/icons-new/InfoLined';
import SvgTick from 'frontend/components/icons-new/Tick';
import { IClaimFormItemFields } from 'frontend/components/renderings/ClaimForm/interfaces';

import styles from './ClaimFormItem.module.scss';

export type TClaimFormItemProps = IClaimFormItemFields & {
    isEligibleItem?: boolean;
};
const ClaimFormItem: FC<TClaimFormItemProps> = ({ ItemText, ItemTooltip, isEligibleItem }) => (
    <div className={styles.item} data-tid='claim-form-item'>
        {isEligibleItem ? <SvgTick className={styles.eligibleIcon} /> : <SvgCross className={styles.notEligibleIcon} />}
        <TextWithTooltip
            wrapperClassName={styles.text}
            tooltipMessage={ItemTooltip.value}
            message={ItemText.value}
            icon={
                <i className={styles.tooltipIcon}>
                    <SvgInfoLined />
                </i>
            }
        />
    </div>
);

export default ClaimFormItem;
