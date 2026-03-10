# Accessibility Toolbar

Reusable accessibility toolbar demo for websites. This project is a single-file implementation built with plain HTML, CSS, and JavaScript, so it is easy to preview locally and straightforward to copy into another site.

## Features

- Font size controls from 80% to 200%
- High contrast mode
- Dark mode
- Low vision mode
- Large cursor
- Underline links
- Highlight links
- Dyslexia-friendly font with OpenDyslexic
- Wider letter spacing
- Increased line height
- Reading mode with a focused reading band
- Persistent user preferences with localStorage

## Project Structure

- `index.html` - complete demo page, toolbar markup, styles, and JavaScript logic

## Quick Start

1. Clone or download this repository.
2. Open `index.html` in any modern browser.

If you prefer to run it through a local server, you can use:

```bash
python -m http.server
```

Then open `http://localhost:8000` in your browser.

## Dependencies

The demo pulls in two external stylesheets:

- Font Awesome 4.7.0
- `@fontsource/opendyslexic`

## How It Works

- A floating accessibility button opens the toolbar.
- Each option toggles a visual mode by adding or removing CSS classes on the page.
- Font sizing is updated directly on the `body` element.
- User preferences are stored under the `accessibilitySettings` key in `localStorage`.
- Saved preferences are restored automatically on page load.

## Reuse In Another Website

1. Copy the toolbar HTML markup into your page.
2. Copy the related CSS styles for the button, menu, and accessibility modes.
3. Copy the JavaScript functions that manage toggles and persistence.
4. Include the required CDN links in the page head.
5. Adjust colors, placement, and menu options to match your site.

## Customization

- Change button colors and menu styling to match your brand.
- Move the launcher button by updating its fixed position values.
- Add or remove toolbar options depending on the needs of your users.
- Rename the `localStorage` key if you plan to embed multiple similar widgets.
- Split the single file into separate HTML, CSS, and JavaScript files if you want a cleaner production structure.

## Browser Support

This project is intended for modern desktop and mobile browsers, including:

- Chrome and Edge
- Firefox
- Safari
- Opera
- Mobile browsers

## Notes

- This is a static frontend project with no build step.
- The current implementation keeps everything in one file for portability and quick integration.