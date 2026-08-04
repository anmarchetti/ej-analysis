import { FC } from 'react';
import { observer } from 'mobx-react';

import { ICalloutProps } from 'frontend/components/common/Callout/Callout';
import StickyBox from 'frontend/components/common/StickyBox';
import { IAmendDatesSummaryFields } from 'frontend/components/renderings/AmendDatesSummary/AmendDatesSummary';
import AmendDatesSummaryContinueBtn from 'frontend/components/renderings/AmendDatesSummary/components/AmendDatesSummaryContinueBtn/AmendDatesSummaryContinueBtn';
import AmendSummaryBasket from 'frontend/components/renderings/AmendDatesSummary/components/AmendSummaryBasket/AmendSummaryBasket';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';

import styles from './AmendSummaryStickyHeader.module.scss';

interface IAmendSummaryStickyHeaderProps {
    fields: IAmendDatesSummaryFields;
    calloutProps?: ICalloutProps;
}

const AmendSummaryStickyHeader: FC<IAmendSummaryStickyHeaderProps> = ({ fields, calloutProps }) => (
    <StickyBox
        render={() => (
            <div className={styles.header}>
                <ComponentWrapper>
                    <div className={styles.content}>
                        <AmendSummaryBasket fields={fields} calloutProps={calloutProps} />
                        <AmendDatesSummaryContinueBtn />
                    </div>
                </ComponentWrapper>
            </div>
        )}
    />
);

export default observer(AmendSummaryStickyHeader);
