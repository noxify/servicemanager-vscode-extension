import * as vscode from 'vscode';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
class ServiceManagerPushFile {
    env: any;

    constructor(env: any) {
        this.env = env;
    }

    /**
     *
     *
     * @param {*} file
     */
    async run(fileName: any) {
        let libraryName = path.basename(fileName, '.js');
        let existingLibrary = await this.env.existsLibrary(libraryName);
        let result = null;

        vscode.window.setStatusBarMessage(`Sending push request...`, 5000);

        if (!existingLibrary) {
            result = await this.env.sendRequest({
                url: this.env.config.url + this.env.config.resourceCollection,
                method: 'post',
                body: {
                    name: libraryName,
                    package: this.env.config.defaultPackage,
                    script: fs.readFileSync(fileName, 'utf8')
                }
            });
        } else {
            result = await this.env.sendRequest({
                url: this.env.config.url + this.env.config.resourceCollection + '/' + libraryName,
                method: 'post',
                body: {
                    name: libraryName,
                    script: fs.readFileSync(fileName, 'utf8')
                }
            });
        }

        if (result) {
            if (result.body) {
                if (result.body.Messages.length == 1) {

                    vscode.window.showInformationMessage(result.body.Messages.join(""));
                } else {
                    vscode.window.showErrorMessage(result.body.Messages.join(""));
                }
            }
        }
    }

}

export default ServiceManagerPushFile;