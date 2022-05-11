// This is the configuration file for typedoc to knwo how to generate
// the documentation

/** @type {import('../../../src').IPluginOptions} */
module.exports = {
  entryPoints: [
    'src/index.ts',
    'src/operators/index.ts',
    'src/interface/observable.ts',
    'src/interface/stream.ts',
  ],
  // the typedoc-plugin-pages can add more pages to the output
  // besides README.md, and the comments in your source code files
  pluginPages: {
    pages: [
      {
        title: 'Roadmap',
        source: '../ROADMAP.md',
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
