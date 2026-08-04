import React, { FC, useEffect, useRef, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { MediaSize } from 'models/data/MediaSizeParams';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgCross from 'frontend/components/icons-new/Cross';

import styles from './ActivePanel.module.scss';

export interface IActivePanelProps {
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
    hideContainer: boolean;
    onClick: () => void;
}

const ICON_SIZES = {
    desktop: {
        width: 90,
        height: 90,
    },
    mobile: {
        width: 54,
        height: 54,
    },
};

const ActivePanel: FC<IActivePanelProps> = ({ Title, Description, Icon, onClick, hideContainer }) => {
    const { getPhrase } = useStore((stores: TStores) => ({ getPhrase: stores.layoutStore.getPhrase }));
    const contentRef = useRef<HTMLDivElement>(null);
    const [hasScroll, setHasScroll] = useState(false);
    const isMobile = useMobileViewport();

    useEffect(() => {
        const el = contentRef.current;

        if (!el) {
            return;
        }

        const isScrollable = el.scrollHeight > el.clientHeight;

        setHasScroll(isScrollable);
    }, [isMobile]);

    return (
        <div
            className={classNames(styles.container, { [styles.hideContainer]: hideContainer })}
            data-tid='active-panel'
        >
            <Button
                isText
                className={styles.closeButton}
                onClick={onClick}
                dataTid='active-panel-close-button'
                aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsClosePanelButton)}
                tabIndex={hideContainer ? -1 : 0}
            >
                <SvgCross />
            </Button>
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
            <div
                ref={contentRef}
                className={styles.content}
                data-tid='active-panel-content'
                tabIndex={hasScroll && !hideContainer ? 0 : -1}
            >
                <div className={styles.contentFields}>
                    {Icon?.value && (
                        <JSSImageNext
                            mediaSize={MediaSize.Small}
                            field={Icon}
                            className={styles.icon}
                            data-tid='active-panel-icon'
                            dynamicSize={ICON_SIZES}
                        />
                    )}
                    {Title?.value && (
                        <Text tag='div' field={Title} className={styles.title} data-tid='active-panel-title' />
                    )}
                </div>
                {Description && (
                    <RichTextWithLinks
                        field={Description}
                        className={styles.description}
                        disableLinkFocus={hideContainer}
                        dataId='active-panel-description'
                    />
                )}
            </div>
        </div>
    );
};

export default ActivePanel;
