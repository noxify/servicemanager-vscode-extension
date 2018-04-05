const _ = require('lodash');
const fs = require('fs');
const vscode = require('vscode');
const request = require('superagent');

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
        console.log("pull");
    });

    let pushLibrary = vscode.commands.registerCommand('extension.servicemanager.pushLibrary', function () {
        console.log("push");
    });

    let compileLibrary = vscode.commands.registerCommand('extension.servicemanager.compileLibrary', function () {
        console.log("compile");
    });

    //add commands
    context.subscriptions.push(getLibraries);
    context.subscriptions.push(pullLibrary); 
    context.subscriptions.push(pushLibrary);
    context.subscriptions.push(compileLibrary);
  
}

// this method is called when your extension is deactivated
function deactivate() {
}

function getEnvironments() {

    let config = getConfig();
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

function getConfig(env) {
    let config = {
        "env1" : {
            "name" : "Environment 1",
            "url": "http://localhost:13080/SM/9/rest/",
            "endpoint": "ScriptLibrary",
            "username": "System.Admin",
            "password": "System.Admin",
            "path": "/Users/marcusreinhardt/Documents/sm/env1/"
        },
        "env2": {
            "name": "Environment 2",
            "url": "http://localhost:13080/SM/9/rest/",
            "endpoint": "ScriptLibrary",
            "username": "System.Admin",
            "password": "System.Admin",
            "path": "~/Documents/sm/env2/"
        }
    };

    return (env) ? config[env] : config;
}

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

function chooseLibrary(env, foundLibraries) {
    vscode.window.showQuickPick(foundLibraries).then(
        library => loadLibrary(env, library)
    );
}

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

function saveFile(env, result) {

    let file = env.config.path + result['Name'] + '.js';

    fs.writeFile(file, result['Script'], (err) => {
        // throws an error, you could also catch it here
        if (err) {
            vscode.window.showErrorMessage('Unable to save ScriptLibrary ' + result['Name'] + " - " + err);
            throw err;
        }
        // success case, the file was saved
        vscode.window.showInformationMessage('ScriptLibrary ' + result['Name'] + ' saved successfully.');
    });
}

async function openFile(env, library) {

    let file = vscode.Uri.file(env.config.path + library + '.js');

    vscode.workspace.openTextDocument(file).then(doc => {
        vscode.window.showTextDocument(doc);
    });
}

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