import { FunctionComponent, useEffect, useState } from 'react';

import { IDestinationHighlightTabItem } from 'models/data/IDestinationHighlightTabItem';

import DestinationHighlightsTabPanel from './components/DestinationHighlightsTabPanel';
import DestinationHighlightsTabs from './components/DestinationHighlightsTabs/DestinationHighlightsTabs';

interface IDestinationHighlightsProps {
    fields: { Children: IDestinationHighlightTabItem[] };
}

export const DestinationHighlights: FunctionComponent<IDestinationHighlightsProps> = ({ fields = {} }) => {
    const { Children = [] } = fields;
    const [activeTabId, setActiveTabId] = useState<string | undefined>(Children?.[0]?.id);

    useEffect(() => {
        if (!!Children.length) {
            setActiveTabId(Children[0].id);
        }
    }, [Children]);

    if (!Children.length) return null;

    return (
        <div className='destinations-highlights destination-highlights--region'>
            <DestinationHighlightsTabs tabs={Children} activeTabId={activeTabId} setActiveTabId={setActiveTabId} />

            {Children.map(item => (
                <DestinationHighlightsTabPanel tabItem={item} key={item.id} isActiveTab={item.id === activeTabId} />
            ))}
        </div>
    );
};

export default DestinationHighlights;
