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
                    env => pushFile(env, currentFile),
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

/**
 * Compiles the remote ScriptLibrary
 * 
 * @param {object} env 
 * @param {string} library 
 */
function compileFile(env, library) {
    compileScriptLibrary(env, library).then(
        result => showCompileResult(result),
        errorHandler
    );
}

function pushFile(env, library) {
    pushScriptLibrary(env, library).then(
        result => showPushResult(result),
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

function showPushResult(result) {
    
    if (result.body) {
        if (result.body.Messages.length == 1) {
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
 * Gets all available ScriptLibraries from the
 * selected envrionment
 * 
 * @param {object} env 
 * @returns {Promise}
 */
async function getScriptLibraries(env) {

    if (!env) {
        return null;
    }

    try {
        var libraries = await request.get(env.config.url + env.config.resourceCollection).auth(env.config.username, env.config.password);

        var foundLibraries = _.map(libraries.body.content, function (library) {
            return library[env.config.resourceName][env.config.fields.name];
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

    if (!env || !selectedLibrary) {
        return null;
    }

    try {
        var library = await request.get(env.config.url + env.config.resourceCollection + '/' + selectedLibrary).auth(env.config.username, env.config.password);
        return library.body[env.config.resourceName];
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
        var requestBody = {};
        requestBody[env.config.resourceName] = {};

        var library = await request.put(env.config.url + env.config.resourceCollection + '/' + selectedLibrary)
            .set('Content-Type', 'application/json')
            .auth(env.config.username, env.config.password)
            .send(JSON.stringify(requestBody));
        return library;
    } catch (error) {
        throw error;
    }
}

/**
 * Push the ScriptLibrary in the selected environment
 * 
 * @param {object} env 
 * @param {string} selectedLibrary 
 * @returns {Promise}
 */
async function pushScriptLibrary(env, selectedLibrary) {

    var libraryExists = false;

    try {
        await request.get(env.config.url + env.config.resourceCollection + '/' + selectedLibrary)
            .set('Content-Type', 'application/json')
            .auth(env.config.username, env.config.password)
            .timeout({
                response: 5000  // Wait 5 seconds for the server to start sending,
            });

        libraryExists = true;
    } catch( e ) {
        if (e.response ) {
            libraryExists = false;
        } else {
            throw e;
        }
    }

    return createUpdateLibrary(env, selectedLibrary, libraryExists);
}

async function createUpdateLibrary(env, selectedLibrary, libraryExists) {
    
    var requestUrl = "";
    if( libraryExists ) {
        requestUrl = env.config.url + env.config.resourceCollection + '/' + selectedLibrary;
    } else {
        requestUrl = env.config.url + env.config.resourceCollection;
    }

    try {
        var requestBody = {};
        requestBody[env.config.resourceName] = {};
        requestBody[env.config.resourceName][env.config.fields.name] = selectedLibrary;
        if( !libraryExists ) {
            requestBody[env.config.resourceName][env.config.fields.package] = env.config.defaultPackage;
        }        

        requestBody[env.config.resourceName][env.config.fields.script] = fs.readFileSync(vscode.window.activeTextEditor.document.fileName, 'utf8');

        var library = await request.post(requestUrl)
            .set('Content-Type', 'application/json')
            .auth(env.config.username, env.config.password)
            .send(JSON.stringify(requestBody));
        
        return library;
    } catch (error) {
        throw error;
    }
}

/**
 * Generic Error Handler
 * 
 * @param {object} error 
 */
function errorHandler(error) {

    if( !error.response  ) {
        console.error(error);
        vscode.window.showErrorMessage('An unexpected error occurs. Please check the console for more information. '+ error);
    } else {
        vscode.window.showErrorMessage(error.status + " - "+error.response.body.Messages.join(""));
    }
}

exports.activate = activate;
exports.deactivate = deactivate;