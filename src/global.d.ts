import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';

declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.SFC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.json' {
  const content: string;
  export default content;
}

declare global {
  interface Window {
    api?: ApiPromise;
    keyring?: Keyring;
  }
}
