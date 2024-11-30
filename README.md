[![NPM Version](https://img.shields.io/npm/v/lingui-solid?label=lingui-solid)](https://www.npmjs.com/package/lingui-solid)
[![NPM Version](https://img.shields.io/npm/v/babel-plugin-lingui-macro-solid?label=babel-plugin-lingui-macro-solid)](https://www.npmjs.com/package/babel-plugin-lingui-macro-solid)
[![NPM Version](https://img.shields.io/npm/v/babel-plugin-lingui-extract-messages-solid?label=babel-plugin-lingui-extract-messages-solid)](https://www.npmjs.com/package/babel-plugin-lingui-extract-messages-solid)

# Summary

This is fork of the [@lingui/react](https://www.npmjs.com/package/@lingui/react) with SolidJS support.

More details: https://github.com/lingui/js-lingui/pull/2101

# Install
1. Install required packages
```
npm i lingui-solid
npm i -D babel-plugin-lingui-macro-solid babel-plugin-lingui-extract-messages-solid
```
2. Modify `lingui.config.ts`
```ts
import { LinguiConfig } from '@lingui/conf';
import extractor from 'babel-plugin-lingui-extract-messages-solid';

const config: LinguiConfig = {
  // .....
  // This is required!
  runtimeConfigModule: {
    Trans: ["lingui-solid", "Trans"],
    useLingui: ["lingui-solid", "useLingui"],
    extractors: [extractor]
  }
};
export default config;
```
3. Modify `vite.config.ts`
```ts
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { lingui } from "@lingui/vite-plugin";

export default defineConfig({
  // .....
  plugins: [
    lingui(), // this is required
    solidPlugin({
      babel: {
        plugins: ["babel-plugin-lingui-macro-solid"], // this is also required!
      }
    }),
    // ....
   ],
  // ....
});
```
# Usage
In general, usage is same with [@react/solid](https://lingui.dev/ref/react).

Main component:
```ts
import { I18nProvider } from "lingui-solid";
import { i18n } from "@lingui/core";
import { messages as messagesEn } from "./locales/en/messages.js";

i18n.load({
  en: messagesEn,
});
i18n.activate("en");

const App = () => {
  return (
    <I18nProvider i18n={i18n}>
      // rest of the app
    </I18nProvider>
  );
};
```

Each other components:
```ts
import { createEffect } from "lingui-solid";
import { useLingui, Trans } from "lingui-solid/macro";

const CurrentLocale = () => {
  const { t, i18n } = useLingui();

  createEffect(() => console.log(`Language chnaged: ${i18n().locale}`));

  return (
    <span>
      {t`Current locale`}: {i18n().locale}<br />
      <Trans>
        See for more info:
        <a href="https://lingui.dev/introduction">official documentation</a>
      </Trans>;
    </span>
  );
};
```

For more info: https://lingui.dev/introduction
