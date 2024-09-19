export type ViewType = 'table' | 'graph' | 'upload';

interface ViewConfig {
    type: ViewType;
    buttonText: string;
    componentPath: string;
    tagName: string; // The custom element tag name
}

class ViewController {
    private currentView: ViewType | null = null;
    private mainContainer: HTMLElement;
    private viewConfigs: ViewConfig[];
    private transitionDuration = 300; // milliseconds

    constructor(containerSelector: string, configs: ViewConfig[]) {
        this.viewConfigs = configs;
        this.mainContainer = document.querySelector(containerSelector) as HTMLElement;

        if (!this.mainContainer) {
            throw new Error(`Container element not found: ${containerSelector}`);
        }

        this.initialize();
    }

    private async initialize() {
        window.addEventListener('hashchange', () => this.handleRouting());
        this.handleRouting();
    }

    public async navigateTo(viewType: ViewType) {
        await this.fadeOut();
        await this.switchToView(viewType);
        await this.fadeIn();
    }

    private async fadeOut(): Promise<void> {
        return new Promise(resolve => {
            this.mainContainer.style.transition = `opacity ${this.transitionDuration}ms`;
            this.mainContainer.style.opacity = '0';
            setTimeout(resolve, this.transitionDuration);
        });
    }

    private async fadeIn(): Promise<void> {
        return new Promise(resolve => {
            this.mainContainer.style.opacity = '1';
            setTimeout(resolve, this.transitionDuration);
        });
    }

    private async switchToView(viewType: ViewType) {
        const config = this.viewConfigs.find(c => c.type === viewType);
        if (!config) return;

        this.mainContainer.innerHTML = '';

        await import(config.componentPath);
        
        const viewElement = document.createElement(config.tagName);
        this.mainContainer.appendChild(viewElement);

        if (typeof (viewElement as any).setNavigationCallback === 'function') {
            (viewElement as any).setNavigationCallback((newViewType: ViewType) => {
                this.navigateTo(newViewType);
            });
        }

        this.currentView = viewType;
        window.location.hash = viewType;
    }

    private handleRouting() {
        const hash = window.location.hash.replace('#', '') as ViewType;
        const validView = this.viewConfigs.find(config => config.type === hash);
        if (validView) {
            this.navigateTo(hash);
        } else {
            this.navigateTo(this.viewConfigs[0].type);
        }
    }
}

// Usage
const viewConfigs: ViewConfig[] = [
    {
        type: 'table',
        buttonText: 'Switch to Graph View',
        componentPath: './components/datatable.ts',
        tagName: 'data-table'
    },
    {
        type: 'graph',
        buttonText: 'Switch to Table View',
        componentPath: './components/nodegraph/editor.ts',
        tagName: 'node-graph-editor'
    },
    {
        type: 'upload',
        buttonText: 'Upload CSV',
        componentPath: './components/upload.ts',
        tagName: 'upload-csv'
    }
];

document.addEventListener('DOMContentLoaded', () => {
    new ViewController('main', viewConfigs);
});