import * as vscode from 'vscode';
import SMConfig from './ServiceManagerConfiguration';
import SMEnv from './ServiceManagerEnvironment';
import SMPull from './ServiceManagerPullFile';
import SMPush from './ServiceManagerPushFile';
import SMCompile from './ServiceManagerCompileFile';
import SMExecute from './ServiceManagerExecuteFile';
import SMCompare from './ServiceManagerCompareFile';

/**
 * This class includes the methods which are called from the vscode commands
 *
 * @class ServiceManagerCommands
 */
class ServiceManagerCommands {

    /**
     * @type {vscode.ExtensionContext}
     * @memberof ServiceManagerCommands
     */
    context: vscode.ExtensionContext;
    /**
     * @type {SMConfig}
     * @memberof ServiceManagerCommands
     */
    config: SMConfig;

    /**
     *Creates an instance of ServiceManagerCommands.

     * @param {vscode.ExtensionContext} context
     * @memberof ServiceManagerCommands
     */
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.config = new SMConfig(context);
    }

    /**
     * Adds a new Environment to the User Settings
     * This is the wrapper method to start the multi step wizard
     *
     * @memberof ServiceManagerCommands
     */
    public async addEnvironment() {
        await this.config.addEnvironment();
        vscode.window.showInformationMessage('Service Manager Environment has been added successfully to your user settings!');
    }

    public async getLibrary() {

        let selectedEnv = await this.config.pickEnvironment();
        vscode.window.setStatusBarMessage(`Fetching Script Libraries from "${selectedEnv.config.name}"`, 2000);

        let currentEnv = new SMEnv(selectedEnv);
        new SMPull(currentEnv).fetchFiles();
    }

    public async pullLibrary() {

        var editor = vscode.window.activeTextEditor || { 'document': { isUntitled: true } };
        if (!editor.document.isUntitled) {
            let selectedEnv = await this.config.pickEnvironment();
            vscode.window.setStatusBarMessage(`Fetching ScriptLibrary from "${selectedEnv.config.name}"`, 2000);

            let currentEnv = new SMEnv(selectedEnv);
            new SMPull(currentEnv).fetchFile();
        } else {
            vscode.window.showWarningMessage('You can\'t fetch a remote library from a unsaved file.!');
        }
    }

    public async pushLibrary() {
        var editor = vscode.window.activeTextEditor || { 'document': { isUntitled: true } };

        if (!editor.document.isUntitled) {
            let selectedEnv = await this.config.pickEnvironment();
            let currentEnv = new SMEnv(selectedEnv);

            var Push = new SMPush(currentEnv);
            Push.run(editor.document.fileName);
        } else {
            vscode.window.showWarningMessage('You can\'t push a unsafed file!');
        }
    }

    public async compileLibrary() {
        var editor = vscode.window.activeTextEditor || { 'document': { isUntitled: true } };

        if (!editor.document.isUntitled) {
            let selectedEnv = await this.config.pickEnvironment();
            let currentEnv = new SMEnv(selectedEnv);

            var Compile = new SMCompile(currentEnv);
            Compile.run(editor.document.fileName);
        } else {
            vscode.window.showWarningMessage('You can\'t compile a unsafed file!');
        }        
    }

    public async executeLibrary() {
        var editor = vscode.window.activeTextEditor || { 'document': { isUntitled: true } };

        if (!editor.document.isUntitled) {
            let selectedEnv = await this.config.pickEnvironment();
            let currentEnv = new SMEnv(selectedEnv);

            var Execute = new SMExecute(currentEnv);
            Execute.run(editor.document.fileName);
        } else {
            vscode.window.showWarningMessage('You can\'t execute a unsafed file!');
        } 
    }

    public async compareLibrary() {

        var editor = vscode.window.activeTextEditor || { 'document': { isUntitled: true } };
        if (!editor.document.isUntitled) {
            let selectedEnv = await this.config.pickEnvironment();
            vscode.window.setStatusBarMessage(`Compare ScriptLibrary from "${selectedEnv.config.name}"`, 2000);

            let currentEnv = new SMEnv(selectedEnv);
            new SMCompare(currentEnv).run();
        } else {
            vscode.window.showWarningMessage('You can\'t compare a remote library from a unsaved file.!');
        }
    }
}

export default ServiceManagerCommands;