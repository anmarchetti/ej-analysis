import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

// DOCS: https://www.deque.com/axe/core-documentation/api-documentation
// RULES: https://dequeuniversity.com/rules/axe/4.2
const config = {
    rules: [
        {
            id: 'color-contrast',
            enabled: false,
        },
    ],
    disableDeduplicate: true,
};

const TIMEOUT = 1000;

export const useAxeReact = (): void => {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') {
            import('@axe-core/react').then(({ default: axe }) => {
                axe(React, ReactDOM, TIMEOUT, config);
            });
        }
    }, []);
};
