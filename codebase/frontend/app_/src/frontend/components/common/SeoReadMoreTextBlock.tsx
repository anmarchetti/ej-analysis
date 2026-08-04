import { CSSProperties, FunctionComponent, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { isEmptyHtmlContent } from 'frontend/utils/html.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ReadMoreButton from './ReadMoreButton';
import RichTextWithLinks from './RichTextWithLinks';

interface ISeoReadMoreTextBlockProps {
    text: string;
    className?: string;
    dataTid?: string;
    hideEmptyHtml?: boolean;
    overallHeightDesktop?: number;
    overallHeightMobile?: number;
}

export const DEFAULT_DESKTOP_MAX_HEIGHT = 200;
export const DEFAULT_MOBILE_MAX_HEIGHT = 130;
const DEFAULT_DATA_TID = 'seo-read-more-text-block';

export const SeoReadMoreTextBlock: FunctionComponent<ISeoReadMoreTextBlockProps> = ({
    text,
    className,
    dataTid = DEFAULT_DATA_TID,
    overallHeightDesktop = DEFAULT_DESKTOP_MAX_HEIGHT,
    overallHeightMobile = DEFAULT_MOBILE_MAX_HEIGHT,
    hideEmptyHtml,
}) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const richTextWithLinksRef = useRef<null | HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [isHeightOverSize, setIsHeightOverSize] = useState<boolean>(true);
    const isMobile = useMobileViewport();

    useEffect(() => {
        // Collapse the block if text is changed (e.g. dataSource changed when switching between promo pages)
        setIsExpanded(false);

        // If the height of the element exceeds the value of const height, enable SEO read more text UI
        const textHeight = richTextWithLinksRef?.current?.scrollHeight ?? 0;
        const maxHeight = isMobile ? overallHeightMobile : overallHeightDesktop;

        setIsHeightOverSize(textHeight > maxHeight);
    }, [text, isMobile, overallHeightDesktop, overallHeightMobile]);

    if (hideEmptyHtml && isEmptyHtmlContent(text)) {
        return null;
    }

    const toggleExpanded = (): void => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={className} data-tid={dataTid}>
            <div
                data-tid={`${dataTid}-content`}
                ref={richTextWithLinksRef}
                className={classNames(
                    isHeightOverSize && !isExpanded
                        ? 'seo-read-more-text-block seo-read-more-text-block--fixed-height'
                        : 'seo-read-more-text-block',
                )}
                style={
                    {
                        '--mobile-seo-read-more': `${overallHeightMobile}px`,
                        '--desktop-seo-read-more': `${overallHeightDesktop}px`,
                    } as CSSProperties
                }
            >
                <RichTextWithLinks tag='div' field={{ value: text }} />
            </div>

            {isHeightOverSize && (
                <div className='read-more-box'>
                    <ReadMoreButton
                        dataTid={`${dataTid}-read-more`}
                        isReadLess={isExpanded}
                        onClick={toggleExpanded}
                        readLessText={getPhrase(SitecoreDictionary.GlobalsButtonsReadLess)}
                        readMoreText={getPhrase(SitecoreDictionary.GlobalsButtonsReadMore)}
                    />
                </div>
            )}
        </div>
    );
};

export default observer(SeoReadMoreTextBlock);
