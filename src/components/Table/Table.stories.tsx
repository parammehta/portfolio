import type { Meta, StoryObj } from '@storybook/nextjs';
import { Table, TableCell, TableRow } from 'components/Table';
import { StoryContainer } from '../../../.storybook/StoryContainer';
import { TableBody, TableHead, TableHeadCell } from './Table';

const meta = {
  title: 'Table',
  component: Table,
  tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <StoryContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeadCell>Country</TableHeadCell>
            <TableHeadCell>Capital</TableHeadCell>
            <TableHeadCell>Population</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>USA</TableCell>
            <TableCell>Washington, D.C.</TableCell>
            <TableCell>309 million</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Sweden</TableCell>
            <TableCell>Stockholm</TableCell>
            <TableCell>9 million</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </StoryContainer>
  ),
};
