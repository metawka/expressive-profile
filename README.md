# Expressive Profile

Generator of GitHub profile READMEs in the Material 3 Expressive style. The profile is set up on the site and installed into the profile repository. A GitHub Action then refreshes the stats every hour.

<p align="center">
  <a href="https://metawka.github.io/expressive-profile/"><b>Open the generator</b></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/metawka">Live example</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/marketplace/actions/expressive-profile">GitHub Marketplace</a>
</p>

<p align="center"><a href="https://github.com/metawka/expressive-profile/stargazers"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/star-badge-dark.svg"><img src="docs/star-badge-light.svg" width="640" alt="Star Expressive Profile on GitHub"></picture></a></p>

<div align="center">

<a href="https://github.com/metawka"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/metawka/metawka/main/assets/hero-dark.svg"><img src="https://raw.githubusercontent.com/metawka/metawka/main/assets/hero-light.svg" width="100%" alt="Profile header"></picture></a>

<picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/metawka/metawka/main/assets/stats-dark.svg"><img src="https://raw.githubusercontent.com/metawka/metawka/main/assets/stats-light.svg" width="100%" alt="GitHub activity"></picture>

<picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/metawka/metawka/main/assets/streak-dark.svg"><img src="https://raw.githubusercontent.com/metawka/metawka/main/assets/streak-light.svg" width="100%" alt="Streak"></picture>

<sub>Live cards from <a href="https://github.com/metawka">github.com/metawka</a>, refreshed hourly by the Action. The look follows the GitHub light or dark theme.</sub>

</div>

## Features

- Blocks: header, socials, about, tech stack, project cards, activity, authored-code statistics, streak, divider, link buttons.
- Live preview with editing by click, drag to reorder, hiding blocks.
- Material 3 color palette built from one color, a custom color or an image. Five palette styles, light and dark themes.
- Eight Material 3 shapes for the avatar, project cards and social icons.
- Typing animation for the subtitle and animations in every card. Animations can be turned off.
- Icon search across Material Symbols and Simple Icons.
- Templates, a shareable link to a setup and a "make one like this" page for any profile built with the generator.
- English and Russian interface.

## Screenshots

<table>
  <tr>
    <td colspan="2"><img src="docs/editor.png" alt="Editor with the header settings open"></td>
  </tr>
  <tr>
    <td colspan="2" align="center">Editor: live preview, editing by click, drag to reorder</td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/style.png" alt="Style settings"></td>
    <td width="50%"><img src="docs/projects.png" alt="Project cards"></td>
  </tr>
  <tr>
    <td align="center">Templates, main color and palette styles</td>
    <td align="center">Project cards from pinned or chosen repositories</td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/activity.png" alt="Activity and streak"></td>
    <td width="50%"><img src="docs/setup.png" alt="Profile setup"></td>
  </tr>
  <tr>
    <td align="center">Activity, streak and link buttons</td>
    <td align="center">Install to GitHub or download an archive</td>
  </tr>
  <tr>
    <td colspan="2"><img src="docs/remix.png" alt="Make one like this page"></td>
  </tr>
  <tr>
    <td colspan="2" align="center">The "Made with Expressive Profile" link under a profile opens a page with its setup</td>
  </tr>
</table>

## Usage

1. Open the [generator](https://metawka.github.io/expressive-profile/) and enter a GitHub username.
2. Set up the blocks and press **Download**.
3. **Install to GitHub** signs in with a GitHub code, creates the profile repository and uploads the files.

https://github.com/user-attachments/assets/ad14524b-1529-4637-8612-7cb41c5eee35

Manual setup: **Download archive** gives a ZIP for a public repository named exactly like the username. All files from it are uploaded to that repository, including the `.github` and `.profile` folders.

Signing in uses the GitHub device flow with the `public_repo` and `workflow` scopes. The token stays in the browser tab and is used only for this upload. The sign-in proxy is open source, see [`proxy/`](proxy). If the repository already has a README, the generator asks before replacing it.

The first workflow run replaces the preview data with exact stats and pinned repositories. Then the profile updates every hour and commits only when the data changes, plus once a day for the calendar.

To change the profile later, edit `profile.json` in the repository or set it up again on the site and upload the new `profile.json`.

## Made with Expressive Profile

- [metawka](https://github.com/metawka)

Profiles built with the generator can be added to this list with a pull request.

## Action

The archive contains this workflow:

```yaml
name: Expressive Profile

on:
  schedule:
    - cron: "17 * * * *"
  workflow_dispatch:
  push:
    paths:
      - profile.json
      - .profile/icons.json

permissions:
  contents: write

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: metawka/expressive-profile@v1
        with:
          token: ${{ secrets.PROFILE_TOKEN || github.token }}
```

| Input | Default | Description |
| --- | --- | --- |
| `token` | `github.token` | Token for the GitHub API |
| `commit-message` | `Updated profile` | Message of update commits |

With the default token the language chart and authored-code statistics use public repositories only. To include private repositories, create a fine-grained personal access token restricted to the repositories you want to analyse, with **Metadata: read** and **Contents: read**, then save it as the `PROFILE_TOKEN` secret in the profile repository.

The **Authored code** block counts additions and deletions in commits authored by the profile owner. It shows a donut chart for the most-used programming and markup languages and summary metrics for repositories, commits and changed lines. Language detection uses a generated mapping from [GitHub Linguist](https://github.com/github-linguist/linguist); data and prose formats such as JSON, YAML and Markdown, plus unknown files, do not distort the code percentages. A repository appears only when at least one matching author commit is found. Without a token the generator checks public repositories; with a PAT pasted into the editor it can preview private and organisation repositories accessible to that token.

The editor keeps the completed authored-statistics result in this browser's local storage for seven days, keyed by GitHub login, so a reload does not repeat a long scan. That aggregate may include private repository names when a PAT was used. Clear the site's browser data to remove it. The PAT itself is never saved in configuration, share links, archives or browser storage. For scheduled private-aware updates, add the PAT yourself as `PROFILE_TOKEN`.

GitHub API rate limits and very large histories can produce a partial result. The generated card labels partial data instead of presenting it as a complete history.

## Privacy

The generator site counts visits with [GoatCounter](https://www.goatcounter.com/) on `metawka.github.io` only. GoatCounter does not use cookies. The editor caches GitHub profile data and completed authored-statistics aggregates in local browser storage as described above; it never stores a PAT.

## Development

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

`npm run build` builds the site into `dist` and the Action renderer into `action/render.mjs`.

The `proxy` folder contains the sign-in proxy deployed on Vercel. It forwards two device flow requests to GitHub and stores nothing.

## License

The code is under the [MIT License](LICENSE).

- Google Sans Flex and Roboto Flex: SIL Open Font License, see `fonts/`.
- Material Symbols: Apache License 2.0.
- Simple Icons: CC0 1.0. Brand icons belong to their owners.
