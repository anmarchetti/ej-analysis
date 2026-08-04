import { FC, KeyboardEvent, MouseEvent } from 'react';

import { KeyboardKey } from 'models/enum/KeyboardKey';

import styles from './LandmarkLink.module.scss';

interface ILandmarkLinkProps {
    linkTitle: string;
    sectionName: string;
}

export const LandmarkLink: FC<ILandmarkLinkProps> = ({ sectionName, linkTitle }) => {
    const onClick = (e: MouseEvent<HTMLAnchorElement> | KeyboardEvent<HTMLAnchorElement>): void => {
        e.preventDefault();

        const target = document.getElementById(sectionName);

        if (target) {
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
        }
    };

    const onKeyDown = (e: KeyboardEvent<HTMLAnchorElement>): void => {
        if (e.key === KeyboardKey.SPACE) {
            e.preventDefault();
            onClick(e);
        }
    };

    return (
        <div className={styles.landmarkLinkBox} data-tid='landmark-link-box'>
            <a
                data-tid='landmark-link-element'
                tabIndex={0}
                onKeyDown={onKeyDown}
                onClick={onClick}
                href={`#${sectionName}`}
            >
                {linkTitle}
            </a>
        </div>
    );
};

export default LandmarkLink;
