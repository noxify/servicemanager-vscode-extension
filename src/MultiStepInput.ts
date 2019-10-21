/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 * 
 * Source: https://github.com/microsoft/vscode-extension-samples/blob/master/quickinput-sample/src/extension.ts
 *--------------------------------------------------------------------------------------------*/

import { QuickPickItem, window, Disposable, QuickInputButton, QuickInput, ExtensionContext, QuickInputButtons } from 'vscode';
import * as _ from 'lodash';
import SMConfig from './ServiceManagerConfiguration';
import * as fs from 'fs';

/**
 * A multi-step input using window.createQuickPick() and window.createInputBox().
 * 
 * This first part uses the helper class `MultiStepInput` that wraps the API for the multi-step case.
 */
export async function multiStepInput(context: ExtensionContext) {

    interface State {
        title: string;
        step: number;
        totalSteps: number;
        environmentName: string;
        environmentAlias: string;
        endpoint: string;
        port: string;
        username: string;
        password: string;
        path:string;
    }

    const title = 'Add new Service Manager Environment';

    async function inputEnvironmentName(input: MultiStepInput, state: Partial<State>) {
        state.environmentName = await input.showInputBox({
            title,
            step: 1,
            totalSteps: 7,
            value: state.environmentName || '',
            prompt: 'Define a environment name. This name will be used as display value in the list of available environments.',
            validate: validateEnvironmentNameRequired,
            shouldResume: shouldResume,
            ignoreFocusOut: true
        });
        
        return (input: MultiStepInput) => inputEnvironmenAlias(input, state);
    }

    async function inputEnvironmenAlias(input: MultiStepInput, state: Partial<State>) {
        state.environmentAlias = await input.showInputBox({
            title,
            step: 2,
            totalSteps: 7,
            value: state.environmentAlias || '',
            prompt: 'Define a unique environment alias.',
            placeholder: _.kebabCase(state.environmentName),
            validate: validateEnvironmentAliasIsUnique,
            shouldResume: shouldResume,
            ignoreFocusOut: true,
        });

        return (input: MultiStepInput) => inputEndpoint(input, state);
    }

    async function inputEndpoint(input: MultiStepInput, state: Partial<State>) {
        state.endpoint = await input.showInputBox({
            title,
            step: 3,
            totalSteps: 7,
            value: state.endpoint || 'http://localhost',
            prompt: 'Define the endpoint. Please ensure that the you insert only the URL to your environment without port or any URL suffix.',
            placeholder: 'http://localhost',
            validate: validateEndpointRequired,
            shouldResume: shouldResume,
            ignoreFocusOut: true
        });
        return (input: MultiStepInput) => inputPort(input, state);
    }

    async function inputPort(input: MultiStepInput, state: Partial<State>) {
        state.port = await input.showInputBox({
            title,
            step: 4,
            totalSteps: 7,
            value: state.port || '13080',
            prompt: 'Define the port where your service manager is listen to.',
            placeholder: '13080',
            validate: validateEndpointPortRequired,
            shouldResume: shouldResume,
            ignoreFocusOut: true
        });
        return (input: MultiStepInput) => inputUsername(input, state);
    }

    async function inputUsername(input: MultiStepInput, state: Partial<State>) {
        state.username = await input.showInputBox({
            title,
            step: 5,
            totalSteps: 7,
            value: state.username || '',
            prompt: 'Define the username',
            placeholder: 'falcon',
            validate: validateUsernameRequired,
            shouldResume: shouldResume,
            ignoreFocusOut: true
        });
        return (input: MultiStepInput) => inputPassword(input, state);
    }

    async function inputPassword(input: MultiStepInput, state: Partial<State>) {
        state.password = await input.showInputBox({
            title,
            step: 6,
            totalSteps: 7,
            value: '',
            prompt: 'Define the password',
            placeholder: '*******',
            password: true,
            validate: validatePasswordRequired,
            shouldResume: shouldResume,
            ignoreFocusOut: true
        });
        return (input: MultiStepInput) => inputPath(input, state);
    }

    async function inputPath(input: MultiStepInput, state: Partial<State>) {

        state.path = await input.showInputBox({
            title,
            step: 7,
            totalSteps: 7,
            value: state.path || '',
            prompt: 'Define the location where the pulled libraries should be saved for this environment.',
            placeholder: '/Users/username/Development/SMENV/',
            validate: validatePath,
            shouldResume: shouldResume,
            ignoreFocusOut: true
        });
    }

    function shouldResume() {
        // Could show a notification with the option to resume.
        return new Promise<boolean>((resolve, reject) => {

        });
    }

    async function validateEnvironmentAliasIsUnique(name: string) {
        
        if(_.isUndefined(name) || _.isNull(name) || _.isEmpty(name)) {
            return "Environment Alias is required.";
        }
        
        const smConfig = new SMConfig(context);
        const slug = _.kebabCase(name);
        const hasElement = (smConfig.getConfig(slug)) ? true : false;
        await new Promise(resolve => setTimeout(resolve, 500));
        return (hasElement) ? 'Environment alias already exists.' : undefined;
    }

    async function validateEnvironmentNameRequired(name: string) {
        return (_.isUndefined(name) || _.isNull(name) || _.isEmpty(name)) ? "Environment name is required." : undefined;
    }

    async function validateEndpointRequired(name: string) {
        return (_.isUndefined(name) || _.isNull(name) || _.isEmpty(name)) ? "Endpoint is required." : undefined;
    }

    async function validateEndpointPortRequired(name: string) {
        return (_.isUndefined(name) || _.isNull(name) || _.isEmpty(name)) ? "Endpoint Port is required." : undefined;
    }

    async function validateUsernameRequired(name: string) {
        return (_.isUndefined(name) || _.isNull(name) || _.isEmpty(name)) ? "Username is required." : undefined;
    }

    async function validatePasswordRequired(name: string) {
        return (_.isUndefined(name) || _.isNull(name) || _.isEmpty(name)) ? "Password is required." : undefined;
    }

    async function validatePath(name: string) {
        return (_.isUndefined(name) || _.isNull(name) || _.isEmpty(name) || !fs.existsSync(name) || !fs.readdirSync(name)) ? "Path is not valid" : undefined;
    }

    async function collectInputs() {
        const state = {} as Partial<State>;
        await MultiStepInput.run(input => inputEnvironmentName(input, state));
        return state as State;
    }

    const state = await collectInputs();
    
    return state;
}


// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------


class InputFlowAction {
    private constructor() { }
    static back = new InputFlowAction();
    static cancel = new InputFlowAction();
    static resume = new InputFlowAction();
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
    title: string;
    step: number;
    totalSteps: number;
    items: T[];
    activeItem?: T;
    placeholder: string;
    buttons?: QuickInputButton[];
    shouldResume: () => Thenable<boolean>;
}

interface InputBoxParameters {
    title: string;
    step: number;
    totalSteps: number;
    value: string;
    prompt: string;
    password?: boolean;
    placeholder?: string | '';
    ignoreFocusOut?: boolean | false;
    validate: (value: string) => Promise<string | undefined>;
    buttons?: QuickInputButton[];
    shouldResume: () => Thenable<boolean>;
}

class MultiStepInput {

    static async run<T>(start: InputStep) {
        const input = new MultiStepInput();
        return input.stepThrough(start);
    }

    private current?: QuickInput;
    private steps: InputStep[] = [];

    private async stepThrough<T>(start: InputStep) {
        let step: InputStep | void = start;
        while (step) {
            this.steps.push(step);
            if (this.current) {
                this.current.enabled = false;
                this.current.busy = true;
            }
            try {
                step = await step(this);
            } catch (err) {
                if (err === InputFlowAction.back) {
                    this.steps.pop();
                    step = this.steps.pop();
                } else if (err === InputFlowAction.resume) {
                    step = this.steps.pop();
                } else if (err === InputFlowAction.cancel) {
                    step = undefined;
                } else {
                    throw err;
                }
            }
        }
        if (this.current) {
            this.current.dispose();
        }
    }

    async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>({ 
        title, 
        step, 
        totalSteps, 
        items, 
        activeItem, 
        placeholder, 
        buttons, 
        shouldResume 
    }: P) {
        const disposables: Disposable[] = [];
        try {
            return await new Promise<T | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
                const input = window.createQuickPick<T>();
                input.title = title;
                input.step = step;
                input.totalSteps = totalSteps;
                input.placeholder = placeholder;
                input.items = items;
                if (activeItem) {
                    input.activeItems = [activeItem];
                }
                input.buttons = [
                    ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
                    ...(buttons || [])
                ];
                disposables.push(
                    input.onDidTriggerButton(item => {
                        if (item === QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        } else {
                            resolve(<any>item);
                        }
                    }),
                    input.onDidChangeSelection(items => resolve(items[0])),
                    input.onDidHide(() => {
                        (async () => {
                            reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
                        })()
                            .catch(reject);
                    })
                );
                if (this.current) {
                    this.current.dispose();
                }
                this.current = input;
                this.current.show();
            });
        } finally {
            disposables.forEach(d => d.dispose());
        }
    }

    async showInputBox<P extends InputBoxParameters>({ 
        title, 
        step, 
        totalSteps, 
        value, 
        prompt, 
        password, 
        placeholder, 
        ignoreFocusOut, 
        validate, 
        buttons, 
        shouldResume 
    }: P) {
        const disposables: Disposable[] = [];
        try {
            return await new Promise<string | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
                const input = window.createInputBox();
                input.title = title;
                input.step = step;
                input.totalSteps = totalSteps;
                input.password = password || false;
                input.value = value || '';
                input.prompt = prompt;
                input.placeholder = placeholder || '';
                input.ignoreFocusOut = ignoreFocusOut || false;
                input.buttons = [
                    ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
                    ...(buttons || [])
                ];
                let validating = validate('');
                disposables.push(
                    input.onDidTriggerButton(item => {
                        if (item === QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        } else {
                            resolve(<any>item);
                        }
                    }),
                    input.onDidAccept(async () => {
                        const value = input.value;
                        input.enabled = false;
                        input.busy = true;
                        if (!(await validate(value))) {
                            resolve(value);
                        }
                        input.enabled = true;
                        input.busy = false;
                    }),
                    input.onDidChangeValue(async text => {
                        const current = validate(text);
                        validating = current;
                        const validationMessage = await current;
                        if (current === validating) {
                            input.validationMessage = validationMessage;
                        }
                    }),
                    input.onDidHide(() => {
                        (async () => {
                            reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
                        })()
                            .catch(reject);
                    })
                );
                if (this.current) {
                    this.current.dispose();
                }
                this.current = input;
                this.current.show();
            });
        } finally {
            disposables.forEach(d => d.dispose());
        }
    }
}