import { FunctionComponent, MouseEvent } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import Button from 'frontend/components/common/Button';
import StartBookingButton from 'frontend/components/common/StartBookingButton';

interface IBundleSiteCoreFields {
    items: IPromoCode[];
}
interface IPromoCode {
    bundles: IBundle[];
    promoCode: string;
}

export interface IBundle {
    name: string;
    bundleElements?: IBundleElement[];
    description?: string;
    icon?: IBundleIcon;
}

export interface IBundleElement {
    identifier: string;
    icon?: IBundleIcon;
}

export interface IBundleIcon {
    identifier: string;
}
const Bundles: FunctionComponent<ISitecoreComponent<IBundleSiteCoreFields>> = ({ fields }) => {
    const { getPhrase, packageInfo } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        packageInfo: stores.bookingStore.packageInfo,
    }));

    let bundles: IPromoCode | undefined;

    if (fields?.items && packageInfo) {
        bundles = fields?.items.find((item: IPromoCode) => item.promoCode === packageInfo?.Prom);
    }

    return (
        <>
            <StartBookingButton
                render={(onClick: ((event: MouseEvent) => void) | undefined): JSX.Element => (
                    <Button id='book-button-sidebar' isLarge isFullWidth onClick={onClick} className='continue-button'>
                        {getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
                    </Button>
                )}
            />
            {bundles?.promoCode}
        </>
    );
};

export default observer(Bundles);
