const { awscdk, github } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  name: 'aws-cdk-study',
  projenrcTs: true,
  deps: ['@types/aws-lambda'], /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
  githubOptions: {
    projenCredentials: github.GithubCredentials.fromApp(),
  },
});
project.synth();