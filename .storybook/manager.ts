import { themes } from 'storybook/theming';
import { addons } from 'storybook/manager-api';

// Data URI, not a parammehta.com URL: brandImage previously pointed at a
// hosted path, which meant the sidebar logo was broken in local dev and in
// any Storybook build until the main site had that exact path live — a
// deploy-order dependency the Storybook build shouldn't have. This is the
// site's own "PM" wordmark (Wordmark component's path, flattened to a
// static white-fill SVG since this config takes an image, not a component),
// inlined so it works everywhere unconditionally.
const wordmark =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NiIgaGVpZ2h0PSIyOSIgdmlld0JveD0iMCAwIDQ2IDI5IiBmaWxsPSIjZmZmIj4KICA8cGF0aAogICAgdHJhbnNmb3JtPSJyb3RhdGUoMTgwIDIzIDE1KSIKICAgIGQ9Ik0gMTAuMzI4MSAxNy43ODg4IGwgNC40ODc1IC0xMS40Njg4IGwgMC4wMDE5IC0wLjAwMDYgbCA2LjA3NSAxMS41MjYzIGEgMC41MjM4IDAuNTIzOCA5MCAwIDAgMC45NTI1IC0wLjA1ODEgbCAyLjExODcgLTUuNTE1IGEgMC41Mjg4IDAuNTI4OCA5MCAwIDAgLTAuMDI1IC0wLjQyODggTCAxOC45NDE5IDIuMjUzMSBBIDQuMTg2MyA0LjE4NjMgOTAgMCAwIDE1LjIyOTQgMCBoIC0yLjg3NSBhIDAuNTI1IDAuNTI1IDkwIDAgMCAtMC40NjI1IDAuNzY4OCBsIDIuMjY4NyA0LjMwNDQgbCAtMi4yODQ0IDUuNzE4OCBsIC00LjQ1IC04LjUzODggQSA0LjE4NjMgNC4xODYzIDkwIDAgMCAzLjcxMzggMCBoIC0yLjg3NSBhIDAuNTI2MiAwLjUyNjIgOTAgMCAwIC0wLjQ2NzUgMC43Njg4IEwgOS4zNzUgMTcuODQ2MiBhIDAuNTI0NCAwLjUyNDQgOTAgMCAwIDAuOTUyNSAtMC4wNTc1IHogTSAyNi40OTUgNS41MDM3IGEgMC41MjE5IDAuNTIxOSA5MCAwIDAgMC4yNDE5IC0wLjI3ODcgdiAwLjAwMDYgbCAxLjY2ODcgLTQuNTE4OCBhIDAuNTIzOCAwLjUyMzggOTAgMCAwIC0wLjQ5MDYgLTAuNzA1NiBoIC00LjExMTMgYSAwLjUyMzEgMC41MjMxIDkwIDAgMCAtMC40NiAwLjc3MzcgbCAyLjQ0MTkgNC41MTYzIGMgMC4xMzc1IDAuMjU2MiAwLjQ1NTYgMC4zNSAwLjcwOTQgMC4yMTI1IHogTSAzOS4zNzUgMCBsIDAgMTguMTI1IEwgMzQuMzc1IDE4LjEyNSBsIDAgLTExLjg3NSBBIDQuMTg2MyA0LjE4NjMgOTAgMCAwIDM0LjM3NSAxOC4xMjUgTCAzNC4zNzUgMTguMTI1IEwgMzQuMzc1IDAgeiB6IgogIC8+Cjwvc3ZnPgo=';

addons.setConfig({
  theme: {
    ...themes.dark,
    brandImage: wordmark,
    brandTitle: 'Param Mehta Components',
    brandUrl: 'https://parammehta.com',
  },
});
