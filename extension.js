const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const request = require('superagent');

/**
 * Activate the extension
 * 
 * @param {any} context 
 */
function activate(context) {

    let availableEnvironments = getEnvironments();

    let getLibraries = vscode.commands.registerCommand('extension.servicemanager.getLibraries', function () {
        vscode.window
            .showQuickPick(availableEnvironments)
                .then(
                    env => getScriptLibraries(env)
                        .then(
                            foundLibraries => chooseLibrary(env, foundLibraries), 
                            errorHandler
                    ), 
                    errorHandler
                );
    });

    let pullLibrary = vscode.commands.registerCommand('extension.servicemanager.pullLibrary', function () {
        var editor = vscode.window.activeTextEditor;
        var currentFile = path.basename(editor.document.fileName, '.js');
        
        if (!editor.document.isUntitled ) {
            vscode.window
                .showQuickPick(availableEnvironments)
                    .then(
                        env => loadLibrary(env, currentFile),
                        errorHandler
                    );
        } else {
            vscode.window.showWarningMessage('You can\'t pull a unsafed file!');
        }
    });

    let pushLibrary = vscode.commands.registerCommand('extension.servicemanager.pushLibrary', function () {
        var editor = vscode.window.activeTextEditor;
        var currentFile = path.basename(editor.document.fileName, '.js');

        if (!editor.document.isUntitled) {
            vscode.window
                .showQuickPick(availableEnvironments)
                .then(
                    env => loadLibrary(env, currentFile),
                    errorHandler
                );
        } else {
            vscode.window.showWarningMessage('You can\'t push a unsafed file!');
        }
    });

    let compileLibrary = vscode.commands.registerCommand('extension.servicemanager.compileLibrary', function () {
        var editor = vscode.window.activeTextEditor;
        var currentFile = path.basename(editor.document.fileName, '.js');

        if (!editor.document.isUntitled) {
            vscode.window
                .showQuickPick(availableEnvironments)
                .then(
                    env => compileFile(env, currentFile),
                    errorHandler
                );
        } else {
            vscode.window.showWarningMessage('You can\'t compile a unsafed file!');
        }
    });

    //add commands
    context.subscriptions.push(getLibraries);
    context.subscriptions.push(pullLibrary); 
    context.subscriptions.push(pushLibrary);
    context.subscriptions.push(compileLibrary);
  
}

/**
 * Deactivate the extension
 */
function deactivate() {
}

/**
 * Gets the available environments as QuickList object
 * 
 * @returns array
 */
function getEnvironments() {

    let config = getConfig(null);
    var items = [];

    _.each(config, function(env, key) {
        items.push({
            'key' : key,
            'label' : env['name'],
            'config' : env
        });
    });

    return items;
}

/**
 * Gets all or the defined configuration from the settings
 * 
 * @param {string|null} env 
 * @returns object
 */
function getConfig(env) { 
    let config = vscode.workspace.getConfiguration('servicemanager');
    return (env) ? config['environments'][env] : config['environments'];
}

/**
 * Gets all available ScriptLibraries from the
 * selected envrionment
 * 
 * @param {object} env 
 * @returns {Promise}
 */
async function getScriptLibraries(env) {
    
    if(!env) {
        return null;
    }

    try {
        var libraries = await request.get(env.config.url + env.config.endpoint).auth(env.config.username, env.config.password);
        
        var foundLibraries = _.map(libraries.body.content, function(library) {
            return library[env.config.endpoint]['Name'];
        });

        return foundLibraries;
    } catch (error) {
        throw error;
    }
}

/**
 * Get the ScriptLibrary from the selected environment
 * 
 * @param {object} env 
 * @param {string} selectedLibrary 
 * @returns {Promise}
 */
async function getScriptLibrary(env, selectedLibrary) {

    if( !env || !selectedLibrary) {
        return null;
    }

    try {
        var library = await request.get(env.config.url + env.config.endpoint + '/' + selectedLibrary).auth(env.config.username, env.config.password);
        return library.body[env.config.endpoint];
    } catch (error) {
        throw error;
    }
}

/**
 * Compile the ScriptLibrary in the selected environment
 * 
 * @param {object} env 
 * @param {string} selectedLibrary 
 * @returns {Promise}
 */
async function compileScriptLibrary(env, selectedLibrary) {

    if (!env || !selectedLibrary) {
        return null;
    }

    try {
        var library = await request.put(env.config.url + env.config.endpoint + '/' + selectedLibrary)
                                    .set('Content-Type', 'application/json')
                                    .auth(env.config.username, env.config.password)
                                    .send('{"ScriptLibrary" : {}}');        
        return library;
    } catch (error) {
        throw error;
    }
}

/**
 * Show the available ScriptLibraries
 * for the selected environment
 * 
 * @param {object} env 
 * @param {array} foundLibraries 
 */
function chooseLibrary(env, foundLibraries) {
    vscode.window.showQuickPick(foundLibraries).then(
        library => loadLibrary(env, library)
    );
}

/**
 * Get the ScriptLibrary from the selected environment
 * and save it the the defined local path
 * 
 * @param {object} env 
 * @param {string} library 
 */
function loadLibrary(env, library) {
    if (!library) {
        return null;
    }

    getScriptLibrary(env, library).then(
        result => saveFile(env, result)
    ).then(
        () => openFile(env, library)
    );
}

/**
 * Saves the selected ScriptLibrary
 * 
 * @param {object} env 
 * @param {object} result 
 */
function saveFile(env, result) {

    let file = env.config.path + result['Name'] + '.js';

    fs.writeFile(file, result['Script'], (err) => {
        //something went wrong while saving the file - show a error message
        if (err) {
            vscode.window.showErrorMessage('Unable to save ScriptLibrary ' + result['Name'] + " - " + err);
            throw err;
        }
        // file was saved successfully - show a info message
        vscode.window.showInformationMessage('ScriptLibrary ' + result['Name'] + ' saved successfully.');
    });
}


function compileFile(env, library) {
    compileScriptLibrary(env, library).then(
        result => showCompileResult(result),
        errorHandler
    );
}

/**
 * Show Message box with the compile result
 * 
 * @param {object} result 
 */
function showCompileResult(result) {

    if( result.body ) {
        if(result.body.Messages.length == 1) {
            vscode.window.showInformationMessage(result.body.Messages.join(""));
        } else {
            vscode.window.showErrorMessage(result.body.Messages.join(""));
        }
    }
    
}

/**
 * Opens the saved file
 * 
 * @param {object} env 
 * @param {string} library 
 */
async function openFile(env, library) {

    let file = vscode.Uri.file(env.config.path + library + '.js');

    vscode.workspace.openTextDocument(file).then(doc => {
        vscode.window.showTextDocument(doc);
    });
}

/**
 * Generic Error Handler
 * 
 * @param {object} error 
 */
function errorHandler(error) {
    
    if( !error.response  ) {
        console.error(error);
        vscode.window.showErrorMessage('An unexpected error occurs. Please check the console for more information.');
    } else {
        vscode.window.showErrorMessage(error.status + " - "+error.response.body.Messages[0]);
    }
}

exports.activate = activate;
exports.deactivate = deactivate;