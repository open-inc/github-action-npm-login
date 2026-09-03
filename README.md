# open.INC NPM login

GitHub Action that writes an npm auth token into `~/.npmrc`, so that subsequent
`npm`, `yarn` or `pnpm` steps can install from and publish to a private registry.

## Usage

```yaml
- uses: open-inc/github-action-npm-login@v2
  with:
    token: ${{ secrets.NPM_TOKEN }}
```

Against a private registry:

```yaml
- uses: open-inc/github-action-npm-login@v2
  with:
    token: ${{ secrets.NPM_TOKEN }}
    registry: https://npm.example.com/
```

The legacy environment-variable style keeps working:

```yaml
- uses: open-inc/github-action-npm-login@v2
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    NPM_REGISTRY: https://npm.example.com/
```

## Inputs

| Input        | Required | Default                            | Description                                          |
| ------------ | -------- | ---------------------------------- | ---------------------------------------------------- |
| `token`      | yes      | `$NPM_TOKEN`                       | npm auth token. The step fails if it resolves empty. |
| `registry`   | no       | `$NPM_REGISTRY`, `registry.npmjs.org` | Registry the token belongs to.                    |
| `npmrc-path` | no       | `$NPM_CONFIG_USERCONFIG`, `~/.npmrc` | npmrc file to write.                              |

## Outputs

| Output       | Description                                       |
| ------------ | ------------------------------------------------- |
| `npmrc-path` | Absolute path of the npmrc file that was written. |
| `registry`   | Registry the auth token was written for.          |

The token is registered as a secret via `core.setSecret`, so it is masked in the
job log. The npmrc file is written with mode `0600`. An existing entry for the
same registry is replaced; all other lines are kept.

## Versioning

Releases are cut by [semantic-release](https://semantic-release.gitbook.io/) from
`master`, driven by [Conventional Commits](https://www.conventionalcommits.org/):

| Commit prefix                        | Release        |
| ------------------------------------ | -------------- |
| `fix:`                               | patch          |
| `feat:`                              | minor          |
| `feat!:` / `BREAKING CHANGE:` footer | major          |
| `chore:`, `docs:`, `refactor:`, ...  | none           |

Every release gets an immutable `vX.Y.Z` tag plus a GitHub Release with generated
notes, and the major tag (`v2`) is force-moved onto it. So:

```yaml
uses: open-inc/github-action-npm-login@v2      # tracks the latest 2.x  (recommended)
uses: open-inc/github-action-npm-login@v2.1.0  # pinned, never moves
uses: open-inc/github-action-npm-login@<sha>   # pinned to a commit
```

Do **not** reference a branch (`@master`). Branches move without a release and
without release notes.

> [!WARNING]
> Do not enable **immutable releases** on this repository. That feature forbids
> re-pointing an existing tag, which is exactly what the moving `v2` tag does --
> the release workflow would start failing. If you want immutability instead,
> drop the "Move major version tag" step and have consumers pin `vX.Y.Z` or SHAs.

## Using this action from a private repository

If this repository is private, other repositories in the org can only use it
once sharing is switched on: **Settings -> Actions -> General -> Access ->
"Accessible from repositories in the 'open-inc' organization" -> Save**.
Without that, consuming workflows fail to resolve the action. No token or
`actions/checkout` dance is needed in the consuming workflow.

## Development

The action is written in TypeScript and bundled into `dist/` with ncc.

```bash
npm ci
npm run typecheck  # tsc --noEmit, no output artifacts
npm run build      # bundles src/index.ts into dist/ via ncc
npm run check-dist # verifies dist/ is in sync with src/
```

`dist/` is committed - GitHub Actions runs the bundle directly, so a source
change is only effective after a rebuild. CI enforces this.

`typescript` is pinned to `^5.9` on purpose: ncc's TypeScript loader does not
work with the native TypeScript 7 compiler yet.

The release workflow builds `dist/` before tagging and `@semantic-release/git`
commits it, so a released tag can never carry a stale bundle.
