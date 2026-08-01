import { render, screen } from '@testing-library/react';
import { Resume } from './Resume';

// The PDF embed is deliberately client-only, so these assertions cover the
// post-hydration render that a server-rendered snapshot would not show.
describe('Resume', () => {
  it('always renders the download and open-in-new-tab actions', () => {
    render(<Resume />);
    expect(screen.getByText('Download PDF')).toBeInTheDocument();
    expect(screen.getByText('Open in new tab')).toBeInTheDocument();
  });

  it('renders the PDF viewer once mounted on a desktop viewport', () => {
    window.innerWidth = 1280;
    render(<Resume />);
    expect(screen.getByTitle('Resume PDF')).toBeInTheDocument();
  });

  it('renders the mobile fallback instead of the viewer on small viewports', () => {
    window.innerWidth = 375;
    render(<Resume />);
    expect(screen.queryByTitle('Resume PDF')).not.toBeInTheDocument();
    expect(screen.getByText(/PDF preview isn't available on mobile/)).toBeInTheDocument();
  });
});
