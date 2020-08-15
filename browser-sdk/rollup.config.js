import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import replace from '@rollup/plugin-replace';
import pkg from './package.json';

export default {
  input: './src/connext.tsx',
  output: [{file: pkg.main, format: 'umd', name: 'connext'}],
  plugins: [
    nodeResolve(),  // resolve module names using node_modules and the standard Node module resolution algorithm
    commonjs(),  // compile the module to CommonJS (required in order to support the UMD standard)
    replace({'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)}),  // substitute the "NODE_ENV" environment variable for its real value within the compiled output (since environment variables are unavailable in the browser)
    typescript(),  // compile Typescript to ES5 as per tsconfig.json
  ],
  context: 'window',  // set the value of `this` to `window` at the top-level, Magic Link's SDK depends on that behaviour
};
