import { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useAgentLogo from 'frontend/hooks/useAgentLogo';
import useStore from 'frontend/hooks/useStore';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import * as Poster from 'frontend/components/common/Poster';

import PosterContent from './components/PosterContent/PosterContent';

import styles from './ExportButtons.module.scss';

export interface IExportButtonsFields extends Poster.IPosterFields {
    Description?: ISitecoreField<string>;
    ExportAsImage?: ISitecoreField<boolean>;
    ExportPromoLabel?: ISitecoreField<string>;
    ExportPromoTooltip?: ISitecoreField<string>;
    FastTrackSecurityIcon?: ISitecoreField<ISitecoreImage>;
    FastTrackSecurityLabel?: ISitecoreField<string>;
    HideDownloadButton?: ISitecoreField<boolean>;
    LogoImage?: ISitecoreField<ISitecoreImage>;
    Title?: ISitecoreField<string>;
}

interface IExportButtonsProps {
    items: ISitecoreChildren<IExportButtonsFields>[];
}

export type TExportButtonsParams = ISitecoreComponent<IExportButtonsProps>;

export const ExportButtons: FC<TExportButtonsParams> = props => {
    const UMLogoImage = useAgentLogo();
    const { isLuxuryPackage } = useStore(stores => ({
        isLuxuryPackage: stores.bookingStore.isLuxuryPackage,
    }));

    if (!props.fields?.items.length) {
        return null;
    }

    return (
        <Poster.Root>
            <div
                data-tid='export-buttons-wrapper'
                className={classNames(styles.itemsWrapper, { [styles.luxury]: isLuxuryPackage })}
            >
                {props.fields?.items.map((item, index) => (
                    <PosterContent
                        key={item.id}
                        rendering={props.rendering}
                        index={index}
                        UMLogoImage={UMLogoImage}
                        {...item}
                    />
                ))}
            </div>
        </Poster.Root>
    );
};

export default observer(ExportButtons);
