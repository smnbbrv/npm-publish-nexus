# npm-publish-nexus

Safe NPM package publish for Nexus.

> DEPRECATED: the *Disallow override* option is fixed now, so no need in this plugin anymore. Still, it works.

## Why

The *Disallow override* option does not work properly on Nexus (at least for the scoped packages). 

That's why to integrate the publishing into CI requires a validation of the package version existence before publishing.

This package does it.

## Installation

```bash
npm i -D npm-publish-nexus
``` 

## Usage

Setup variables

```bash
export NPM_NEXUS_PUBLISHER_EMAIL=<email>
export NPM_NEXUS_PUBLISHER_AUTH=<base64versionof(login:password)>
```

Then add to your *package.json* `scripts` a script with

```bash
npm-publish-nexus --domain=https://example.com --repo=npm-local
```

where domain is the domain where the Nexus is hosted and repo is the name of the local repository.

Finally, run the script and you will see an output similar to

```bash
The following versions are found for package @bla/bla:
 - @bla/bla@1.0.3
 - @bla/bla@1.0.0
 - @bla/bla@1.0.4
 - @bla/bla@1.0.5
The current version is already deployed, skipping publishing...
```

## License

MIT
