import { useEffect } from 'react';

const EXTRA_SCROLL_PX = 2;

export const useTextareaHeight = (element: Nullable<HTMLTextAreaElement>, text: Nullable<string>) =>
    useEffect(() => {
        if (!element) {
            return;
        }

        element.style.height = element.scrollHeight + EXTRA_SCROLL_PX + 'px';
    }, [element, text]);
