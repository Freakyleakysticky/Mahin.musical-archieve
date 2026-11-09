MAHIN.OS — integration
======================

Files:
- mahin-os.js   Hidden OS application and terminal
- mahin-os.css  Interface styling
- content(2).js, script(4).js, style(3).css  Your original uploaded files, unchanged

Install:
1. Upload mahin-os.js and mahin-os.css to the same Neocities folder as your current files.
2. In the HTML <head>, add:
   <link rel="stylesheet" href="mahin-os.css">
3. After your existing content.js and script.js script tags, add:
   <script src="mahin-os.js"></script>
4. Save and refresh the site.

Unlock:
- Konami code: Up, Up, Down, Down, Left, Right, Left, Right, B, A
- Type MAHIN while focused on the page (not in an input)
- Hold the main page H1/title for one second
- Escape closes the OS

The public music archive and your existing secret panel are not overwritten. This is a separate enhancement layer. Notes and theme preferences are stored in localStorage on the visitor's device.

Terminal:
- Type help, help all, neofetch, anime list, anime random, anime steinsgate, worldline, dmail <message>, archive stats, archive search <term>, music stats, note add <text>, theme pink, calc 2*(3+4), etc.
- The terminal is a browser-side simulation, not a real operating-system shell. It intentionally does not execute destructive shell commands.
- The command registry contains 100+ named commands/shortcuts. Some are convenience aliases to the same underlying utility; the help output shows the actual registry.

Content:
- Anime moments, favourites, artist and playlist data are read from SITE_CONTENT where available.
- The six anime universes are structured starting points. Add your own scene text, character entries, links and media to content.js as you expand them.
- For AMVs and GIFs, link/embed original creator sources and retain credits; do not rehost copyrighted material without permission.

Important:
- The upload did not include your HTML page, so the two script/link tags above must be added manually to the page that currently loads content.js and script.js.
- Test on desktop and mobile after upload. This add-on is designed to be standalone and does not require a build step.
