import { FC } from 'react';

import * as Poster from 'frontend/components/common/Poster';

import PosterLayout from './components/PosterLayout/PosterLayout';
import { ISocialMediaContentProps } from './interfaces';

export const SocialMediaContent: FC<ISocialMediaContentProps> = props => (
    <Poster.Root>
        <PosterLayout {...props} />
    </Poster.Root>
);

export default SocialMediaContent;
