import React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import SvgGlobe from 'frontend/components/icons-new/GlobeNew';

interface IOtherRoutesNoResultsProps {
    onClose: () => void;
    isMobile?: boolean;
}

const OtherRoutesNoResults = (props: IOtherRoutesNoResultsProps) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <div className='no-offers-found'>
            <div className='icon'>
                <SvgGlobe />
            </div>
            <p className='title'>{getPhrase(SitecoreDictionary.SearchResultsErrorsNoOtherRoutesTitle)}</p>
            <p className='description'>{getPhrase(SitecoreDictionary.SearchResultsErrorsNoOtherRoutesDescription)}</p>
            {!props.isMobile && (
                <Button isMedium onClick={props.onClose}>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsBack)}
                </Button>
            )}
        </div>
    );
};

export default observer(OtherRoutesNoResults);
