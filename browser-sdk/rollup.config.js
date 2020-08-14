import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

export default [
  {
    input: './src/index.tsx',
    output: [{file: pkg.main, format: 'umd', name: 'connext'}],
    plugins: [
      nodeResolve(),  // resolve module names using node_modules and the standard Node module resolution algorithm
      commonjs(),  // compile the module to CommonJS (required in order to support the UMD standard)
      typescript(),  // compile Typescript to ES5 as per tsconfig.json
    ],
    external: Object.keys(pkg.peerDependencies || {}),
  },
];
