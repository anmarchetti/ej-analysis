import * as React from 'react';
import { inject } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import { TStores } from 'frontend/store/IStores';
import { isTransferHidden } from 'frontend/utils/transfer.utils';
import { IThemePackageIcon } from 'models/data/IHotel';
import { ITransfer } from 'models/data/ITransfer';
import { PackageIconTypes } from 'models/enum/PackageIconTypes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import SvgTaxiFilled from 'frontend/components/icons-new/TaxiFilled';
import SvgTransferFilled from 'frontend/components/icons-new/TransferFilled';

import ImageWithFilter, { SVGFilterMatrix } from './ImageWithFilter/ImageWithFilter';

interface IBasketTransferProps extends IComponentWithDictionary {
    transfer: Nullable<ITransfer>;
    packageIcons?: Nullable<IThemePackageIcon[]>;
}

const transferMapping = {
    [TransferType.Private]: {
        defaultIcon: <SvgTaxiFilled />,
        packageIconType: PackageIconTypes.PrivateTransfer,
        phrase: SitecoreDictionary.TransferLabelsPrivateTransfer,
    },
    [TransferType.Shared]: {
        defaultIcon: <SvgTransferFilled />,
        packageIconType: PackageIconTypes.SharedTransfer,
        phrase: SitecoreDictionary.TransferLabelsIncluded,
    },
};

export const BasketTransfer = (props: IBasketTransferProps) => {
    const transfer = props.transfer ? transferMapping[props.transfer.type] : null;

    if (!transfer || isTransferHidden([props.transfer] as ITransfer[])) {
        return null;
    }

    const renderIcon = () => {
        let icon;

        if (props.packageIcons?.length) {
            const packageIcon = props.packageIcons.find(i => i.key === transfer.packageIconType);
            icon = packageIcon?.iconUrl && (
                <ImageWithFilter
                    imageSrc={cmsUrls.media(packageIcon.iconUrl)}
                    filterMatrix={SVGFilterMatrix.Grayscale}
                />
            );
        }

        return icon || transfer.defaultIcon;
    };

    return (
        <div className='holiday-details__item' data-tid='transfer-included'>
            <i className='holiday-details__icon'>{renderIcon()}</i>
            {transfer.phrase && <span className='holiday-details__text'>{props.getPhrase(transfer.phrase)}</span>}
        </div>
    );
};

export default inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
}))(BasketTransfer);
