// config.js — EVERYTHING YOU'LL WANT TO CHANGE LATER LIVES HERE.
// Links left as '' show "LINK PENDING" on the site, and clicking them says "coming soon".
// Paste the real address between the quotes when you have it, save, and re-upload the site.
window.RELIANCE_CONFIG = {

  // ---------------------------------------------------------------- crowdfunding
  gofundme: 'https://www.gofundme.com/f/backing-our-scifi-feature-film',

  // ---------------------------------------------------------------- Instagram pages (ISEA-NET app)
  // handle: shown on the card, e.g. '@reliancefilm'.  url: the full Instagram link.
  instagram: [
    { name: 'RELIANCE', role: 'Official film account: news, casting calls, behind the scenes', handle: '@reliance_film', url: 'https://www.instagram.com/reliance_film/', icon: 'star' },
    { name: 'Jackson Hartman', role: 'Director', handle: '@jacksonlhartman', url: 'https://www.instagram.com/jacksonlhartman/', icon: 'tape' },
    { name: 'Darian Lalla', role: 'Co-writer', handle: '@darskye', url: 'https://www.instagram.com/darskye/', icon: 'station' },
    { name: 'Morgan Messina', role: 'Co-writer · Dr. Catherine Gray', handle: '@_morgan_messina_', url: 'https://www.instagram.com/_morgan_messina_/', icon: 'station' },
  ],

  // ---------------------------------------------------------------- forms
  // Where the Crew Dossier (auditions) and the mailing list send their answers.
  // The easiest free option is Formspree (formspree.io): make a form, copy its address
  // (looks like 'https://formspree.io/f/abcdwxyz') and paste it here.
  // While these are '', the forms still work on screen but nothing is sent anywhere.
  dossierForm: '',
  mailingListForm: '',

  // ---------------------------------------------------------------- contact + press
  contactEmail: '',        // e.g. 'hello@yourfilm.com' (press, casting questions)
  pressKit: '',            // link to a press kit / EPK folder (Google Drive, Dropbox...)

  // ---------------------------------------------------------------- the Tape Vault (Archive app)
  // To add a new video: put the mp4 in media/video/, a poster image in media/posters/,
  // and add a line here. "new: true" puts a NEW sticker on it.
  tapes: [
    { id: 'midnight', cat: 'Recovered tapes', title: 'The Midnight Hour with Dale Harper', runtime: '0:46', new: true,
      desc: 'An off-air VHS of a late-night talk show. Tonight\'s guest is the agency\'s thinking machine, in an early form: Talos.' },
    { id: 'talos', cat: 'Recovered tapes', title: 'TALOS.EXE', runtime: '0:58',
      desc: 'Workstation capture. Dr. Catherine Gray logs on to STARFRAME 95 and opens a program called TALOS.' },
    { id: 'ident', cat: 'ISEA broadcasts', title: 'ISEA Station Ident', runtime: '0:12',
      desc: 'The agency\'s on-air logo, built piece by piece on a tube television. Moving forward, together.' },
    { id: 'recruit', cat: 'ISEA broadcasts', title: 'ISEA Is Recruiting', runtime: '0:24',
      desc: 'A public-service announcement calling the best and brightest to the stars.' },
    { id: 'dimming', cat: 'ISEA broadcasts', title: 'The Dimming: Public Information Film No. 7', runtime: '1:01',
      desc: 'An Allocation Bureau broadcast cuts into the evening forecast. Light. Water. Power. Food. Every watt counts.' },
    { id: 'ship', cat: 'Technical films', title: 'Helios Spec Film', runtime: '1:00',
      desc: 'Deep space survey vessel Helios, hull RV-2719: dimensions, systems, thermal and section views.' },
    { id: 'cockpit', cat: 'Technical films', title: 'Helios Flight Deck', runtime: '0:20',
      desc: 'Flight recorder. The deck powers up in orbit as the sun comes over the horizon.' },
    { id: 'grayfile', cat: 'Personnel files', title: 'Personnel File: Dr. Catherine Gray', runtime: '0:36',
      desc: 'Her agency record, photograph and ID badge. Morgan Messina as Dr. Catherine Gray.' },
    { id: 'graynews', cat: 'Personnel files', title: 'ISEA Newswire: Science Officer Named', runtime: '0:41',
      desc: 'The article naming Dr. Gray Science Officer of the Helios, and her interview.' },
    { id: 'cubemeal', cat: 'Commercials', title: 'Cube Meal', runtime: '0:41',
      desc: 'The crew\'s favourite space food, proud sponsor of the ISEA. Be there and be square!' },
    { id: 'cybercuff', cat: 'Commercials', title: 'Kotoshima CyberCuff', runtime: '1:32',
      desc: 'The wrist computer every ISEA crew member wears, from Kotoshima Technologies. Seven colours. Get cuffed!' },
  ],
};
