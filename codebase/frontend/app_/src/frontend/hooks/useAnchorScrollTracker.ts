import { useEffect, useState } from 'react';

type TActiveAnchorType = { id: string; isActive?: boolean };
export type TUseAnchorScrollTrackerProps = {
    items: TActiveAnchorType[];
    baseOffset?: number;
    keepTabSelection?: boolean;
    rootMargin?: string;
    threshold?: number;
};

export const useAnchorScrollTracker = ({
    items,
    baseOffset,
    keepTabSelection,
    rootMargin,
    threshold,
}: TUseAnchorScrollTrackerProps): TActiveAnchorType[] => {
    const [anchorsStates, setAnchorsStates] = useState<TActiveAnchorType[]>([...items]);

    const handleEntriesChange = (entries: IntersectionObserverEntry[]): void => {
        entries.forEach(entry => {
            setAnchorsStates(prev => handleEntryChange(prev, entry));
        });
    };

    const handleEntryChange = (anchors: TActiveAnchorType[], entry: IntersectionObserverEntry): TActiveAnchorType[] => {
        const index = anchors.findIndex(item => item.id === entry.target.id);

        if (index === -1) return anchors;

        if (keepTabSelection && entry.isIntersecting) {
            return anchors.map((item, i) => ({
                ...item,
                isActive: i === index,
            }));
        }

        if (!keepTabSelection) {
            return anchors.map((item, i) => (i === index ? { ...item, isActive: entry.isIntersecting } : item));
        }

        return anchors;
    };

    const observeElements = (items: TActiveAnchorType[], observer: IntersectionObserver): HTMLElement[] =>
        items.reduce<HTMLElement[]>((acc, item) => {
            const el = document.getElementById(item.id);

            if (el) {
                observer.unobserve(el);
                observer.observe(el);
                acc.push(el);
            }

            return acc;
        }, []);

    useEffect(() => {
        if (!items.length) return;

        const observer = new IntersectionObserver(handleEntriesChange, {
            rootMargin: rootMargin ?? `-${baseOffset ?? 0}px 0px 0px`,
            threshold,
        });

        let elements: HTMLElement[] = observeElements(items, observer);

        let mutationObserver: MutationObserver | null;

        if (elements.length !== items.length) {
            mutationObserver = new MutationObserver(() => {
                elements = observeElements(items, observer);

                if (elements.length === items.length) {
                    mutationObserver?.disconnect();
                }
            });

            mutationObserver.observe(document.body, { childList: true, subtree: true });
        }

        return () => {
            mutationObserver?.disconnect();
            elements.forEach(el => observer.unobserve(el));
            observer.disconnect();
        };
    }, [items, baseOffset, rootMargin, threshold, keepTabSelection]);

    return anchorsStates;
};
