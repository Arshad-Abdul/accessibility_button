# Accessibility Toolbar

Reusable accessibility toolbar for websites with a one-line embed option. This repository contains both the original demo page and a standalone script that injects the toolbar automatically on any site.

## One-Line Usage

Add this line to any website:

```html
<script src="https://cdn.jsdelivr.net/gh/Arshad-Abdul/accessibility_button/accessibility-toolbar.js"></script>
```

If you specifically want a one-line JavaScript loader instead of a direct script tag, use:

```html
<script>!function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/Arshad-Abdul/accessibility_button/accessibility-toolbar.js';document.head.appendChild(s)}();</script>
```

If jsDelivr is blocked on the target site, this fallback also serves the same file:

```html
<script src="https://rawcdn.githack.com/Arshad-Abdul/accessibility_button/main/accessibility-toolbar.js"></script>
```

For production use, prefer a tagged release or a commit hash so the embed stays stable.

## One-Line Customization

You can keep it to one line and still customize the widget with data attributes:

```html
<script src="https://cdn.jsdelivr.net/gh/Arshad-Abdul/accessibility_button/accessibility-toolbar.js" data-position="bottom-right" data-accent="#0f766e" data-storage-key="site-a11y" data-reading-band-size="150"></script>
```

Supported attributes:

- `data-position="bottom-left"` or `data-position="bottom-right"`
- `data-accent="#2563eb"` for the launcher and action color
- `data-storage-key="your-key"` to avoid collisions with another embed
- `data-reading-band-size="130"` to adjust the reading overlay strip height

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

- `index.html` - demo page showing the toolbar and copyable integration snippets
- `accessibility-toolbar.js` - standalone embeddable widget for one-line website integration

## Quick Start

1. Clone or download this repository.
2. Open `index.html` in any modern browser.

If you prefer to run it through a local server, you can use:

```bash
python -m http.server
```

Then open `http://localhost:8000` in your browser.

## Dependencies

The embeddable script has no Font Awesome dependency. It loads OpenDyslexic only when the dyslexia-friendly font option is enabled.

The demo page still includes these external stylesheets:

- Font Awesome 4.7.0
- `@fontsource/opendyslexic`

## How It Works

- A floating accessibility button opens the toolbar.
- Each option toggles a visual mode by adding or removing CSS classes on the page.
- Font sizing is updated at the document root so text scales across the site.
- User preferences are stored in `localStorage`.
- Saved preferences are restored automatically on page load.

## Reuse In Another Website

1. Use the one-line script tag if you want the fastest integration.
2. Use the `data-*` attributes if you need lightweight customization.
3. Use `accessibility-toolbar.js` directly if you want to self-host the script.
4. Fall back to the manual demo code only if you need deep structural customization.

## Customization

- Change button colors and menu styling to match your brand.
- Move the launcher button with `data-position` or by editing the widget source.
- Add or remove toolbar options depending on the needs of your users.
- Rename the `localStorage` key with `data-storage-key` if you plan to embed multiple similar widgets.
- Self-host `accessibility-toolbar.js` if you do not want to use jsDelivr.

## Browser Support

This project is intended for modern desktop and mobile browsers, including:

- Chrome and Edge
- Firefox
- Safari
- Opera
- Mobile browsers

## Notes

- This is a static frontend project with no build step.
- The repo includes both a demo page and a portable embeddable script.