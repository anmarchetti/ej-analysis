import * as React from 'react';
import { inject } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { IAnchorParameters } from 'models/data/IAnchorParameters';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import Anchors, { TAnchorsProps } from './components/Anchors';

interface IAnchorsBrowseFields extends TAnchorsProps {
    TotalNumberOfReviews: ISitecoreField<string>;
}

interface IAnchorsBrowseParams extends ISitecoreComponent<IAnchorsBrowseFields, IAnchorParameters> {
    layout: ISitecoreLayout;
}

const TabsBrowse = ({ fields, layout }: IAnchorsBrowseParams) => {
    if (!fields) {
        return null;
    }

    const { TotalNumberOfReviews } = layout.sitecore.route.fields || {};
    const reviews = TotalNumberOfReviews && parseInt(TotalNumberOfReviews.value);

    return <Anchors items={fields.items} reviews={reviews} />;
};

const ConnectedTabsBrowse = inject((stores: TStores) => ({
    layout: stores.layoutStore.layout,
}))(TabsBrowse);

export default ConnectedTabsBrowse;
