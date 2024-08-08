// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { resolveAbsolutePath, validateAndReturnReadmePath } from '../specs';
import { generateSchemas, saveAutoGeneratedSchemaRefs } from '../generate';
import { findOrGenerateAutogenEntries } from '../autogenlist';
import colors from 'colors';
import { executeSynchronous } from '../utils';
import yargs from 'yargs';

const argsConfig = yargs
  .strict()
  .option('specs-dir', { type: 'string', demandOption: true, desc: 'Path to the specs dir' })
  .option('base-path', { type: 'string', demandOption: true, desc: 'The swagger base path in the specs repo (e.g. "compute/resource-manager")' })

executeSynchronous(async () => {
    const args = await argsConfig.parseAsync();

    const specsPath = await resolveAbsolutePath(args['specs-dir']);
    const basePath = args['base-path'];
    const readme = validateAndReturnReadmePath(specsPath, basePath);

    const schemaConfigs = [];
    const autoGenEntries = await findOrGenerateAutogenEntries(basePath, readme);

    for (const autoGenConfig of autoGenEntries) {
        if (autoGenConfig.disabledForAutogen === true) {
            console.log(`Path ${autoGenConfig.basePath} has been disabled for generation:`)
            console.log(colors.red(JSON.stringify(autoGenConfig, null, 2)));
            continue;
        }

        console.log(`Using autogenlist config:`)
        console.log(colors.green(JSON.stringify(autoGenConfig, null, 2)));

        const localSchemaConfigs = await generateSchemas(readme, autoGenConfig);
        schemaConfigs.push(...localSchemaConfigs);
    }

    await saveAutoGeneratedSchemaRefs(schemaConfigs, false);
});