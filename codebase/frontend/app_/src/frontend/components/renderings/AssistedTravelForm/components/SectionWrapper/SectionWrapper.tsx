import { FC, ReactNode, useEffect, useRef } from 'react';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';

import styles from './SectionWrapper.module.scss';

export type TSectionWrapperProps = {
    children: ReactNode;
    focusTrigger?: string;
    primaryBtnAction?: () => void;
    primaryBtnScreenReaderText?: ISitecoreField<string>;
    primaryBtnText?: ISitecoreField<string>;
    secondaryBtnAction?: () => void;
    secondaryBtnScreenReaderText?: ISitecoreField<string>;
    secondaryBtnText?: ISitecoreField<string>;
};

const SectionWrapper: FC<TSectionWrapperProps> = ({
    primaryBtnAction,
    primaryBtnText,
    primaryBtnScreenReaderText,
    secondaryBtnAction,
    secondaryBtnText,
    secondaryBtnScreenReaderText,
    focusTrigger,
    children,
}) => {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        sectionRef.current?.focus({ preventScroll: true });
    }, [focusTrigger]);

    return (
        <section ref={sectionRef} tabIndex={-1} className={styles.sectionWrapper} data-tid='section-wrapper'>
            <div className={styles.sectionContent}>{children}</div>
            {(secondaryBtnText?.value || primaryBtnText?.value) && (
                <div className={styles.btnContainer}>
                    {secondaryBtnText?.value && (
                        <Button
                            isText
                            onClick={secondaryBtnAction}
                            className={styles.btn}
                            aria-label={secondaryBtnScreenReaderText?.value}
                            data-tid='secondary-button'
                        >
                            {secondaryBtnText.value}
                        </Button>
                    )}
                    {primaryBtnText?.value && (
                        <Button
                            isMedium
                            onClick={primaryBtnAction}
                            className={styles.btn}
                            aria-label={primaryBtnScreenReaderText?.value}
                            data-tid='primary-button'
                        >
                            {primaryBtnText.value}
                        </Button>
                    )}
                </div>
            )}
        </section>
    );
};

export default SectionWrapper;
