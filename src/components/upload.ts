/// <reference lib="dom" />

import { Messaging } from './messaging/component';
import Artifact, {ArtifactFactory} from './artifact';
import Papa from 'papaparse';

class UploadComponent extends HTMLElement {
    private fileInput: HTMLInputElement;
    private progressBarContainer: HTMLElement;
    private progressBar: HTMLElement;
    private progressShadow: HTMLElement;
    private messagingChannel: MessageChannel;
    private port: MessagePort;

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        console.debug("Upload widget loaded", "Upload");

        const template = document.createElement("template");
        template.innerHTML = `
            <div id="upload-widget" part="container" onclick="this.querySelector('#file-input').click()">
                <h2>Upload Your Data</h2>
                <p>Drag and drop your CSV file here, or click to browse</p>
                <input type="file" id="file-input" part="input" accept=".csv">
                <div id="progress-bar-container" part="progress-container">
                    <div id="progress-bar" part="progress"></div>
                    <div id="progress-shadow" part="progress-shadow"></div>
                </div>
            </div>
        `;
        this.shadowRoot!.appendChild(template.content.cloneNode(true));

        this.fileInput = this.shadowRoot!.querySelector("#file-input") as HTMLInputElement;
        this.progressBarContainer = this.shadowRoot!.querySelector("#progress-bar-container") as HTMLElement;
        this.progressBar = this.shadowRoot!.querySelector('[part="progress"]') as HTMLElement;
        this.progressShadow = this.shadowRoot!.querySelector('[part="progress-shadow"]') as HTMLElement;

        this.progressBar.style.width = "0%";
        this.progressShadow.style.width = "0%";

        this.messagingChannel = new MessageChannel();
        this.port = this.messagingChannel.port1;
        this.port.start();
    }

    connectedCallback() {
        this.fileInput.addEventListener("change", this.handleFileChange.bind(this));
        this.addEventListener("dragover", this.handleDragOver.bind(this));
        this.addEventListener("dragleave", this.handleDragLeave.bind(this));
        this.addEventListener("drop", this.handleDrop.bind(this));
        this.setupMessaging();
    }

    setupMessaging() {
        Messaging().subscribe("data", this.messagingChannel.port2);
        this.port.onmessage = (event) => this.handleMessage(event.data);
        console.debug('DataTable subscribed to "data" channel', 'DataTable');
    }

    handleMessage(data: any) {
        console.debug(`Received message in Upload`, "Upload");
    }

    handleFileChange(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            const file = target.files[0];
            console.debug(`File selected: ${file.name}`, "Upload");
            this.parseFile(file);
        }
    }

    handleDragOver(event: DragEvent) {
        event.preventDefault();
        this.style.boxShadow = "0 20px 60px rgba(0, 0, 0, 0.6)";
    }

    handleDragLeave() {
        this.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.3)";
    }

    handleDrop(event: DragEvent) {
        event.preventDefault();
        this.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.3)";
        if (event.dataTransfer && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0];
            console.debug(`File dropped: ${file.name}`, "Upload");
            this.parseFile(file);
        }
    }

    parseFile(file: File) {
        this.showProgressBar();
        let headers: string[] = [];
        let data: any[] = [];
        let rowCount = 0;

        Papa.parse(file, {
            worker: true,
            dynamicTyping: true,
            step: (results: any, parser: any) => {
                rowCount++;
                const rowData = results.data as any[];

                // If the row is empty (all values are null/undefined), skip it
                if (rowData.every(value => value === null || value === undefined)) {
                    return;
                }

                if (rowCount === 1) {
                    headers = rowData;
                } else {
                    data.push(rowData);
                }
                const estimatedRows = Math.max(rowCount, 1000);
                this.updateProgressBar((rowCount / estimatedRows) * 100);
            },
            complete: () => {
                this.updateProgressBar(100);
                console.debug(`File parsed: ${file.name}, ${rowCount} rows`, "Upload");
                this.sendParsedData(headers, data);
                this.hideWidget();
            },
            error: (error: any) => {
                console.error(`Error parsing file: ${error.message}`, "Upload");
            }
        });
    }

    sendParsedData(headers: string[], data: any[]) {
        console.debug(`Sending parsed data. Headers: ${headers.join(', ')}`, "Upload");
        console.debug(`Data rows: ${data.length}`, "Upload");

        if (this.messagingChannel) {
            const formattedData = data.map(row => {
                let rowObject: { [key: string]: any } = {};
                headers.forEach((header, index) => {
                    rowObject[header] = row[index];
                });
                return rowObject;
            });

            const msg = ArtifactFactory().get({
                headers,
                data: formattedData
            }, 'upload', 'data', 'uploadComplete');

            try {
                ArtifactFactory().validate(msg);
                this.port.postMessage(msg);
                console.debug('Parsed data sent on data channel', 'Upload');
            } catch (error: any) {
                console.error(`Failed to send parsed data: ${error.message}`, 'Upload');
                console.error(`Failed message: ${JSON.stringify(msg)}`, 'Upload');
            }
        } else {
            console.error('Messaging channel not available, data not sent', 'Upload');
        }
    }

    showProgressBar() {
        this.progressBarContainer.classList.add("visible");
    }

    updateProgressBar(progress: number) {
        this.progressBar.style.width = `${progress}%`;
        this.progressShadow.style.width = `${progress / 2 - 9}%`;
    }

    hideWidget() {
        this.classList.add("hidden");
        setTimeout(() => {
            this.style.display = "none";
        }, 500);
    }
}

customElements.define("upload-csv", UploadComponent);
export default UploadComponent
