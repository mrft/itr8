// This is the configuration file for typedoc to know how to generate
// the documentation

/** @type {import('../../../src').IPluginOptions} */
module.exports = {
  entryPoints: [
    "./src/interface/index.ts",
    "./src/operators/index.ts",
    "./src/util/index.ts",
    "./src/index.ts",
    "./src/peer/index.ts",
  ],
  tsconfig: "./tsconfig.prod.json",
  // the typedoc-plugin-pages can add more pages to the output
  // besides README.md, and the comments in your source code files
  pluginPages: {
    pages: [
      {
        name: "Change Log",
        source: "./CHANGELOG.md",
        // children: [
        //   { title: 'Configuration', source: 'configuration.md' },
        // ],
      },
      {
        name: "Roadmap",
        source: "./ROADMAP.md",
        // children: [
        //   { title: 'Configuration', source: 'configuration.md' },
        // ],
      },
      // {
      //   title: 'Additional resources',
      //   childrenDir: 'additional-resources',
      //   children: [
      //     { title: 'Some cool docs', source: 'some-cool-docs.md' },
      //   ]
      // },
    ],
  },
};
