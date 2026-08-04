import React, { FC, HTMLAttributeAnchorTarget } from 'react';
import RouterLink, { LinkProps } from 'next/link';

import useBasePath from 'frontend/hooks/useBasePath';

interface ILinkProps extends LinkProps {
    children: React.ReactNode;
    className?: string;
    rel?: string;
    target?: HTMLAttributeAnchorTarget;
}

// Next.js Link, but basePath is already set
const Link: FC<ILinkProps> = props => {
    const basePath = useBasePath(props.locale || undefined);

    const href =
        typeof props.href === 'string' && !props.href.startsWith('http') && !props.href.startsWith(basePath)
            ? basePath + props.href
            : props.href;

    const asProp =
        typeof props.as === 'string' && !props.as.startsWith('http') && !props.as.startsWith(basePath)
            ? basePath + props.as
            : props.as;

    return (
        <RouterLink {...props} href={href} as={asProp} prefetch={false}>
            {props.children}
        </RouterLink>
    );
};

export default Link;
