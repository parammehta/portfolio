import { screen } from '@testing-library/react';
import { renderPage } from './renderPage';

const Stub = () => <p>stub page</p>;

describe('app shell', () => {
  it('wraps every page in the navbar, skip link and main landmark', () => {
    renderPage(Stub);

    expect(screen.getByText('Skip to main content')).toHaveAttribute(
      'href',
      '#MainContent'
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'MainContent');
    expect(screen.getByRole('main')).toContainElement(screen.getByText('stub page'));
  });

  it('exposes every primary nav destination', () => {
    renderPage(Stub);

    const nav = screen.getByRole('navigation');
    ['Profile', 'Experience', 'Skills', 'Resume', 'Articles', 'Contact'].forEach(
      label => {
        expect(nav).toContainElement(screen.getByRole('link', { name: label }));
      }
    );
  });

  it('links the social accounts out to their external profiles', () => {
    renderPage(Stub);

    expect(screen.getByRole('link', { name: 'Github' })).toHaveAttribute(
      'href',
      'https://github.com/parammehta'
    );
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/parammehta/'
    );
  });

  it('applies the stored theme to the document', () => {
    renderPage(Stub);
    expect(document.querySelector('[data-theme]')).toBeTruthy();
  });
});
