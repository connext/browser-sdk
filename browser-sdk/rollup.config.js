import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import typescript from "rollup-plugin-typescript2";
import nodePolyfills from 'rollup-plugin-node-polyfills';
import pkg from "./package.json";

export default {
  input: "./src/index.tsx",
  output: [{
    file: pkg.main,
    format: "umd",
    name: "ConnextSDK",
    intro: 'var global = window;', // libraries like "eccrypto" assume that "global" is defined as "window", so we need to define that
  }],
  plugins: [
    replace({
      // substitute the "NODE_ENV" environment variable for its real value within the compiled output
      // (since environment variables are unavailable in the browser)
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),

      // the "nuid" library that is part of the NATS project assumes the availability of the "crypto" library built into Node.js
      // however, the polyfills we're using don't support the randomBytes function, so we'll implement our own shim based on the WebCrypto API
      'crypto.randomBytes': '(function(l){return window.crypto.getRandomValues(new Uint8Array(l));})',

      // fix some unusual imports in the "memoizee" and "d" NPM modules - they import the "#" module, which is technically an invalid module name - this makes rollup throw an error, where a lazier packer might just let it slide
      // we'll just re-implement them since they're pretty trivial functions
      'require("es5-ext/array/#/e-index-of")': `function(searchElement = undefined, fromIndex = undefined) {
        if (!Number.isNaN(searchElement)) return this.indexOf(searchElement, fromIndex);
        var newFromIndex = Number.isNaN(fromIndex) ? 0 : fromIndex >= 0 ? Math.floor(fromIndex) : this.length - Math.floor(Math.abs(fromIndex));
        for (var i = newFromIndex; i < this.length; ++i) {
          if (this.hasOwnProperty(i) && Number.isNaN(this[i])) return i;
        }
        return -1;
      }`,
      'require("es5-ext/string/#/contains")': 'function(s, p) { return String.prototype.indexOf.call(this, s, p) > -1; }',
      delimiters: ['', ''],
    }),
    nodeResolve({browser: true, preferBuiltins: false}), // resolve module names using node_modules and the standard Node module resolution algorithm
    commonjs({requireReturnsDefault: "preferred"}), // compile the module to CommonJS (required in order to support the UMD standard)
    nodePolyfills(),  // add shims for node.js builtin modules such as "process" and "os"
    json(),  // support importing JSON files as if they are modules
    typescript(), // compile Typescript to ES5 as per tsconfig.json
    replace({
      // the "memoizee" library attempts to perform illegal operations such as modifying modules imported via require() - this causes issues because the generated code tries to prevent this behaviour using Object.freeze
      // as a hack, we'll disable freezing the object in order to allow this illegal behaviour in "memoizee"
      'Object.freeze': '(function(x){return x;})',
    }),
  ],
  context: "window", // set the value of `this` to `window` at the top-level - Magic Link's SDK depends on this behaviour
};
