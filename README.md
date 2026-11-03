# Digital name card template

Build your own digital name card from one config file. You get a fast, mobile-first page that people can open by scanning a QR code, with no app to install.

## What you get

- **A full-screen card on phones**, with a photo banner and a centred card on desktop
- **Save contact**, which downloads a contact file with your details and photo
- **A QR code side**: drag or flick to flip the card over, and the screen stays awake where the browser allows it
- **Share button**, using the phone's share menu or copying the link
- **Link previews** for chat apps and social sites
- **Offline support** and an app icon for the home screen
- **Automatic dark mode**

## Quick start

You'll need [Node.js](https://nodejs.org) 18 or newer.

```sh
npm install
cp card.example.json card.json
```

Fill in `card.json`, then build and preview:

```sh
npm run build
npm run preview
```

Open http://localhost:8000 to see your card. The site is generated in `dist/`.

## Filling in `card.json`

| Field | Required | Notes |
|---|---|---|
| `firstName` | Yes | |
| `lastName` | No | |
| `title` | Yes | Your job title |
| `organization` | No | Full name, shown on the card and saved to the contact |
| `organizationShort` | No | Shown in brackets after the full name |
| `bio` | No | One line works best |
| `url` | Yes | The full `https://` address your card will live at. The QR code and link previews use it |
| `phone` | No | Only added to the contact file, not shown on the page |
| `emails` | No | Each needs a `label` and an `address`. Set `type` to `work` or `personal` |
| `links` | No | Set `type` to `linkedin`, `github`, `x` or `website`. Add `label` to change the name, as in `"label": "Portfolio"` |
| `photo.file` | No | Path to your photo, relative to `card.json`. Without one, the banner shows your initials |
| `photo.focusX`, `photo.focusY` | No | Where the centre of your face is, from 0 to 1 across and down the photo |

Entries left blank in `emails` and `links` are skipped.

### Choosing a photo

Put your photo in the project's root folder, where it's ignored by Git. A photo at least 800px across looks best, and non-square photos are cropped to a square around `focusX` and `focusY`. A plain background with some space above your head works well, because short banners crop tightly around your face.

As a starting point, if your face is centred and about a third of the way down the photo, use `"focusX": 0.5` and `"focusY": 0.33`. Adjust from there, then rebuild.

## Publishing

These steps use [Cloudflare Pages](https://pages.cloudflare.com), which has a free plan. The `dist/` folder is a plain static site, so other hosts work too. `dist/_headers` is specific to hosts that support that file, such as Cloudflare Pages and Netlify. On other hosts, make sure `contact.vcf` is served as `text/vcard`.

1. Log in and create a project. The name decides your address, such as `your-name.pages.dev`:

   ```sh
   npx wrangler login
   npx wrangler pages project create your-name --production-branch main --force
   ```

   `--force` creates a Pages project directly, since Wrangler otherwise tries to set up a Workers project instead. The command prints your final address. If the name is taken, the address may have extra characters added.

2. Put that exact address in `url` in `card.json`, then build and deploy:

   ```sh
   npm run build
   npx wrangler pages deploy dist --project-name your-name --branch main
   ```

3. Test it on real phones: scan the QR code, save the contact, and flip the card. It's worth trying both iPhone and Android.

Your QR code lives at `dist/qr.svg` if you want to print it. Printed codes only work as long as your address does, so settle on an address first.

### Updating your card

Change `card.json`, then repeat the build and deploy commands. Anyone who has already opened your card sees the update on their second visit, because the offline copy loads first and refreshes in the background.

## Keeping your details private

`card.json`, `dist/` and images in the root folder are ignored by Git, so your details stay out of your repository. If you fork this project, run `git status` before committing to check.

Publishing your card does make its contents public:

- Anyone can see the emails, links and photo on your page.
- Anyone can download `contact.vcf`, including any phone number you added. Leave `phone` blank if you'd rather keep it private.

## Changing the design

| To change | Edit |
|---|---|
| Colours, spacing and fonts | `src/styles.css`. Colours are variables at the top, with a separate set for dark mode |
| Page layout and behaviour | `src/index.template.html` |
| Link icons | `src/link-icons.json` |
| Offline behaviour | `src/sw.js` |
| Generated files, such as the icons and link preview image | `scripts/build.js` |

The accent colour for the app icons and preview image is `ACCENT` in `scripts/build.js`, so change it there too if you change the page's accent.

## License

[MIT](LICENSE)
