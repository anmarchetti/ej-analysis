import * as React from 'react';
import classNames from 'classnames';
import { inject } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';

import Callout from './Callout/Callout';

interface ISponsoredBadgeProps extends IComponentWithDictionary {
    className?: string;
    text?: string;
}

const SponsoredBadge = (props: ISponsoredBadgeProps) => (
    <div className={classNames('sponsored-badge', props.className)}>
        <span>{props.text || props.getPhrase(SitecoreDictionary.SearchResultsLabelsSponsoredTitle)}</span>
        <Callout
            content={<div>{props.getPhrase(SitecoreDictionary.SearchResultsLabelsSponsoredDescription)}</div>}
            orientation={CalloutOrientation.Top}
            position={CalloutPosition.Center}
            isShownOnHover
            calculateWidth
        />
    </div>
);

export default inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
}))(SponsoredBadge);
