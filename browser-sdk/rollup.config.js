import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

export default [
  {
    input: './src/index.tsx',
    output: [{file: pkg.main, format: 'esm'}],
    plugins: [typescript()],
    external: Object.keys(pkg.peerDependencies || {}),
  },
];
