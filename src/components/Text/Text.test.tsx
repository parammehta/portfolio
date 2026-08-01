import { render, screen } from '@testing-library/react';
import { Text } from 'components/Text';

describe('Text', () => {
  it('renders its children', () => {
    render(<Text>Hello world</Text>);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders as a span by default', () => {
    render(<Text>Default</Text>);
    expect(screen.getByText('Default').tagName).toBe('SPAN');
  });

  it('renders as a custom element via the `as` prop', () => {
    render(<Text as="p">Paragraph</Text>);
    expect(screen.getByText('Paragraph').tagName).toBe('P');
  });

  it('applies size and weight as data attributes', () => {
    render(
      <Text size="l" weight="bold">
        Styled
      </Text>
    );
    const el = screen.getByText('Styled');
    expect(el).toHaveAttribute('data-size', 'l');
    expect(el).toHaveAttribute('data-weight', 'bold');
  });

  it('forwards arbitrary props', () => {
    render(<Text aria-label="labelled">Content</Text>);
    expect(screen.getByLabelText('labelled')).toBeInTheDocument();
  });
});
