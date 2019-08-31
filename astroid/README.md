# Astroid

Frontend written in [TypeScript](https://www.typescriptlang.org) using the
[inferno.js](https://infernojs.org) framework. It is set up to be run in a
browser (for development mostly) or in [electron](https://electronjs.org).
Electron does not do much except load the application currently, so this may be
replaced by something custom or more lightweight at a later time.

> You need a running instance of the backend (`hypocloid`) locally.

## Requirements

1. Recent NodeJS and npm, e.g. through [nvm](https://github.com/nvm-sh/nvm)
2. `npm install`

## Building

1. `$ npm run build:inferno`

## Running tests

1. `$ npm check`
2. `$ npm test`

## Running in browser using development server

1. `$ npm run serve`

## Running in Electron

1. `$ npm start`

## Running in NW.js

1. `$ npm run nw`

