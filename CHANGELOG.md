# Release Notes

cfr. [keepachangelog.com](https://keepachangelog.com/en/1.1.0/)

- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for now removed features.
- `Fixed` for any bug fixes.
- `Security` in case of vulnerabilities.

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## version 0.4.8 (2024-08-08)

### Added

- a getTimestamp(value) function argument to both the 'debounce' and the 'throttle' operators,
  so the timestamps can be 'prerecorded' inside the values
- a CHANGELOG.md file to track notable changes
- for itr8 developers:
  - pkg:update_script npm script to make it easier to edit multi-line package.json scripts

### Changed

- for itr8 developers:
  - Edited version npm script to check if the CHANGELOG.md has been properly updated before bumping the version

## version 0.4.7 (2024-07-13)

### Added

- Added branchAndMerge operator to do multiple operations on the same source iterator
  and then combining the results in a tuple

### Changed

- improved itr8ToMultiIterable to be able to use it synchronously as well
- and some changes that might interest itr8 developers:
  - preversion script: removed node 12 tests (since mocha 18 needs node >= 14) and added node 22 tests
  - .github/workflows/node.js.yml added node 22 to matrix tests
  - removed a (performance related) test that was failing on github workflow node 18
  - Updated ts-node + formatting fixes
  - Upgraded sinon from 15 to 1`
  - package.json: improved `npm run gitDiff` to allow comparing with another branch
