import React, { useState } from 'react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import SVGCross from 'frontend/components/icons-new/Cross';

import OtherRoutesPopupContent, { IOtherRoutesPopupContentProps } from './PopupContent/OtherRoutesPopupContent';

export const OtherRoutesDrawer = (props: IOtherRoutesPopupContentProps) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const [isTooltipOpen, setIsTooltipOpen] = useState(false);

    return (
        <Drawer open={props.isOpen} isInDrawer className='mobile-view'>
            <div className='container'>
                <OtherRoutesPopupContent {...props} isMobile />
            </div>

            <div className='drawer__actions'>
                {props.alternativeFlights.length > 1 && !!props.priceDisclaimer && (
                    <div data-tid='tooltip' className='tooltip' onClick={() => setIsTooltipOpen(true)}>
                        <i className='more-info'>
                            <IconInfoCircle />
                        </i>
                    </div>
                )}
                <Button isTransparent onClick={props.onClose} dataTid='cancel-btn'>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>
            </div>

            {isTooltipOpen && (
                <div data-tid='tooltip-content' className='tooltip__overlay' onClick={() => setIsTooltipOpen(false)}>
                    <div className='drawer__actions'>
                        <div className='tooltip' onClick={() => setIsTooltipOpen(false)}>
                            <i className='more-info'>
                                <SVGCross />
                            </i>
                        </div>
                        {props.priceDisclaimer}
                    </div>
                </div>
            )}
        </Drawer>
    );
};

export default OtherRoutesDrawer;
