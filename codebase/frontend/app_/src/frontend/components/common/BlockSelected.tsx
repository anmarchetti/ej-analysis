import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import SvgTick from 'frontend/components/icons-new/Tick';

export interface IBlockSelectedProps {
    className?: string;
    customSvg?: React.ReactElement;
    dataTid?: string;
    siteCoreKey?: SitecoreDictionary;
    sitecoreField?: ISitecoreField<string>;
}
const BlockSelected: React.FunctionComponent<IBlockSelectedProps> = ({
    className,
    dataTid,
    siteCoreKey,
    sitecoreField,
    customSvg,
}) => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (!siteCoreKey && !sitecoreField) {
        return null;
    }

    return (
        <div className={classNames(className, 'block-selected')} data-tid={dataTid}>
            {sitecoreField && <Text field={sitecoreField} />}
            {siteCoreKey && getPhrase(siteCoreKey)}
            {customSvg || <SvgTick />}
        </div>
    );
};

export default BlockSelected;
