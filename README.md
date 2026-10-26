# Date Decider — for Icola & Zuzu

A small locked website: insert date ideas, pick a random one, and look back at memories.

## Put it online (GitHub Pages)
1. Create a repository on GitHub and upload **everything in this folder** (keep the `assets` folder as it is).
2. Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main` / `(root)` → Save.
3. After a minute your site is at `https://YOUR-USERNAME.github.io/YOUR-REPO/`.

## Make "submit" send ideas to your GitHub
Open `app.js` and change these two lines at the top:

    githubUser: 'YOUR-GITHUB-USERNAME',
    githubRepo: 'YOUR-REPO-NAME',

When someone presses the heart on **Date Idea**, GitHub opens with the idea already filled in as a new
*Issue* — they press **Submit new issue** and it lands in your repo to review (needs a free GitHub account).
The idea is also saved on that device, so the random picker can use it right away.

## Approve an idea for everyone
Open the Issue, copy the JSON block, and paste it inside the list in `ideas.js`.

## Change things
- Birthdays / countdown date: top of `app.js` (`CONFIG`).
- Replace a photo: put a new image in `assets/memories/` with the same file name (e.g. `home.png`).
