import type { Meta, StoryObj } from '@storybook/nextjs';
import type { CSSProperties } from 'react';
import phoneTexture from 'assets/intuit-passkey-enrollment.png';
import phoneTexture2 from 'assets/intuit-mdl-verification.png';
import laptopTexture from 'assets/rivian-fleet-os-1.png';
import { Model } from 'components/Model';
import { StoryContainer } from '../../../.storybook/StoryContainer';
import { deviceModels } from './deviceModels';

const meta: Meta<typeof Model> = {
  title: 'Model',
  component: Model,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Model>;

const modelStyle: CSSProperties = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 };

export const Phone: Story = {
  render: () => (
    <StoryContainer padding={0}>
      <Model
        style={modelStyle}
        cameraPosition={{ x: 0, y: 0, z: 11.5 }}
        alt="A passkey enrollment confirmation and a digital ID verification screen"
        models={[
          {
            ...deviceModels.phone,
            position: { x: -0.6, y: 0.8, z: 0.1 },
            texture: {
              srcSet: [phoneTexture],
              placeholder: phoneTexture,
            },
          },
          {
            ...deviceModels.phone,
            position: { x: 0.6, y: -0.8, z: 0.4 },
            texture: {
              srcSet: [phoneTexture2],
              placeholder: phoneTexture2,
            },
          },
        ]}
      />
    </StoryContainer>
  ),
};

export const Laptop: Story = {
  render: () => (
    <StoryContainer padding={0}>
      <Model
        style={modelStyle}
        cameraPosition={{ x: 0, y: 0, z: 8 }}
        alt="The Rivian Fleet OS dashboard"
        models={[
          {
            ...deviceModels.laptop,
            position: { x: 0, y: 0, z: 0 },
            texture: {
              srcSet: [laptopTexture],
              placeholder: laptopTexture,
            },
          },
        ]}
      />
    </StoryContainer>
  ),
};
