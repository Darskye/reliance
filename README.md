# RELIANCE: the website

The film's site is an ISEA workstation running **STARFRAME 95**, the same made-up operating system as the `talos` promo, on a curved CRT tube. Visitors press power, watch it boot, pick an account, and land on a desktop where every part of the site is a program.

## The accounts

The log-on screen lists the crew, who are "still logged on", so you just click one and carry on where they left off. Below them: **New account** (type any name, and it's remembered on that device) and **Visitor** (no account).

| Account | Desktop | Their own programs |
|---|---|---|
| **Cmdr. Roman Reznov** | Never touched since setup: the default teal background and grey-blue title bars. "You last logged on 214 days ago." | Mission Orders, the STARFRAME tour. Empty Disposal. |
| **Dr. Catherine Gray** | Lab green, with the Ichor specimen turning slowly as the wallpaper. | **Ichor Lab**: the specimen in 3D, glowing veins, four imaging modes (visible, UV, thermal, scan), live readouts, a deep scan, and an observation log. **Research Log**: her notes, plus anything you log in the lab. TALOS.EXE. |
| **John Winchester** | Neon: a grid racing toward a striped sun. | **Engine Diag** (live drive, reactor and pod gauges, a CPU graph, a log, and a Tune-up button), **Mixtape** (the promo soundtracks on a cassette deck with a level meter), **Debris Field** (Minesweeper), **Cube Crunch** (Snake, eating Cube Meals), and his joke file. |
| **New account / Visitor** | The starfield with the Helios turning. | The welcome window. |

Every account also has the film's own programs (below), so a visitor can always reach the casting form and the crowdfunding links. Whatever windows a crew account has open when you switch user are open again next time. Accounts, their pictures, wallpapers, programs and balloon messages are set in **`js/desktops.js`**.

## The programs everyone has

| Program | What it is |
|---|---|
| **Mission Brief** | About the film: story, the world (the Dimming, the Allocation Bureau, Ichor...), the crew and cast, production status, press and contact. Looks like a page in ISEA Navigator. |
| **Helios** | HELIOS.SYS: the ship as the live colour-coded wireframe from the spec film. Drag to turn it, scroll or pinch to zoom, tap a system to light it up. Also plays the spec film and the flight-deck shot. |
| **Tape Vault** | The archive: every promo, as tapes you load into a little TV. |
| **Crew Dossier** | The audition and crew sign-up form. When it's sent, it prints the person an ISEA ID badge (with their own photo in green phosphor, if they add one) that they can save and post. |
| **ISEA-NET** | The Instagram pages and a mailing-list sign-up. |
| **Fuel Drive** | GoFundMe and Indiegogo, plus a mailing-list sign-up for the launch. |
| **TALOS.EXE** | A terminal where you can talk to Talos. Type HELP. |
| **Disposal** | The recycle bin. Different in every account. |

Talos greets each account differently. Making a new account called Gray, Reznov or Winchester takes you to theirs.

## The curved screen

The whole site sits on a CRT tube: black bezel, big rounded corners, edges that fall into shadow, a soft window reflection, and scanlines. On a computer in Chrome or Edge the picture also really bends like curved glass. That's an SVG filter (`#crt-warp` in `index.html`, built in `Warp` in `js/os.js`). It bends the boot screens, the log-on backdrop, the wallpapers and the scanlines, but not the windows and icons, so clicks always land where they look and small text stays sharp. Phones, Safari and Firefox get the tube without the bend. The START menu's "CRT effect" switches all of it off.

## Put in the real links

Everything you'll change lives in **`js/config.js`**: the GoFundMe and Indiegogo addresses, the Instagram pages (name, handle, link), the form addresses, the contact email, the press kit link, and the list of tapes. While a link is empty (`''`), the site shows "LINK PENDING" or "Launching soon" and clicking it says "coming soon", so it's safe to go live before you have them all.

### Making the forms actually send

The Crew Dossier and the mailing list need somewhere to send answers. The simplest free option is **Formspree**:

1. Sign up at formspree.io and make two forms ("RELIANCE Crew Dossier" and "RELIANCE mailing list").
2. Copy each form's address (it looks like `https://formspree.io/f/abcdwxyz`).
3. Paste them into `dossierForm` and `mailingListForm` in `js/config.js`.

Answers then arrive in your email and in the Formspree dashboard. Until you do this, the forms still work on screen, but the dossier says "nothing was sent".

## Add a new video to the Tape Vault

1. Make the small web copy and its poster. `tools/encode_videos.sh` does this for every spot in `../reliance-reel/output/`. Add a line for the new spot to its `LIST` (name, file, poster time in seconds), then run it from this folder:

   ```bash
   sh tools/encode_videos.sh
   ```

2. Add a line to `tapes` in `js/config.js` (same `id` as the file name). `new: true` gives it a NEW sticker. Put it first in the list and it's the one the Tape Vault opens on.
3. To change the "New tape recovered" pop-up on the desktop, edit `#balloon` and the "Latest transmission" box in `index.html`.

Web copies are 720×1280, and each one is under ~10 MB, so the site works on any free host.

## Try it on your computer

It has to be served, not double-clicked (browsers block some of it from plain files):

```bash
python -m http.server 8417
```

Then open http://localhost:8417. Handy links: `#archive`, `#archive/midnight`, `#dossier`, `#fund`, `#brief`, `#helios`, `#talos` go straight to that program and skip the intro. Use them in your Instagram bio, e.g. `yoursite.com/#dossier` for a casting call.

## Put it online

It's a plain folder of files: no build step, no server code. Any static host works (GitHub Pages, Cloudflare Pages, Netlify). Upload the whole `reliance-site` folder. Once you have the real web address, change `media/og.jpg` in the `og:image` line of `index.html` to the full address (e.g. `https://yoursite.com/media/og.jpg`) so Instagram, iMessage and others show the preview picture.

After changing a `.js` or `.css` file, bump the `?v=5` on its line in `index.html` (to `?v=6` and so on). Otherwise people who visited before may keep seeing the old version from their browser's cache.

## How it's built

```
index.html        every page of content (the programs' text lives here, inside <div id="apps">)
css/os.css        the STARFRAME look: cream bevels, blue title bars, CRT scanlines, phone layout
js/config.js      links, forms and the tape list (edit this one)
js/desktops.js    every program, and the accounts: who has what, wallpaper, colours, greetings
js/os.js          power, BIOS, splash, the account list, dial-up, desktops and wallpapers, windows,
                  taskbar, start menu, sounds, the curved-glass bend
js/apps.js        the film's programs: the Helios viewer, tape deck, dossier and badge, Talos...
js/crew-apps.js   the crew's programs: Ichor Lab, Research Log, tour, Engine Diag, Mixtape, Disposal
js/games.js       Debris Field and Cube Crunch
js/ichor.js       the Ichor specimen in 3D (plain WebGL): the rock's shape, glowing veins, bloom, dust
media/music       the promo soundtracks, for the Mixtape
js/lib/           shared with the promos: kit.js, emblem.js (ISEA emblem), starframe.js (logo, icons,
                  Helios wireframe), ship_lines.js (the ship), gray_photo.js, talos_face.js
media/video       web copies of the spots     media/posters  one still from each
media/sfx         power, hard drive, modem and startup chime, cut from the TALOS.EXE soundtrack
fonts/            the promos' fonts (SIL Open Font License, see the *-OFL.txt files)
```

On phones every window opens full screen. The CRT effect and sound can be switched off in the START menu, and the site respects "reduce motion".
