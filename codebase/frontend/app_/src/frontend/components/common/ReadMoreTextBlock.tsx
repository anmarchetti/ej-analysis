import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import truncate, { IOptions as ITruncateOptions } from 'truncate-html';

import { useIsMounted } from 'frontend/hooks/useIsMounted';
import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ReadMoreButton from './ReadMoreButton';
import RichTextWithLinks from './RichTextWithLinks';

interface IReadMoreTextBlockProps {
    text: string;
    truncateOptions: ITruncateOptions;
    className?: string;
    isActiveOnlyOnMobile?: boolean;
}

export const ReadMoreTextBlock = ({
    text,
    truncateOptions,
    isActiveOnlyOnMobile,
    className,
}: IReadMoreTextBlockProps) => {
    const { isScreenLessMedium, getPhrase } = useStore(stores => ({
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const isMounted = useIsMounted();
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const shortText = useMemo(() => truncate(text, truncateOptions), [text, truncateOptions]);

    // Calculate the full text length if decodeEntities true.
    // Because the lib converts &nbsp; to ' ' and it's caused issue when compare original and shortText length.
    const fullTextLength = useMemo(
        () =>
            truncateOptions.decodeEntities
                ? truncate(text, { ...truncateOptions, length: text.length }).length
                : text.length,
        [text, truncateOptions],
    );

    const hasReadMoreButton =
        isMounted && (!isActiveOnlyOnMobile || isScreenLessMedium) && fullTextLength > shortText.length;
    const currentText = hasReadMoreButton && !isExpanded ? shortText : text;

    useEffect(() => {
        // Collapse the block if text is changed (e.g. dataSource changed when switching between promo pages)
        setIsExpanded(false);
    }, [text]);

    return (
        <div className={classNames(className, hasReadMoreButton && !isExpanded && 'collapsed')}>
            <RichTextWithLinks tag='div' field={{ value: currentText }} />
            {hasReadMoreButton && (
                <div className='read-more-box'>
                    <ReadMoreButton
                        isReadLess={isExpanded}
                        onClick={() => setIsExpanded(expanded => !expanded)}
                        readLessText={getPhrase(SitecoreDictionary.GlobalsButtonsReadLess)}
                        readMoreText={getPhrase(SitecoreDictionary.GlobalsButtonsReadMore)}
                    />
                </div>
            )}
        </div>
    );
};

export default observer(ReadMoreTextBlock);
