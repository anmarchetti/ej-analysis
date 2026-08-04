import { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { TLeftHandFilterStoreInstance } from 'frontend/components/common/LeftHandFilter/FilterContent/models';

import { addScrollbarToParentIfNeeded, renderContent } from './GroupContent.utils';

import styles from './GroupContent.module.scss';

export interface IFilterContentProps {
    code: FilterGroupCodes;
    storeInstance: TLeftHandFilterStoreInstance;
}

const GroupContent: FC<IFilterContentProps> = ({ code, storeInstance }) => (
    <div className={classNames(styles.filterGroupContainer, 'filter-group', 'filter-group--open')}>
        <div className={styles.dynamicScrollbar}>
            <div
                id={code}
                className={classNames(styles.filterGroup, 'filter-group__values', 'filter-group__values--active')}
                style={{ display: 'block' }}
                ref={addScrollbarToParentIfNeeded}
            >
                {renderContent(code, storeInstance)}
            </div>
        </div>
    </div>
);

export default observer(GroupContent);
