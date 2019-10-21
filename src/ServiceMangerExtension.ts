import * as vscode from 'vscode';
import SMCommands from './ServiceManagerCommands';
import * as _ from 'lodash';

class ServiceMangerExtension {
    readonly extensionPrefix: string = 'extension.servicemanager.';
    context: vscode.ExtensionContext;
    commandList: { "name": string; "callback": any; }[];
    smCommands: SMCommands;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.smCommands = new SMCommands(context);
        this.commandList = [
            {
                "name": "addEnvironment",
                "callback": "addEnvironment"
            },
            {
                "name": "getLibrary",
                "callback": "getLibrary"
            },
            {
                "name": "pullLibrary",
                "callback": "pullLibrary"
            },
            {
                "name": "pushLibrary",
                "callback": "pushLibrary"
            },
            {
                "name": "compileLibrary",
                "callback": "compileLibrary"
            },
            {
                "name": "executeLibrary",
                "callback": "executeLibrary"
            },
            {
                "name": "compareLibrary",
                "callback": "compareLibrary"
            }
        ];
    }

    public registerCommands() {
        var that = this;
        _.each(this.commandList, function (command: { name: string; callback: any; }) {

            that.context.subscriptions.push(
                vscode.commands.registerCommand(
                    that.extensionPrefix + command.name, () => {
                        (that.smCommands as any)[command.callback]();
                    }
                )
            );
        });
    }
}

export default ServiceMangerExtension;