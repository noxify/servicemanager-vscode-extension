import * as vscode from 'vscode';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
class ServiceManagerPullFile {
    env: any;

    constructor(env: any) {
        this.env = env;

    }

    async fetchFile() {
        
        var editor:any = vscode.window.activeTextEditor;
        var selectedLibrary = path.basename(editor.document.fileName, '.js');

        let fileContent = await this.env.fetchRemoteLibrary(selectedLibrary);

        if (fileContent) {
            this.saveAndOpen(fileContent);
        } else {
            vscode.window.showWarningMessage(`Unable to pull library ${selectedLibrary}.`);
        }
    }
    
    async fetchFiles() {
        vscode.window.setStatusBarMessage(`Fetching libraries from SM Server.`, 5000);

        let existingLibraries = await this.env.fetchRemoteLibraries();

        if (existingLibraries.length > 0) {
            vscode.window.setStatusBarMessage(`Found ${existingLibraries.length} Script Libraries`, 2000);

            var selectedLibrary = await vscode.window.showQuickPick(existingLibraries);
            if (selectedLibrary) {
                let fileContent = await this.env.fetchRemoteLibrary(selectedLibrary);

                if (fileContent) {
                    this.saveAndOpen(fileContent);
                } else {
                    vscode.window.showWarningMessage(`Unable to pull library ${selectedLibrary}.`);
                }
            }
        } else {
            vscode.window.showWarningMessage("Unable to fetch available libraries.");
        }
    }

    /**
     * Wrapper method which saves and opens the file at once
     * @param fileContent 
     */
    saveAndOpen(fileContent: any) {
        try {
            this.saveFile(fileContent);
            this.openFile(fileContent[this.env.config.fields.name]);
        } catch (err) {
            throw err;
        }
    }

    /**
     * creates a new file or updates an existing file
     * 
     * @param fileContent 
     */
    saveFile(fileContent: any) {

        let file = this.env.config.path + fileContent[this.env.config.fields.name] + '.js';

        fs.writeFile(file, fileContent[this.env.config.fields.script], (err) => {
            //something went wrong while saving the file - show a error message
            if (err) {
                vscode.window.showErrorMessage(`Unable to save ScriptLibrary  ${fileContent[this.env.config.fields.name]} - ${err}`);
                throw err;
            }
            // file was saved successfully - show a info message
            vscode.window.showInformationMessage(`ScriptLibrary ${fileContent[this.env.config.fields.name]} saved successfully.`);
        });
    }

    /**
     * Opens the saved file
     * 
     * @param {string} library 
     */
    async openFile(library: string) {

        let file = vscode.Uri.file(this.env.config.path + library + '.js');

        vscode.workspace.openTextDocument(file).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    }
}

export default ServiceManagerPullFile;