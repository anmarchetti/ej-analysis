import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

export interface ITabs {
    accessor: string;
    label: string;
}

interface ITabBarProps {
    activeTab: string;
    onClick: (tab: any) => void;
    tabs: ITabs[];
    tabClass?: string;
}

const TabBar = observer(({ activeTab, tabs, onClick, tabClass }: ITabBarProps) => (
    <div className='anchors-box' data-tid='anchors-box'>
        {tabs.map((el: any, index) => (
            <span
                key={`${el.label}_${index}`}
                className={classNames('anchor', tabClass, activeTab === el.accessor && 'anchor--active')}
                onClick={(): void => onClick(el.accessor)}
                data-tid={activeTab === el.accessor ? 'anchor' : 'anchor-active'}
            >
                {el.label}
            </span>
        ))}
    </div>
));

export default TabBar;
