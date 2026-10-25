// desktops.js: every program on the workstation, and the accounts you can log on as.
// Each crew member's desktop is set up the way they'd leave it: Reznov never touches his,
// Gray's is a research lab, Winchester's is games and engineering tools.
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
    fund: { title: 'Fuel Drive', label: 'Fuel Drive', icon: 'battery', w: 700, h: 680, desc: 'GoFundMe and Indiegogo' },
    talos: { title: 'TALOS.EXE', label: 'TALOS.EXE', icon: 'talos', w: 720, h: 540, desc: 'Say hello', cls: 'talos-win' },
    bin: { title: 'Disposal', label: 'Disposal', icon: 'bin', w: 470, h: 430 },
    // Gray
    ichor: { title: 'ICHOR LAB · Specimen IC-0417', label: 'Ichor Lab', icon: 'rock', w: 1080, h: 690, desc: 'Study the specimen' },
    notes: { title: 'research_log.txt · Notepad', label: 'Research Log', icon: 'doc', w: 620, h: 580 },
    // Reznov
    orders: { title: 'mission_orders.txt · Notepad', label: 'Mission Orders', icon: 'doc', w: 580, h: 540 },
    // Winchester
    diag: { title: 'DIAG.EXE · Helios Engineering', label: 'Engine Diag', icon: 'gauge', w: 880, h: 660, desc: 'Live ship systems' },
    mixtape: { title: 'MIXTAPE.EXE', label: 'Mixtape', icon: 'music', w: 540, h: 660, desc: 'The soundtracks' },
    mines: { title: 'Debris Field', label: 'Debris Field', icon: 'flag', w: 430, h: 560, desc: 'Clear the sector' },
    snake: { title: 'Cube Crunch', label: 'Cube Crunch', icon: 'cube', w: 540, h: 660, desc: 'Eat the Cube Meals' },
    jokes: { title: 'winchester_jokes.doc · Notepad', label: 'jokes.doc', icon: 'doc', w: 560, h: 540 },
  };

  // the film's own programs: every account has these, so visitors can always reach them
  const SITE = ['brief', 'helios', 'archive', 'dossier', 'comms', 'fund'];

  const ACCOUNTS = {
    reznov: {
      key: 'reznov', name: 'Cmdr. Roman Reznov', short: 'Commander', pic: 'insignia', theme: 'basic',
      status: () => 'Logged on · last active 214 days ago',
      desk: ['orders', ...SITE, 'bin'],
      session: ['tour'],
      balloon: { title: 'STARFRAME TIP', text: 'Click an icon once to open it.', small: 'Tip 1 of 212', open: 'tour' },
      talos: 'Commander. It has been 214 days.',
      bin: [],
    },
    gray: {
      key: 'gray', name: 'Dr. Catherine Gray', short: 'Dr. Gray', pic: 'photo', theme: 'lab',
      desk: ['ichor', 'notes', 'talos', ...SITE, 'bin'],
      session: ['notes', 'ichor'],
      balloon: { title: 'ICHOR LAB', text: 'Overnight scan complete. 3 new readings.', small: 'Click to open the lab', open: 'ichor' },
      talos: 'Hello, Dr. Gray.',
      bin: [
        { icon: 'doc', name: 'password_reminder.txt', note: 'Catherine, PLEASE stop writing your password on sticky notes. We can all see it. — ISEA IT' },
        { icon: 'doc', name: 'coffee_order.txt', note: 'Black. No sugar. No talking to me before it.' },
      ],
    },
    winchester: {
      key: 'winchester', name: 'John Winchester', short: 'Winchester', pic: 'pad', theme: 'arcade',
      desk: ['diag', 'mixtape', 'mines', 'snake', 'jokes', ...SITE, 'talos', 'bin'],
      session: ['diag', 'mixtape', 'mines'],
      balloon: { title: 'DIAG.EXE', text: 'Nozzle 4 running 0.3% hot.', small: 'Probably fine.', open: 'diag' },
      talos: 'Hello, Mr. Winchester. Please stop overclocking the main drive.',
      bin: [
        { icon: 'cube', name: 'cubemeal_wrapper.trash', note: 'BE THERE AND BE SQUARE! Contains 0% real strawberries.' },
        { icon: 'cube', name: 'cubemeal_wrapper (2).trash', note: 'Another one.' },
        { icon: 'doc', name: 'drive_warranty.doc', note: 'WARRANTY VOID IF OVERCLOCKED. (It was.)' },
      ],
    },
  };

  // visitors and new accounts made on the log-on screen
  function visitor(name, key) {
    return {
      key: key || 'visitor', name, short: name, pic: 'visitor', theme: 'stars', guest: !key,
      desk: [...SITE, 'talos', 'bin'],
      session: ['welcome'],
      balloon: { title: 'ISEA-NET connected', text: 'New tape recovered: The Midnight Hour', small: 'Click to open the Tape Vault', open: 'archive/midnight' },
      talos: `Hello, ${name}.`,
      bin: [{ icon: 'doc', name: 'password_reminder.txt', note: 'Catherine, PLEASE stop writing your password on sticky notes. We can all see it. — ISEA IT' },
        { icon: 'doc', name: 'winchester_jokes.doc', note: 'FILE TOO LARGE TO OPEN. (412 MB of jokes. Author: J. Winchester.)' },
        { icon: 'cube', name: 'cubemeal_wrapper.trash', note: 'BE THERE AND BE SQUARE! Contains 0% real strawberries.' }],
    };
  }

  return { APPS, SITE, ACCOUNTS, visitor };
})();
