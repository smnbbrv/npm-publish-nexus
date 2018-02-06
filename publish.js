#!/usr/bin/env node

const pkg = require(process.cwd() + '/package.json');
const request = require('request');
const assert = require('assert');
const spawn = require('child_process').spawnSync;
const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

let { domain, repo, h, help } = argv;

if (h || help) {
    console.log('\nExpects the following environment variables\n');
    console.log('  NPM_NEXUS_PUBLISHER_EMAIL - should contain user email');
    console.log('  NPM_NEXUS_PUBLISHER_AUTH - should contain "username:password" in base64');
    console.log('\nAccepts the following arguments\n');
    console.log('  --domain - the domain where nexus is hosted (e.g. https://example.com)');
    console.log('  --repo - repo name to push to (e.g. npm-local)\n');

    process.exit(0);
}

const userconfig = path.resolve('./.npmrc-publish-nexus');
const envEmail = 'NPM_NEXUS_PUBLISHER_EMAIL';
const envAuth = 'NPM_NEXUS_PUBLISHER_AUTH';

const url = `${domain}/service/siesta/rest/beta/assets?repositoryId=${repo}`;
const repoUrl = `${domain}/repository/${repo}/`;
const email = process.env[envEmail];
const auth = process.env[envAuth];

assert(email, `Environment variable ${envEmail} is not set`);
assert(auth, `Environment variable ${envAuth} is not set`);

request(
    { url, headers: { 'Authorization': 'Basic ' + auth } },
    (error, response, body) => {
        if (error) {
            console.error(error);
            process.exit(1);
        }

        if (response) {
            if (response.statusCode === 404) {
                console.log(`Package with the name ${ pkg.name } not found`);

                publish();

                return;
            }

            if (response.statusCode === 200) {
                const paths = JSON.parse(body).items.map(item => item.path);
                const versions = paths.filter(path => path.startsWith(pkg.name) && path.endsWith('.tgz')).map(path => path.match(/(\d.\d.\d(-[^.])?)\.tgz/)[1]);

                if (versions.length) {
                    console.log(`The following versions are found for package ${pkg.name}:`);

                    versions.forEach(version => console.log(` - ${pkg.name}@${version}`));

                    const exists = versions.some(version => version === pkg.version);

                    if (exists) {
                        console.log('The current version is already deployed, skipping publishing...');
                        process.exit(0);
                    } else {
                        publish();
                    }
                } else {
                    console.log(`Package with the name ${ pkg.name } not found`);

                    publish();
                }

                return;
            }

            console.error(response.statusCode);
            process.exit(1);
        }
    }
);

function publish() {
    console.log(`Creating temporary .npmrc file at ${ userconfig }`);

    fs.writeFileSync(userconfig, `email=${email}
always-auth=true
_auth=${auth}`, 'utf8');

    console.log(`Publishing ${pkg.name}@${pkg.version}...`);

    const exec = spawn('npm', [
        '--userconfig=' + path.resolve(userconfig),
        '--registry=' + repoUrl,
        'publish'
    ]);

    console.log(`Removing temporary .npmrc file at ${ userconfig }`);

    fs.unlinkSync(userconfig);

    if (exec.error || exec.status) {
        console.log(exec.stderr.toString());
        process.exit(1);
    } else {
        console.log(exec.stdout.toString());
        process.exit(0);
    }
}
