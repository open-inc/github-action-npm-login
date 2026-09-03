# [2.0.0](https://github.com/open-inc/github-action-npm-login/compare/v1.0.0...v2.0.0) (2026-09-03)


* feat!: Rewrite in TypeScript and target the node24 runtime ([848fb15](https://github.com/open-inc/github-action-npm-login/commit/848fb159fcd3d44c6bc5624598c44f892a05d500))


### BREAKING CHANGES

* The action now runs on the node24 runtime instead of node20.
Self-hosted runners need a runner version that ships Node 24.
* An empty or missing npm token now fails the step instead of
writing an empty auth token into .npmrc.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
