import React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';

interface ISpecialRequestsActionsProps {
    onClose: () => void;
    onSave: () => void;
}

function ExtrasSpecialRequestsDrawerActions({ onSave, onClose }: ISpecialRequestsActionsProps) {
    const { getPhrase } = useStore(store => ({
        getPhrase: store.layoutStore.getPhrase,
    }));

    return (
        <div className='drawer__actions'>
            <Button isTransparent isFullWidth onClick={onClose} dataTid='cancel-btn'>
                {getPhrase(SitecoreDictionary.GlobalsButtonsCancel)}
            </Button>

            <Button isFullWidth onClick={onSave} dataTid='save-btn'>
                {getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
            </Button>
        </div>
    );
}

export default observer(ExtrasSpecialRequestsDrawerActions);
