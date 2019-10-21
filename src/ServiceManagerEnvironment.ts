import * as vscode from 'vscode';
import * as _ from 'lodash';
import * as request from 'superagent';

class ServiceManagerEnvironment {
    env: any;
    config: any;

    constructor(env: any) {
        this.env = env;
        this.config = env.config;
    }

    async fetchRemoteLibraries() {

        var that = this;

        try {
            var result = await request
                .get(`${this.env.config.url}/${this.env.config.resourceCollection}`)
                .auth(this.env.config.username, this.env.config.password);

            return _.map(result.body.content, function (library) {
                return library[that.env.config.resourceName][that.env.config.fields.name];
            })
        } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(error.message);
            return [];
        }
    }

    async fetchRemoteLibrary(library: string) {

        try {
            var result: any = await request
                .get(`${this.env.config.url}/${this.env.config.resourceCollection}/${library}`)
                .auth(this.env.config.username, this.env.config.password);

            return result.body[this.env.config.resourceName];
        } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(error.message);
            return null;
        }
    }

    async existsLibrary(libraryName: string) {
        var libraryExists = false;

        try {
            await request.get(this.env.config.url + this.env.config.resourceCollection + '/' + libraryName)
                .set('Content-Type', 'application/json')
                .auth(this.env.config.username, this.env.config.password)
                .timeout({
                    response: 5000  // Wait 5 seconds for the server to start sending,
                });

            libraryExists = true;
        } catch (e) {
            if (e.response) {
                libraryExists = false;
            } else {
                throw e;
            }
        }

        return libraryExists;
    }

    async sendRequest(pushRequest: any) {

        try {
            var requestBody: { [index: string]: any } = {};

            const resourceName = this.env.config.resourceName;
            const aliases = this.env.config.fields;

            requestBody[resourceName] = {};
            _.each(pushRequest.body, function(value, key) {                
                requestBody[resourceName][aliases[key]] = value;
            });

            var result = await request(pushRequest.method, pushRequest.url)
                .set('Content-Type', 'application/json')
                .auth(this.env.config.username, this.env.config.password)
                .send(JSON.stringify(requestBody));

            return result;
        } catch (error) {
            if (!error.response) {
                console.error(error);
                vscode.window.showErrorMessage('An unexpected error occurs. Please check the console for more information. ' + error);
            } else {
                vscode.window.showErrorMessage(error.status + " - " + error.response.body.Messages.join(""));
            }

            return false;
        }
    }
}

export default ServiceManagerEnvironment;