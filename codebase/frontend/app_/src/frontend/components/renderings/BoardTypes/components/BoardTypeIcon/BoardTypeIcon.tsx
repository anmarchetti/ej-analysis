import classNames from 'classnames';

import { cmsUrls } from 'code/endpoints';
import SvgFullBoard from 'frontend/components/icons-new/FullBoard';

interface IBoardTypeIconProps {
    className?: string;
    iconUrl?: string;
}

const BoardTypeIcon = ({ iconUrl, className }: IBoardTypeIconProps) =>
    iconUrl ? (
        <span
            className={classNames('icon--bg-image', className)}
            style={{ backgroundImage: `url(${cmsUrls.media(iconUrl)})` }}
        />
    ) : (
        <SvgFullBoard className={className} />
    );

export default BoardTypeIcon;
