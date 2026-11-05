# Noted & Known website

Static public website for Noted & Known: plain HTML, CSS and a little JavaScript, with no build step and no framework.

## Where it lives

- **Source of truth:** this folder, in the app repo.
- **Published copy:** the `singh-studio/noted-known-site` repo, served by GitHub Pages at `https://notedandknown.app/`. `main` there is protected, so publish through a pull request.
- `reference/` is design research from the earlier site and is **not** published. Keep it out of the site repo.

To publish: copy the changed files to a branch of `noted-known-site`, open a PR and merge. See `../docs/release/GITHUB_PUBLISHING_WORKFLOW.md`. The custom domain also needs a `CNAME` file containing `notedandknown.app` in the site repo, and the Pages setting pointing at that domain.

## Store-facing URLs (cited in App Store Connect, so do not break them)

| Page | URL |
|---|---|
| Privacy policy | `https://notedandknown.app/docs/privacy.html` |
| Terms | `https://notedandknown.app/docs/terms.html` |
| Support | `https://notedandknown.app/support.html` |
| Marketing | `https://notedandknown.app/` |

## The App Store link

The app is off sale until a new version is approved, so the home page shows plain text: "Coming back to the App Store soon". There are two of them, one in the hero and one in the closing section, and each is a single element in `index.html`:

```html
<p class="store" data-store-cta>Coming back to the App Store soon</p>
```

When the app is back, swap each one for a link to the listing and keep the `data-store-cta` attribute (ink fill means pressable, so the link takes the `.btn` style):

```html
<p class="store-live" data-store-cta><a class="btn" href="https://apps.apple.com/app/id6766800274">Download on the App Store</a></p>
```

Search for `data-store-cta` to find both. Drop the `.store` class when you do, because it styles the white "coming soon" slab.

## Screens

The phone screens in `assets/screens/` are built from the raw simulator captures in `../docs/release/store-submission-kit/raw/` (the store panels use the same folder). After new captures, run `zsh /Users/krissingh/Developer/noted-known-build/site-screens.sh`.

## Design notes

- Colours and type come from the app's Graph Paper skin (`src/styles/theme.ts`). Highlight means look here, ink fill means pressable, and the five kind colours are used only for the five kinds of note and the logo.
- Fonts are self-hosted from the app (Zen Maru Gothic and Zen Kaku Gothic New, SIL Open Font License, see `assets/fonts/OFL.txt`).
- Motion is paper stop motion at 8 frames a second (one frame every 125 ms, no easing): words arriving in chunks, pieces cut in on steps, shapes recut between three hand-cut paths, the logo's dots dropping in, and the app's SAVE moment ("Noted.") replayed in each kind's colour. It is ported from `src/design/motion/geometry.ts` (`saveFrame`) and `src/design/cut/shapes.ts`, so if those change, update `script.js`. Each moment plays once when it scrolls in and then rests. The one idle loop is the hero logo, which is recut at 8 fps only while the hero is on screen. Links, buttons and the FAQ use one smooth ease-in-out instead.
- Under `prefers-reduced-motion`, or with `#static` on the address (`index.html#static`), everything shows its finished frame at once. Nothing is hidden if JavaScript fails.
- Phone crops (`--crop` on each `figure.phone`) end in the blank between two rows of the screen. If the app's screens change, check each crop against the new capture.

## History

The beta-intake form, the beta FAQ and the data-promises page were retired for the 1.0 launch (2026-07-15). The site was rebuilt for the Noted & Known name on 2026-11-06.
