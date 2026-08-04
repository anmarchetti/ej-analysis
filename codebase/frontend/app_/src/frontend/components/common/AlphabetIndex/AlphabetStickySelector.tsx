import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { KeyboardKey } from 'models/enum/KeyboardKey';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AlphabetNav, { IAlphabetNavProps } from './AlphabetNav';

const AlphabetStickySelector = ({ anchors, activeAnchor, className, onAnchorClick }: IAlphabetNavProps) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const [isSelectorShown, setSelectorShown] = useState(false);

    const openSelectorPopup = () => {
        setSelectorShown(true);
    };

    const closeSelectorPopup = () => {
        setSelectorShown(false);
    };

    useEffect(() => {
        if (!isSelectorShown) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === KeyboardKey.ESCAPE || e.key === KeyboardKey.ESC) {
                closeSelectorPopup();
            }
        };

        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [isSelectorShown]);

    return (
        <div className={classNames('alphabet-sticky-selector', className)}>
            <button type='button' className='alphabet-sticky-selector__toggle' onClick={openSelectorPopup}>
                {getPhrase(SitecoreDictionary.GlobalsLabelsAZ)}
            </button>
            {isSelectorShown && (
                <>
                    <div
                        className='alphabet-sticky-selector__popup'
                        role='dialog'
                        aria-modal='true'
                        aria-label={getPhrase(SitecoreDictionary.GlobalsLabelsAlphabeticalIndex)}
                    >
                        <AlphabetNav
                            anchors={anchors}
                            activeAnchor={activeAnchor}
                            onAnchorClick={(e, a) => {
                                onAnchorClick(e, a);
                                closeSelectorPopup();
                            }}
                        />
                    </div>
                    <div className='popup-overlay' onClick={closeSelectorPopup} />
                </>
            )}
        </div>
    );
};

export default AlphabetStickySelector;
