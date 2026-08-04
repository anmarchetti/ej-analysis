import React from 'react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import Link from 'frontend/components/common/Link';

interface ITopicLinkProps {
    topic: string;
    children?: any;
    className?: string;
}

export const TopicLink: React.FC<ITopicLinkProps> = ({ topic, className, children }) => {
    const { mediaPressReleasesUrl, redirectToArticlesByTopic } = useStore((stores: IHolidaysStores) => ({
        redirectToArticlesByTopic: stores.mediaCenterStore.redirectToArticlesByTopic,
        mediaPressReleasesUrl: stores.routerStore.mediaPressReleasesUrl,
    }));

    const url = mediaPressReleasesUrl(topic);

    return (
        <Link href={url} legacyBehavior>
            <a
                className={className}
                onClick={(e: React.MouseEvent): void => {
                    e.preventDefault();
                    redirectToArticlesByTopic(topic, url);
                }}
            >
                {children}
            </a>
        </Link>
    );
};

export default TopicLink;
