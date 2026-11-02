import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const VIRTUAL_ID = 'virtual:icon-sprite';
const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`;

/**
 * Builds SVG sprites out of @navikt/aksel-icons and serves them as immutable,
 * hashed files under /_astro. Components reference symbols in them with <use>,
 * so an icon's path data is downloaded once instead of inlined in every page,
 * island and client bundle.
 *
 * - icons.<hash>.svg: the icons exported from `iconsModule` (every
 *   `export const XIcon = createSpriteIcon("X")` line), used on most pages.
 * - icons-all.<hash>.svg: every aksel icon, only fetched by pages that show an
 *   icon picked by name in the CMS that is not in the first sprite.
 *
 * `virtual:icon-sprite` exports both URLs, identical in every environment since
 * they only depend on the sprites' content, and the names of all aksel icons.
 */
export function iconSprite({iconsModule}) {
  let spritesPromise;

  const buildSprites = async () => {
    const source = await readFile(iconsModule, 'utf8');
    const names = [
      ...new Set(
        [...source.matchAll(/^export const \w+ = createSpriteIcon\(\s*["'](\w+)["']/gm)].map(
          (match) => match[1],
        ),
      ),
    ].sort();

    const akselIcons = await import('@navikt/aksel-icons');
    const allNames = Object.keys(akselIcons)
      .filter((key) => key.endsWith('Icon'))
      .map((key) => key.slice(0, -'Icon'.length))
      .sort();

    const toSymbol = (name) => {
      const Icon = akselIcons[`${name}Icon`];
      if (!Icon) {
        throw new Error(`[icon-sprite] @navikt/aksel-icons has no ${name}Icon`);
      }
      const markup = renderToStaticMarkup(createElement(Icon));
      const [, viewBox] = markup.match(/viewBox="([^"]+)"/);
      const [, content] = markup.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
      return `<symbol id="${name}" viewBox="${viewBox}">${content}</symbol>`;
    };

    const toSprite = (file, spriteNames) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg">${spriteNames.map(toSymbol).join('')}</svg>`;
      const hash = createHash('sha256').update(svg).digest('hex').slice(0, 8);
      return {svg, url: `/_astro/${file}.${hash}.svg`};
    };

    return {
      sprite: toSprite('icons', names),
      fullSprite: toSprite('icons-all', allNames),
      allNames,
    };
  };

  const getSprites = () => (spritesPromise ??= buildSprites());

  return {
    name: 'icon-sprite',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
    },
    async load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return;
      this.addWatchFile(iconsModule);
      const {sprite, fullSprite, allNames} = await getSprites();
      return [
        `export const spriteUrl = ${JSON.stringify(sprite.url)};`,
        `export const fullSpriteUrl = ${JSON.stringify(fullSprite.url)};`,
        `export const akselIconNames = ${JSON.stringify(allNames)};`,
      ].join('\n');
    },
    watchChange(id) {
      if (id === iconsModule) spritesPromise = undefined;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const {sprite, fullSprite} = await getSprites();
        const match = [sprite, fullSprite].find(({url}) => url === req.url);
        if (!match) return next();
        res.setHeader('Content-Type', 'image/svg+xml');
        res.end(match.svg);
      });
    },
    async generateBundle() {
      if (this.environment?.name !== 'client') return;
      const {sprite, fullSprite} = await getSprites();
      for (const {svg, url} of [sprite, fullSprite]) {
        this.emitFile({type: 'asset', fileName: url.slice(1), source: svg});
      }
    },
  };
}
