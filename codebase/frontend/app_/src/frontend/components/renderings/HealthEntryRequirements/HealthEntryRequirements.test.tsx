import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import HealthEntryRequirements from './HealthEntryRequirements';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Text: () => <div data-tid='health-entry-requirements-title' />,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: () => <div data-tid='health-entry-requirements-description' />,
}));

jest.mock('./components/HealthEntryRequirementTile', () => ({
    __esModule: true,
    default: () => <div data-tid='health-entry-requirement-tile' />,
}));

const createProps = () => ({
    fields: {
        Description: mockSitecoreField('Description'),
        Title: mockSitecoreField('Title'),
    },
});

let props;
let mockStores;

describe('<HealthEntryRequirements />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores();
    });

    it('Should be empty render if no both requirements and children', () => {
        const { container } = render(<HealthEntryRequirements {...props} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('Should render requirements', () => {
        props.requirements = [
            { title: 'Requirement 1', description: 'description 1' },
            { title: 'Requirement 2', description: 'description 2' },
            { title: 'Requirement 3', description: 'description 3' },
        ];
        render(<HealthEntryRequirements {...props} />);
        expect(screen.getByTestId('health-entry-requirements-title')).toBeInTheDocument();
        expect(screen.getByTestId('health-entry-requirements-description')).toBeInTheDocument();
        expect(screen.getByTestId('health-entry-requirements-list')).toBeInTheDocument();
        expect(screen.getAllByTestId('health-entry-requirement-tile')).toHaveLength(3);
    });

    it('Should NOT render title and description if no fields', () => {
        props.fields = null;
        props.requirements = [{ title: 'Requirement 1', description: 'description 1' }];
        render(<HealthEntryRequirements {...props} />);
        expect(screen.queryByTestId('health-entry-requirements-title')).not.toBeInTheDocument();
        expect(screen.queryByTestId('health-entry-requirements-description')).not.toBeInTheDocument();
    });
});
