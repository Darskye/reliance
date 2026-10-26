# RELIANCE: the website

RELIANCE is an independent science-fiction film directed by Jackson Hartman, written by Darian Lalla & Morgan Messina.

The film's site is an ISEA workstation running **STARFRAME 95**, the same made-up operating system as the `talos` promo, on a curved CRT tube. Visitors press power, watch it boot, pick an account, and land on a desktop where every part of the site is a program.

## The accounts

The log-on screen lists the crew, who are "still logged on", so you just click one and carry on where they left off. Below them: **Visitor** (no account).

| Account | Desktop | Their own programs |
|---|---|---|
| **Cmdr. Roman Reznov** | Never touched since setup: the default teal background and grey-blue title bars. "You last logged on 214 days ago." | **Family**: the ultrasound scan of his baby on the fridge, captioned in his hand in Russian and English. (Add more photos to `PHOTOS` in `js/crew-apps.js`.) Mission Orders, the STARFRAME tour. Empty Disposal. |
| **Dr. Catherine Gray** | Lab green, with the Ichor specimen turning slowly as the wallpaper. | **Ichor Lab**: the specimen in 3D, glowing veins, four imaging modes (visible, UV, thermal, scan), live readouts, a deep scan, and an observation log. **Research Log**: her notes, plus anything you log in the lab. TALOS.EXE. |
| **John Winchester** | Neon: a grid racing toward a striped sun. | **Engine Diag** (live drive, reactor and pod gauges, a CPU graph, a log, and a Tune-up button), **Mixtape** (the promo soundtracks on a cassette deck with a level meter), **Debris Field** (Minesweeper), **Cube Crunch** (Snake, eating Cube Meals), and his joke file. |
| **Kim Seo-yeon** | Software engineer on the Talos program. Violet and cyan, with a network of signals and Talos's face faintly behind it. | **Talos Monitor** (uptime, load, neural activity, the questions Talos asked today, diagnostics, a Pause button that doesn't quite pause), TALOS.EXE, the 1.0.4 patch notes. |
| **Visitor** | The starfield with the Helios turning. | The welcome window. |

Every account has a **Journal**. The crew's are written in their own ink on lined paper (the entries are in `js/desktops.js`). A visitor gets a blank one to write in, saved on that device.

Every account also has the film's own programs (below), so a visitor can always reach the casting form and the crowdfunding links. Whatever windows a crew account has open when you switch user are open again next time. Accounts, their pictures, wallpapers, programs and balloon messages are set in **`js/desktops.js`**.

## The programs everyone has

| Program | What it is |
|---|---|
| **Mission Brief** | About the film: story, the world (the Dimming, the Allocation Bureau, Ichor...), the crew and cast, production status, press and contact. Looks like a page in ISEA Navigator. |
| **Helios** | HELIOS.SYS: the ship as the live colour-coded wireframe from the spec film. Drag to turn it, scroll or pinch to zoom, tap a system to light it up. Also plays the spec film and the flight-deck shot. |
| **Tape Vault** | The archive: every promo, as tapes you load into a little TV. |
| **Crew Dossier** | The audition and crew sign-up form. When it's sent, it prints the person an ISEA ID badge (with their own photo in green phosphor, if they add one) that they can save and post. |
| **ISEA-NET** | The Instagram pages and a mailing-list sign-up. |
| **Fuel Drive** | The GoFundMe campaign, plus a mailing-list sign-up. |
| **ISEA Messenger** | The crew's chat program, laid out like a 2000s instant messenger: contacts with status dots and personal messages, "says:" lines, emoticons, nudges that shake the window. Logged on as crew, you see that person's chats and can type (the others answer; Reznov is always Away; Talos answers like TALOS.EXE). Visitors read every conversation as an archive and can message Talos. The conversations are in `js/messenger.js`. |
| **TALOS.EXE** | A terminal where you can talk to Talos. Type HELP. |
| **Disposal** | The recycle bin. Different in every account. |

Talos greets each account differently.

## The curved screen

The whole site sits on a CRT tube: black bezel, big rounded corners, edges that fall into shadow, a soft window reflection, and scanlines. On a computer in Chrome or Edge the picture also really bends like curved glass. That's an SVG filter (`#crt-warp` in `index.html`, built in `Warp` in `js/os.js`). It bends the boot screens, the log-on backdrop, the wallpapers and the scanlines, but not the windows and icons, so clicks always land where they look and small text stays sharp. Phones, Safari and Firefox get the tube without the bend. The START menu's "CRT effect" switches all of it off.

## The links

Everything you'll change lives in **`js/config.js`**: the GoFundMe address, the Instagram pages (name, handle, link), the form addresses, the contact email, the press kit link, and the list of tapes. The GoFundMe and the four Instagram pages are filled in. Anything still empty (`''`) shows "LINK PENDING", and clicking it says "coming soon".

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

Then open http://localhost:8417. Handy links: `#archive`, `#archive/ship`, `#dossier`, `#fund`, `#brief`, `#helios`, `#talos` go straight to that program and skip the intro.

## It's online

**Live at https://reliancemovie.com/**, served by GitHub Pages from the `main` branch of [github.com/Darskye/reliance](https://github.com/Darskye/reliance). This folder is that repo. The old address, darskye.github.io/reliance, redirects there.

The domain is registered at GoDaddy. Its DNS points at GitHub with four A records on `@` (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) and a CNAME on `www` pointing to `darskye.github.io`. The `CNAME` file in this folder tells GitHub which domain the site answers to.

To update the live site, save your changes, then from this folder:

```bash
git add -A && git commit -m "Describe the change" && git push
```

GitHub rebuilds it in a minute or two. Handy links for Instagram: `https://reliancemovie.com/#dossier` (casting), `#fund`, `#archive/dimming`.

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
js/messenger.js   ISEA Messenger: the contacts, every conversation, the auto-replies
js/ichor.js       the Ichor specimen in 3D (plain WebGL): the rock's shape, glowing veins, bloom, dust
media/music       the promo soundtracks, for the Mixtape
media/reznov      Reznov's ultrasound photo (made on Higgsfield; the full-size originals are in tools/reznov_src, not uploaded)
js/lib/           shared with the promos: kit.js, emblem.js (ISEA emblem), starframe.js (logo, icons,
                  Helios wireframe), ship_lines.js (the ship), gray_photo.js, talos_face.js
media/video       web copies of the spots     media/posters  one still from each
media/sfx         power, hard drive, modem and startup chime, cut from the TALOS.EXE soundtrack
fonts/            the promos' fonts (SIL Open Font License, see the *-OFL.txt files)
```

On phones every window opens full screen. The CRT effect and sound can be switched off in the START menu, and the site respects "reduce motion".
