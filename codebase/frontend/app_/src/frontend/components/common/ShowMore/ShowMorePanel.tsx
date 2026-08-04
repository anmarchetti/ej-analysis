import { ElementType, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';
import SvgChevronUp from 'frontend/components/icons-new/ChevronUp';

import styles from './ShowMorePanel.module.scss';

interface IShowMoreProps<T> {
    Component: ElementType;
    id: string;
    visibleItems: Array<T & { id?: string }>;
    bodyClass?: string;
    containerClass?: string;
    hiddenItems?: Array<T & { id?: string }>;
    showLessTitle?: string;
    showMoreTitle?: string;
}

const ShowButton = ({ showTitle, hideTitle, onClick, isOpen, id }) => {
    const Chevron = isOpen ? SvgChevronUp : SvgChevronDown;
    const title = isOpen ? hideTitle : showTitle;

    return (
        <button
            data-tid='show-button'
            className={styles.toggleButton}
            onClick={onClick}
            type='button'
            aria-expanded={isOpen}
            aria-controls={`collapse-${id}`}
        >
            {title} <Chevron />
        </button>
    );
};

const ShowMorePanel = <T,>(props: IShowMoreProps<T>): JSX.Element => {
    const { getPhrase } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const { Component, visibleItems, hiddenItems, containerClass, bodyClass, id } = props;

    const toggleContent = () => {
        setIsOpen(scrollFunction);
    };

    const scrollFunction = (state: boolean): boolean => {
        const target = containerRef?.current;

        if (!state == false && target && target.getBoundingClientRect().top < 0) {
            target.scrollIntoView({ behavior: 'smooth' });
        }

        return !state;
    };

    const containerClassName = classNames(styles.showMoreContainer, containerClass);

    useEffect(() => {
        setIsOpen(false);
    }, [visibleItems, hiddenItems]);

    if (visibleItems.length <= 0) return <></>;

    return (
        <div className={containerClassName} data-tid={id} id={id} ref={containerRef}>
            <div className={bodyClass}>
                {visibleItems.map(({ id, ...item }) => (
                    <Component key={id} {...item} />
                ))}
            </div>
            {hiddenItems && hiddenItems?.length > 0 && (
                <>
                    <div className={classNames(styles.wrapper, isOpen && styles.open)} id={`collapse-${id}`}>
                        <div className={styles.inner}>
                            <div className={bodyClass}>
                                {hiddenItems?.map(({ id, ...item }) => (
                                    <Component key={id} {...item} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <ShowButton
                        showTitle={getPhrase(SitecoreDictionary.GlobalsLabelsShowMore)}
                        hideTitle={getPhrase(SitecoreDictionary.GlobalsLabelsShowLess)}
                        onClick={toggleContent}
                        id={id}
                        isOpen={isOpen}
                    />
                </>
            )}
        </div>
    );
};

export default ShowMorePanel;
