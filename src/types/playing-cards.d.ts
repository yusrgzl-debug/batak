// @letele/playing-cards ships React SVG components (Adrian Kennard's CC0 card designs) without typings.
declare module '@letele/playing-cards' {
  import type { ComponentType, SVGProps } from 'react';
  const cards: Record<string, ComponentType<SVGProps<SVGSVGElement>>>;
  export = cards;
}
