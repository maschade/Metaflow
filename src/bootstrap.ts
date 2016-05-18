import {enableProdMode} from '@angular/core';
import {bootstrap} from '@angular/platform-browser-dynamic';
import {ELEMENT_PROBE_PROVIDERS} from '@angular/platform-browser';
import {ROUTER_PROVIDERS} from '@angular/router';
import {HTTP_PROVIDERS} from '@angular/http';

const ENV_PROVIDERS = [];
if (process.env.ENV === 'build') {
  enableProdMode();
} else {
  ENV_PROVIDERS.push(ELEMENT_PROBE_PROVIDERS);
}

import {App} from './app/app';
import PlatformService from "./app/services/platforms";
import ModelService from "./app/services/models";
import PaletteRegistry from "./app/services/palettes";

let SERVICES = [
    PlatformService, 
    ModelService,
    PaletteRegistry
];

document.addEventListener('DOMContentLoaded', function main() {
  return bootstrap(App, [
      SERVICES,
    ...HTTP_PROVIDERS,
    ...ROUTER_PROVIDERS,
    ...ENV_PROVIDERS
  ]).catch(err => console.error(err));
});
