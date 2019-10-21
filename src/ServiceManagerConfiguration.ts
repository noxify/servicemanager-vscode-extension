import * as vscode from 'vscode';
import * as _ from 'lodash';
import { multiStepInput } from './multiStepInput';

/**
 *
 *
 * @class ServiceManagerConfiguration
 */
class ServiceManagerConfiguration {

    /**
     * @type {vscode.ExtensionContext}
     * @memberof ServiceManagerConfiguration
     */
    context: vscode.ExtensionContext;

    /**
     *Creates an instance of ServiceManagerConfiguration.
     * @param {vscode.ExtensionContext} context
     * @memberof ServiceManagerConfiguration
     */
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     *
     *
     * @memberof ServiceManagerConfiguration
     */
    public async addEnvironment() {

        var newLibrary = await multiStepInput(this.context);

        var config = vscode.workspace.getConfiguration();
        var configName = "servicemanager.environments";

        var existingEnvironments: any;
        existingEnvironments = config.get(configName) || {}

        existingEnvironments[newLibrary.environmentAlias] = {
            "name": newLibrary.environmentName,
            "url": newLibrary.endpoint + ":" + newLibrary.port + "/SM/9/rest",
            "resourceCollection": "ScriptLibrary",
            "resourceName": "ScriptLibrary",
            "username": newLibrary.username,
            "password": newLibrary.password,
            "path": newLibrary.path,
            "defaultPackage": "User",
            "fields": {
                "name": "Name",
                "package": "Package",
                "script": "Script"
            }
        };

        config.update('servicemanager', {
            "environments": existingEnvironments
        }, true);
    }

    getConfig(env: string | null) {
        let config = vscode.workspace.getConfiguration('servicemanager');

        return (env) ? config['environments'][env] : config['environments'];
    }

    async pickEnvironment() {

        let config = this.getConfig(null);
        var items: any[] | { 'key': string; 'label': string; 'config': object; }[] = [];

        _.each(config, function (env, key) {
            items.push({
                'key': key,
                'label': env['name'],
                'config': env
            });
        });

        let selectedEnv = await vscode.window.showQuickPick(items);

        return selectedEnv;
    }
}

export default ServiceManagerConfiguration;