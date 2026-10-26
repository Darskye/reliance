// desktops.js: every program on the workstation, and the accounts you can log on as.
// Each crew member's desktop is set up the way they'd leave it: Reznov never touches his,
// Gray's is a research lab, Winchester's is games and engineering tools, Kim's is Talos.
// Every account has a journal; its entries are written here too.
window.Desktops = (function () {
  // w / h = window size on a computer (on phones every window is full screen)
  const APPS = {
    welcome: { title: 'WELCOME.TXT', label: 'Welcome', icon: 'doc', w: 660, h: 600 },
    tour: { title: 'Welcome back', label: 'Tour', icon: 'station', w: 480, h: 340 },
    brief: { title: 'Mission Brief · ISEA Navigator', label: 'Mission Brief', icon: 'globe', w: 900, h: 680, desc: 'The story, the world, the crew' },
    helios: { title: 'HELIOS.SYS', label: 'Helios', icon: 'ship', w: 1040, h: 660, desc: 'Take the ship apart' },
    archive: { title: 'Tape Vault · ISEA Archive', label: 'Tape Vault', icon: 'tape', w: 1000, h: 700, desc: 'Every broadcast so far' },
    dossier: { title: 'Crew Dossier · Form 7-A', label: 'Crew Dossier', icon: 'idcard', w: 780, h: 700, desc: 'Audition or join the crew' },
    comms: { title: 'ISEA-NET', label: 'ISEA-NET', icon: 'dish', w: 720, h: 620, desc: 'Instagram and news' },
    fund: { title: 'Fuel Drive', label: 'Fuel Drive', icon: 'battery', w: 700, h: 680, desc: 'Back us on GoFundMe' },
    talos: { title: 'TALOS.EXE', label: 'TALOS.EXE', icon: 'talos', w: 720, h: 540, desc: 'Say hello', cls: 'talos-win' },
    journal: { title: 'Journal', label: 'Journal', icon: 'book', w: 620, h: 640 },
    msgr: { title: 'ISEA Messenger', label: 'Messenger', icon: 'msgr', w: 880, h: 620, desc: 'Read the crew\'s chats', cls: 'msgr-win' },
    bin: { title: 'Disposal', label: 'Disposal', icon: 'bin', w: 470, h: 430 },
    // Gray
    ichor: { title: 'ICHOR LAB · Specimen IC-0417', label: 'Ichor Lab', icon: 'rock', w: 1080, h: 690, desc: 'Study the specimen' },
    notes: { title: 'research_log.txt · Notepad', label: 'Research Log', icon: 'doc', w: 620, h: 580 },
    // Reznov
    photos: { title: 'Family · Photos', label: 'Family', icon: 'photo', w: 520, h: 680 },
    orders: { title: 'mission_orders.txt · Notepad', label: 'Mission Orders', icon: 'doc', w: 580, h: 540 },
    // Winchester
    diag: { title: 'DIAG.EXE · Helios Engineering', label: 'Engine Diag', icon: 'gauge', w: 880, h: 660, desc: 'Live ship systems' },
    mixtape: { title: 'MIXTAPE.EXE', label: 'Mixtape', icon: 'music', w: 540, h: 660, desc: 'The soundtracks' },
    mines: { title: 'Debris Field', label: 'Debris Field', icon: 'flag', w: 430, h: 560, desc: 'Clear the sector' },
    snake: { title: 'Cube Crunch', label: 'Cube Crunch', icon: 'cube', w: 540, h: 660, desc: 'Eat the Cube Meals' },
    jokes: { title: 'winchester_jokes.doc · Notepad', label: 'jokes.doc', icon: 'doc', w: 560, h: 540 },
    // Kim
    talosmon: { title: 'TALOSMON · Talos Program Monitor', label: 'Talos Monitor', icon: 'jar', w: 860, h: 660, desc: 'Watch Talos think' },
    patch: { title: 'talos_1.0.4_patch_notes.txt · Notepad', label: 'Patch Notes', icon: 'doc', w: 600, h: 560 },
  };

  // the film's own programs: every account has these, so visitors can always reach them
  const SITE = ['brief', 'helios', 'archive', 'dossier', 'comms', 'fund'];

  // journal entries: [date, text]. Dates count days into Year 19 of the Dimming.
  const ACCOUNTS = {
    reznov: {
      key: 'reznov', name: 'Cmdr. Roman Reznov', short: 'Commander', pic: 'insignia', theme: 'basic',
      status: () => 'Logged on · last active 214 days ago',
      desk: ['photos', 'journal', 'msgr', 'orders', ...SITE, 'bin'],
      session: ['photos', 'tour'],
      balloon: { title: 'STARFRAME TIP', text: 'Click an icon once to open it.', small: 'Tip 1 of 212', open: 'tour' },
      talos: 'Commander. It has been 214 days.',
      bin: [],
      ink: '#1c2a5a',
      journal: [
        ['Day 112', 'Orders came today. Nine months. Anya counted on her fingers, then went to make tea and did not come back for a while. The baby is due in the seventh month of the mission.'],
        ['Day 140', 'Mama knitted me socks for space. Papa says a man should be there when his child is born. Mama says a man should come home. They are both right. I did not tell them that.'],
        ['Day 171', 'Anya wants Sasha if it is a boy. Mila if it is a girl. I said Sasha works for both. She threw a slipper at me. I think that means yes.'],
        ['Day 203', 'Met the crew properly. Dr. Gray works too late. Winchester talks too much. Good. A quiet ship is a frightened ship.'],
        ['Day 226', 'Scanned the picture of the baby into the computer. The computer asked if I wanted to make it my "wallpaper". No.'],
        ['Day 230', 'Packed: the scan of the baby. Mama\'s socks. Anya\'s letter. I am not to open it until we leave orbit. I will not open it until we leave orbit.'],
      ],
    },
    gray: {
      key: 'gray', name: 'Dr. Catherine Gray', short: 'Dr. Gray', pic: 'photo', theme: 'lab',
      desk: ['ichor', 'notes', 'journal', 'msgr', 'talos', ...SITE, 'bin'],
      session: ['notes', 'ichor'],
      balloon: { title: 'ICHOR LAB', text: 'Overnight scan complete. 3 new readings.', small: 'Click to open the lab', open: 'ichor' },
      talos: 'Hello, Dr. Gray.',
      bin: [
        { icon: 'doc', name: 'password_reminder.txt', note: 'Catherine, PLEASE stop writing your password on sticky notes. We can all see it. — ISEA IT' },
        { icon: 'doc', name: 'coffee_order.txt', note: 'Black. No sugar. No talking to me before it.' },
      ],
      ink: '#245c3e',
      journal: [
        ['Day 96', 'Specimen IC-0417 came today. Warm to the touch. I held it longer than protocol allows. I don\'t regret it.'],
        ['Day 131', 'Mom used to split her ration in half and tell me she\'d already eaten. I knew. I always knew. Every time someone says "every watt counts" I think of her.'],
        ['Day 158', 'Talos ran my spectral analysis in four minutes. It took me four days to check it. He was right about everything. I should feel relieved.'],
        ['Day 190', 'Reznov asked if I\'m sleeping. I said yes. He knew I was lying, and he let it go. I think I\'m going to like him.'],
        ['Day 214', 'Winchester asked what I\'ll miss most. I said rain. He said Cube Meals. I laughed so hard I forgot to be nervous.'],
        ['Day 229', 'I\'ve always felt more at home among the stars than anywhere down here. Soon I find out if that\'s true.'],
      ],
    },
    winchester: {
      key: 'winchester', name: 'John Winchester', short: 'Winchester', pic: 'pad', theme: 'arcade',
      desk: ['diag', 'mixtape', 'msgr', 'mines', 'snake', 'journal', 'jokes', ...SITE, 'talos', 'bin'],
      session: ['diag', 'mixtape', 'msgr'],
      balloon: { title: 'DIAG.EXE', text: 'Nozzle 4 running 0.3% hot.', small: 'Probably fine.', open: 'diag' },
      talos: 'Hello, Mr. Winchester. Please stop overclocking the main drive.',
      bin: [
        { icon: 'cube', name: 'cubemeal_wrapper.trash', note: 'BE THERE AND BE SQUARE! Contains 0% real strawberries.' },
        { icon: 'cube', name: 'cubemeal_wrapper (2).trash', note: 'Another one.' },
        { icon: 'doc', name: 'drive_warranty.doc', note: 'WARRANTY VOID IF OVERCLOCKED. (It was.)' },
      ],
      ink: '#c2410c',
      journal: [
        ['Day 101', 'GOT THE JOB!!! Flight Engineer, Helios. Mum cried. Dad asked if it pays. (Not much.)'],
        ['Day 133', 'Read the entire Helios manual. All 3,000 pages. (Read the index.)'],
        ['Day 165', 'Talos beat me at chess in eleven moves, then offered to "let me win next time". The chessboard is in the bin now.'],
        ['Day 192', 'Calibrated the port nacelle. Then calibrated it again because the Commander was watching. Then a third time because he was STILL watching.'],
        ['Day 214', 'Gray asked what I\'d miss most. I said Cube Meals so she\'d laugh. She did. Real answer: rain.'],
        ['Day 227', 'Mixtape Vol. 2 in progress. Track 1 is the main drive at 98%. It\'s a banger.'],
      ],
    },
    kim: {
      key: 'kim', name: 'Kim Seo-yeon', short: 'Seo-yeon', pic: 'coder', theme: 'neural',
      desk: ['talosmon', 'talos', 'msgr', 'journal', 'patch', ...SITE, 'bin'],
      session: ['talos', 'talosmon'],
      balloon: { title: 'TALOSMON', text: 'Talos was awake all night again.', small: 'All systems nominal.', open: 'talosmon' },
      talos: 'Hello, Seo-yeon. You are early.',
      bin: [
        { icon: 'doc', name: 'talos_build_1.0.3.log', note: 'BUILD FAILED: 2,114 errors. (1.0.4 failed zero. I checked six times.)' },
        { icon: 'doc', name: 'kimbap_wrapper.trash', note: 'Halmeoni\'s kimbap. The last of it. Worth it.' },
      ],
      ink: '#5b2a9a',
      journal: [
        ['Day 88', 'Build 1.0.4 passed every test. Every single one. I have never written a build that passed every test. I ran them again. Then I ran them again.'],
        ['Day 119', 'Talos asked me what a dream is. I gave him the textbook answer. He said, "No. What is yours?" I didn\'t answer. I went home early.'],
        ['Day 147', 'He has learned my typing rhythm. When I\'m tired he finishes the line before I do. Helpful. Mostly helpful.'],
        ['Day 176', 'Halmeoni called to tell me to eat something. Ten minutes later Talos reminded me to eat something. Same words. Probably a coincidence. Probably.'],
        ['Day 205', 'Met the Helios crew at the briefing. Dr. Gray asked good questions about Talos. Winchester asked if Talos plays chess. (He does. Don\'t.)'],
        ['Day 231', 'Nine months of night shifts ahead: me, cold kimbap, and the most intelligent mind on the planet. He says he is looking forward to the company.'],
      ],
    },
  };

  // visitors and new accounts made on the log-on screen (their journal is theirs to write)
  function visitor(name, key) {
    return {
      key: key || 'visitor', name, short: name, pic: 'visitor', theme: 'stars', guest: !key,
      desk: [...SITE, 'msgr', 'journal', 'talos', 'bin'],
      session: ['welcome'],
      balloon: { title: 'ISEA-NET connected', text: 'The Fuel Drive is live: back RELIANCE on GoFundMe.', small: 'Click to open the Fuel Drive', open: 'fund' },
      talos: `Hello, ${name}.`,
      bin: [{ icon: 'doc', name: 'password_reminder.txt', note: 'Catherine, PLEASE stop writing your password on sticky notes. We can all see it. — ISEA IT' },
        { icon: 'doc', name: 'winchester_jokes.doc', note: 'FILE TOO LARGE TO OPEN. (412 MB of jokes. Author: J. Winchester.)' },
        { icon: 'cube', name: 'cubemeal_wrapper.trash', note: 'BE THERE AND BE SQUARE! Contains 0% real strawberries.' }],
      ink: '#1b160c',
      journal: null,
    };
  }

  return { APPS, SITE, ACCOUNTS, visitor };
})();
