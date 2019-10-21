import * as vscode from 'vscode';
import * as _ from 'lodash';
import * as path from 'path';

class ServiceManagerCompareFile {
    env: any;

    constructor(env: any) {
        this.env = env;
    }

    async run() {

        var editor:any = vscode.window.activeTextEditor;
        var selectedLibrary = path.basename(editor.document.fileName, '.js');

        let fileContent = await this.env.fetchRemoteLibrary(selectedLibrary);
        if (fileContent) {

            const newFile = vscode.Uri.parse('untitled:' + path.join(path.dirname(editor.document.fileName), `remote_compare_${selectedLibrary}_${new Date().getTime()}.js`));

            await vscode.workspace.openTextDocument(newFile).then(() => {
                const edit = new vscode.WorkspaceEdit();
                edit.insert(newFile, new vscode.Position(0, 0), fileContent[this.env.config.fields.script]);
                return vscode.workspace.applyEdit(edit).then(success => {
                    if (success) {
                        //vscode.window.showTextDocument(document);
                    } else {
                        //vscode.window.showInformationMessage('Error!');
                    }
                });
            });

            var localUri = vscode.Uri.file(editor.document.fileName);
            var remoteUri = newFile;

            const title = '(left) Local File - (right) Remote File';
            return vscode.commands.executeCommand('vscode.diff', localUri, remoteUri, title);
        } else {
            vscode.window.showWarningMessage(`Unable to compare library ${selectedLibrary}.`);
        }
    }


}

export default ServiceManagerCompareFile;