import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import IconChevronDown from 'frontend/components/icons/ChevronDown';
import IconChevronUp from 'frontend/components/icons/ChevronUp';

interface IConfirmationInfoTextProps {
    text: string;
}

function ConfirmationInfoText({ text }: IConfirmationInfoTextProps) {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const infoTextRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isOpened, setOpen] = useState(false);
    const [canExpand, setExpandState] = useState(false);

    const toggleOpen = () => {
        setOpen(!isOpened);
    };

    useEffect(() => {
        if (!infoTextRef.current || !contentRef.current) return;

        const textHeight = (infoTextRef.current.children[0] as HTMLDivElement).offsetHeight;
        const contentHeight = contentRef.current.offsetHeight;

        if (textHeight > contentHeight) {
            setExpandState(true);
        }
    }, []);

    const { GlobalsButtonsReadLess, GlobalsButtonsReadMore } = SitecoreDictionary;
    const isShowExpandable = canExpand && !isOpened;

    return (
        <div
            ref={contentRef}
            className={classNames({
                ['info__opened']: isOpened,
                ['info__expandable']: isShowExpandable,
            })}
        >
            <div ref={infoTextRef} className='info-txt'>
                <RichTextWithLinks field={{ value: text }} />
            </div>
            {canExpand && (
                <button className='info-txt__open-trigger' type='button' onClick={toggleOpen}>
                    {getPhrase(isOpened ? GlobalsButtonsReadLess : GlobalsButtonsReadMore)}
                    {isOpened ? <IconChevronUp /> : <IconChevronDown />}
                </button>
            )}
        </div>
    );
}

export default ConfirmationInfoText;
