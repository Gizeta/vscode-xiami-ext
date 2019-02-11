import * as vscode from 'vscode';
import ExtensionHost from './host';

let host: ExtensionHost;

export function activate(context: vscode.ExtensionContext) {
	host = new ExtensionHost(context);
}

export function deactivate() {
	host.destroy();
}
