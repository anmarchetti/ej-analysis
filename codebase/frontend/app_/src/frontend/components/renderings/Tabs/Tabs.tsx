import * as React from 'react';

import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';

import type { TAnchorFields } from './components/Anchor';
import Anchors from './components/Anchors';

export type TTabsFields = {
    CTA: ISitecoreField<ISitecoreLink>;
    Children: ISitecoreChildren<TAnchorFields>[];
};

export type TTabsParams = {
    IsSticky: boolean;
};

export type TTabsProps = ISitecoreComponent<TTabsFields, TTabsParams>;

const Tabs: React.FC<TTabsProps> = ({ fields, params }) => {
    if (!fields) {
        return null;
    }

    const { IsSticky } = params;
    const { Children, CTA } = fields;

    return <Anchors items={Children} isSticky={IsSticky} link={CTA} />;
};

export default Tabs;
