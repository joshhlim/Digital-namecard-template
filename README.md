# Digital name card template

Build your own digital name card from one simple form. You get a fast, mobile-first page that people open by scanning your QR code, with no app to install.

**New to this?** Follow the [step-by-step guide](#step-by-step-guide). No coding is needed.

## What you get

- **A full-screen card on phones**, with a photo banner and a centred card on desktop
- **Your company logo**, if you want one
- **Save contact**, which downloads a contact file with your details and photo
- **A QR code side**: drag or flick to flip the card over, and the screen stays awake where the browser allows it
- **Share button**, using the phone's share menu or copying the link
- **Link previews** for chat apps and social sites
- **Offline support** and an app icon for the home screen
- **Automatic dark mode**

## Quick start

If you're comfortable with a terminal and have [Node.js](https://nodejs.org) 18 or newer:

```sh
npm install
cp card.example.json card.json
# Fill in card.json, then:
npm run build
npm run preview
```

Open http://localhost:8000 to see your card. The site is generated in `dist/`. See [publishing](#step-7-put-your-card-online) to put it online, and [the field reference](#what-each-field-means) for `card.json`.

## Step-by-step guide

This takes about 30 minutes. You'll type a few commands, and each one is given below to copy and paste.

### Step 1: Install what you need

1. Install [Node.js](https://nodejs.org). Choose the **LTS** version and accept the defaults.
2. Install a code editor to fill in your details. [Visual Studio Code](https://code.visualstudio.com) is free. Avoid TextEdit and Word, which can change quotation marks and break the file.

### Step 2: Download this project

1. On this page, click the green **Code** button, then **Download ZIP**.
2. Unzip it and move the folder somewhere easy to find, such as your Documents folder.

Using Git instead? Click **Use this template** to create your own copy, then clone it. Your details stay out of the copy, as explained in [keeping your details private](#keeping-your-details-private).

### Step 3: Open a terminal in the folder

- **Mac:** Open **Terminal**, type `cd` followed by a space, drag the folder into the window, and press Enter.
- **Windows:** Open the folder in File Explorer, right-click an empty area, and choose **Open in Terminal**.

Then run this once to download the tools the project needs:

```sh
npm install
```

### Step 4: Add your details

1. Create your own copy of the form:

   ```sh
   cp card.example.json card.json
   ```

2. Copy your photo and company logo, if you have them, into the same folder.
3. Open `card.json` in your code editor and fill it in. Here's a finished example:

   ```json
   {
     "firstName": "Alex",
     "lastName": "Tan",
     "title": "Data Analyst",
     "organization": "Example Company",
     "organizationShort": "EC",
     "bio": "Turning messy data into clear decisions.",
     "url": "https://alex-tan.pages.dev/",
     "phone": "+65 9123 4567",
     "emails": [
       { "label": "Work", "type": "work", "address": "alex@example.com" }
     ],
     "links": [
       { "type": "linkedin", "url": "https://www.linkedin.com/in/example" },
       { "type": "website", "label": "Portfolio", "url": "https://example.com" }
     ],
     "logo": {
       "file": "company-logo.png",
       "background": "#ffffff"
     },
     "photo": {
       "file": "my-photo.jpg",
       "focusX": 0.5,
       "focusY": 0.33
     }
   }
   ```

   - Keep every quotation mark, comma and bracket as shown. Only change the text between the quotes.
   - Leave anything you don't want as empty quotes, like `""`.
   - For `url`, think of a name for your card, such as `https://your-name.pages.dev/`. You'll confirm it in step 7.

**Your phone number** isn't shown on the page, but anyone who downloads your contact file can see it. Leave it blank if you'd rather keep it private.

### Step 5: Build your card

```sh
npm run build
```

If something needs fixing, the message tells you what. Fix it in `card.json`, save, and run the command again.

### Step 6: Preview your card

```sh
npm run preview
```

Open http://localhost:8000 in your browser. If your face is cropped badly, see [adjusting your photo](#adjusting-your-photo). When you're finished, press **Ctrl+C** in the terminal to stop the preview. After any change, run `npm run build` again.

### Step 7: Put your card online

These steps use [Cloudflare Pages](https://pages.cloudflare.com), which has a free plan.

1. [Create a free Cloudflare account](https://dash.cloudflare.com/sign-up).
2. Log in from the terminal. A browser page opens, so click **Allow**:

   ```sh
   npx wrangler login
   ```

3. Create your project, replacing `your-name` with the name you chose. Use lowercase letters, numbers and hyphens:

   ```sh
   npx wrangler pages project create your-name --production-branch main --force
   ```

   The command prints your card's final address. **If the name is taken, the address may have extra characters added.** The `--force` part creates a Pages project directly, since Wrangler otherwise tries to set up a Workers project.

4. Make sure `url` in `card.json` is exactly that address. Your QR code is made from it, so a wrong address means a QR code that doesn't work.

5. Build and publish:

   ```sh
   npm run build
   npx wrangler pages deploy dist --project-name your-name --branch main
   ```

Your card is now online.

### Step 8: Test it on real phones

- Scan the QR code with another phone.
- Tap **Save contact** and check that your details and photo come through.
- Flip the card, tap your links, and send your link in a chat to see the preview.

Try both iPhone and Android if you can. Your QR code is saved at `dist/qr.svg` if you want to print it. Printed codes only work as long as your address does, so settle on an address first.

### Updating your card later

Change `card.json`, open a terminal in the folder, and run:

```sh
npm run build
npx wrangler pages deploy dist --project-name your-name --branch main
```

Anyone who has opened your card before sees the update on their second visit, because the saved offline copy loads first and refreshes in the background.

### If something goes wrong

| What you see | What to do |
|---|---|
| `npm` or `node` isn't recognised | Close the terminal and open a new one. If it still fails, reinstall Node.js |
| On Windows, `npm.ps1 cannot be loaded` | Use **Command Prompt** instead of PowerShell. In Command Prompt, use `copy` instead of `cp` |
| `Couldn't find card.json` | Do step 4, and check that your terminal is in the project folder |
| `EADDRINUSE` when previewing | Something else is using port 8000. Close it, or run `npx http-server dist -p 8001 -c-1` and open http://localhost:8001 |
| `card.json isn't valid JSON` | A quote, comma or bracket is missing or extra. Compare your file with the example |
| `Couldn't find the photo` or `the logo` | Check the file is in the folder and the name matches exactly, including `.jpg` or `.png` |
| The QR code opens the wrong page | Set `url` to your exact address, then build and publish again |
| Your changes don't appear | Run `npm run build` first, then reload the page twice |

## What each field means

| Field | Required | Notes |
|---|---|---|
| `firstName` | Yes | |
| `lastName` | No | |
| `title` | Yes | Your job title |
| `organization` | No | Full name, shown on the card and saved to the contact |
| `organizationShort` | No | Shown in brackets after the full name |
| `bio` | No | One line works best |
| `url` | Yes | The full `https://` address of your card. The QR code and link previews use it |
| `phone` | No | Only added to the contact file, not shown on the page |
| `emails` | No | Each needs a `label` and an `address`. Set `type` to `work` or `personal` |
| `links` | No | Set `type` to `linkedin`, `github`, `x` or `website`. Add `label` to change the name, as in `"label": "Portfolio"` |
| `logo.file` | No | Path to your company logo, relative to `card.json`. Shown beside your name |
| `logo.background` | No | Colour behind the logo. Defaults to white. Use a dark colour like `#16202a` if your logo is white |
| `photo.file` | No | Path to your photo, relative to `card.json`. Without one, the banner shows your initials |
| `photo.focusX`, `photo.focusY` | No | Where the centre of your face is, from 0 to 1 across and down the photo |

Entries left blank in `emails` and `links` are skipped.

### Adjusting your photo

Non-square photos are cropped to a square around your face, and a photo at least 800px across looks best. Choose one with a plain background and some space above your head, because short banners crop tightly around your face.

`focusX` and `focusY` say where the centre of your face is. For example, `"focusX": 0.5` means halfway across, and `"focusY": 0.33` means a third of the way down. If your head is cut off, adjust the numbers and rebuild.

### Adding a logo

A PNG with a transparent background or an SVG works best, and JPG and WebP work too. Wide logos suit the space best. **Check that you're allowed to use your company's logo first**, as many organisations have rules about how it can be used.

## Keeping your details private

`card.json`, `dist/` and any images in the main folder are ignored by Git, so they stay out of your repository if you make one. Run `git status` before committing to check.

Publishing your card does make its contents public:

- Anyone can see the emails, links, photo and logo on your page.
- Anyone can download `contact.vcf`, including any phone number you added.

## Changing the design

| To change | Edit |
|---|---|
| Colours, spacing and fonts | `src/styles.css`. Colours are variables at the top, with a separate set for dark mode |
| Page layout and behaviour | `src/index.template.html` |
| Link icons | `src/link-icons.json` |
| Offline behaviour | `src/sw.js` |
| Generated files, such as the icons and link preview image | `scripts/build.js` |

The accent colour for the app icons and preview image is `ACCENT` in `scripts/build.js`, so change it there too if you change the page's accent.

## Other hosts

The `dist/` folder is a plain static site, so other hosts work too. `dist/_headers` applies on hosts that support it, such as Cloudflare Pages and Netlify. Elsewhere, make sure `contact.vcf` is served as `text/vcard`.

## License

[MIT](LICENSE)
