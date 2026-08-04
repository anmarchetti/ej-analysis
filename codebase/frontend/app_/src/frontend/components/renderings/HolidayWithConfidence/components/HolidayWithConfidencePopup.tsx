import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { inject } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { IConfidenceModuleFields } from 'models/data/IHolidayWithConfidence';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import IconChevronRight from 'frontend/components/icons/ChevronRight';

import ConfidencePopupListItem from './ConfidencePopupListItem';

interface IHolidayWithConfidencePopupProps
    extends ISitecoreCompositeField<IConfidenceModuleFields>,
        IComponentWithDictionary {
    isScreenMedium: boolean;
    isShowPopup: boolean;
    togglePopup: (state: boolean) => void;
}

const HolidayWithConfidencePopup = (props: IHolidayWithConfidencePopupProps) => {
    const toglePopup = () => {
        props.togglePopup(false);
    };

    const footerContent = (
        <Button onClick={toglePopup} dataTid='cancel-button'>
            {props.getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
        </Button>
    );

    const popupContent = (
        <>
            <Text field={props.fields.PopupTitle} className='confidence-popup__title' tag='p' />
            <RichTextWithLinks field={props.fields.PopupSubtitle} className='confidence-popup__subtitle' />

            {props.fields.PopupList.map(item => (
                <ConfidencePopupListItem key={item.id} fields={item.fields} id={item.id} />
            ))}

            <RichTextWithLinks field={props.fields.PopupEndText} className='confidence-popup__end-text' />

            {props.fields.PopupLink.value.href && (
                <RouterLink link={props.fields.PopupLink} className='confidence-popup__link'>
                    {props.fields.PopupLink.value.text}
                    <IconChevronRight />
                </RouterLink>
            )}
        </>
    );

    if (props.isScreenMedium) {
        return props.isShowPopup ? (
            <Popup showCloseButton containerClass='confidence-popup' onClose={toglePopup} footerContent={footerContent}>
                {popupContent}
            </Popup>
        ) : null;
    }

    return (
        <Drawer open={props.isShowPopup}>
            <div className='confidence-popup'>{popupContent}</div>

            <div className='drawer__actions'>{footerContent}</div>
        </Drawer>
    );
};

const ConnectedHolidayWithConfidencePopup = inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    isScreenMedium: stores.appStore.isScreenMedium,
}))(HolidayWithConfidencePopup);

export default ConnectedHolidayWithConfidencePopup;
