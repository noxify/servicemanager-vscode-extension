'use strict';

import * as vscode from 'vscode';
import ServiceManger from './ServiceMangerExtension';

export function activate(context: vscode.ExtensionContext) {
    var SM = new ServiceManger(context);
    SM.registerCommands();
}

// this method is called when your extension is deactivated
export function deactivate() {
}