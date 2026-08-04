import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import debounce from 'lodash/debounce';

interface IUseReadMoreButtonProps {
    contentId: string;
    excludeId: string;
    wrapperId: string;
    defaultIsExpanded?: boolean;
}

interface IUseReadMoreButtonData {
    isButtonRendered: boolean;
    isExpanded: boolean;
    onClick: () => void;
}

const MOBILE_WIDTH = 576;
const MAX_DESKTOP_HEIGHT = 320;
const MAX_MOBILE_HEIGHT = 520;

export const measureElement = (el: HTMLElement, excludeIDs: string[] = []): DOMRect => {
    const clone = el.cloneNode(true) as HTMLElement;

    clone.style.cssText = getComputedStyle(el).cssText;
    clone.style.visibility = 'hidden';
    clone.style.maxHeight = 'none';
    clone.style.height = 'auto';

    clone.querySelectorAll('*').forEach((child: HTMLElement) => {
        if (excludeIDs.includes(child.id)) {
            child.remove();

            return;
        }

        child.style.maxHeight = 'none';
        child.style.height = 'auto';
    });

    (el.parentElement ?? document.body).appendChild(clone);

    const rect = clone.getBoundingClientRect();

    clone.remove();

    return rect;
};

export const getMaxHeight = (): number =>
    document.documentElement.offsetWidth > MOBILE_WIDTH ? MAX_DESKTOP_HEIGHT : MAX_MOBILE_HEIGHT;

export const resizeCallback =
    ({
        wrapper,
        content,
        excludeId,
        setIsRendered,
    }: {
        content: HTMLElement;
        excludeId: string;
        setIsRendered: Dispatch<SetStateAction<boolean>>;
        wrapper: HTMLElement;
    }): (([{ target }]) => void) =>
    ([{ target }]): void => {
        const { height: wrapperHeight } = measureElement(wrapper, [excludeId]);
        const { height: contentHeight } = measureElement(content);

        const isRendered = wrapperHeight > getMaxHeight();

        setIsRendered(isRendered);

        if (!isRendered || target?.dataset?.expanded === '1') {
            target.style.height = contentHeight + 'px';
        } else {
            const { height: wrapperHeight } = measureElement(wrapper);

            target.style.height = getMaxHeight() - (wrapperHeight - contentHeight) + 'px';
        }
    };

export const useReadMoreButton = ({
    wrapperId,
    contentId,
    excludeId,
    defaultIsExpanded = false,
}: IUseReadMoreButtonProps): IUseReadMoreButtonData => {
    const [isRendered, setIsRendered] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<boolean>(defaultIsExpanded);

    useEffect(() => {
        const wrapper = document.getElementById(wrapperId);
        const content = document.getElementById(contentId);

        if (!wrapper || !content) return;

        setIsRendered(wrapper.scrollHeight > getMaxHeight());

        const handler = debounce(resizeCallback({ wrapper, content, excludeId, setIsRendered }), 200);
        const observer = new ResizeObserver(handler);

        observer.observe(content);

        return () => {
            observer.disconnect();
            handler.cancel();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        isExpanded,
        isButtonRendered: isRendered,
        onClick: (): void => {
            const wrapper = document.getElementById(wrapperId);
            const content = document.getElementById(contentId);

            if (!wrapper || !content) return;

            setIsExpanded(v => !v);

            if (isExpanded) {
                const { height: wrapperHeight } = measureElement(wrapper);

                content.dataset.expanded = '0';
                content.style.height = getMaxHeight() - (wrapperHeight - content.scrollHeight) + 'px';
            } else {
                content.dataset.expanded = '1';
                content.style.height = content.scrollHeight + 'px';
            }
        },
    };
};

export default useReadMoreButton;
