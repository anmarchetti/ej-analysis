import { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import { AmendmentType } from 'models/data/IBookingInfo';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import { JSSImage } from 'frontend/components/common/JSSImage';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './ProductUnavailablePopup.module.scss';

export interface IProductUnavailablePopupFields {
    CTA: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    NoOptionsCTA: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    NoOptionsDescription?: ISitecoreField<string>;
    NoOptionsTitle?: ISitecoreField<string>;
    SubDescription?: ISitecoreField<string>;
}

interface IProductUnavailablePopupProps extends ISitecoreComponent<IProductUnavailablePopupFields> {
    onClose: () => void;
    areNoOptionsAvailable?: boolean;
    product?: AmendmentType;
}

export const ProductUnavailablePopup: FunctionComponent<IProductUnavailablePopupProps> = ({
    params,
    fields,
    product,
    onClose,
    areNoOptionsAvailable,
}) => {
    const isDesktopViewport = useMoreThenMobileViewport();

    // Check if product is provided and if it's the same as the one from Sitecore params
    const isExistingProduct = product === params?.product;

    if ((!!product && !isExistingProduct) || !fields) {
        return null;
    }

    const { Icon, SubDescription, NoOptionsTitle, NoOptionsDescription, NoOptionsCTA, Title, Description, CTA } =
        fields;

    const { title, description, cta } = areNoOptionsAvailable
        ? { title: NoOptionsTitle, description: NoOptionsDescription, cta: NoOptionsCTA }
        : {
              title: Title,
              description: Description,
              cta: CTA,
          };

    const renderContent = () => (
        <>
            {Icon && <JSSImage className='price-jump-popup__icon' field={Icon} alt='' role='presentation' />}
            {title && <Text tag='h3' className={classNames('price-jump-popup__title', styles.title)} field={title} />}
            {description && (
                <RichTextWithLinks
                    tag='div'
                    className={classNames('price-jump-popup__description', styles.description)}
                    field={description}
                />
            )}
            {SubDescription && (
                <RichTextWithLinks tag='div' className='price-jump-popup__description' field={SubDescription} />
            )}
        </>
    );

    const renderFooter = () => <Button onClick={onClose}>{cta?.value}</Button>;

    if (isDesktopViewport) {
        return (
            <Popup containerClass={classNames('price-jump-popup', styles.popup)} footerContent={renderFooter()}>
                {renderContent()}
            </Popup>
        );
    }

    return (
        <Drawer open={true} className={styles.drawer}>
            <div className={styles.drawerBody}> {renderContent()}</div>
            <div className={styles.drawerFooter}>{renderFooter()}</div>
        </Drawer>
    );
};

export default observer(ProductUnavailablePopup);
