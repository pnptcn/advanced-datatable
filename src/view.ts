class ViewController {
    private currentView: 'table' | 'graph' = 'table';
    private tableView: HTMLElement;
    private graphView: HTMLElement;
    private switchButton: HTMLButtonElement;

    constructor() {
        this.tableView = document.getElementById('table-view')!;
        this.graphView = document.getElementById('graph-view')!;
        this.switchButton = document.getElementById('switch-view') as HTMLButtonElement;

        this.initialize();
    }

    initialize() {
        // Set up event listener for switching views
        this.switchButton.addEventListener('click', () => this.toggleView());

        // Optionally, you can handle routing (hash-based) if needed
        window.addEventListener('hashchange', () => this.handleRouting());
        this.handleRouting(); // Handle initial load
    }

    toggleView() {
        if (this.currentView === 'table') {
            this.switchToGraphView();
        } else {
            this.switchToTableView();
        }
    }

    switchToTableView() {
        this.graphView.style.display = 'none';
        this.tableView.style.display = 'block';
        this.switchButton.textContent = 'Switch to Node Graph';
        this.currentView = 'table';
    }

    switchToGraphView() {
        this.tableView.style.display = 'none';
        this.graphView.style.display = 'block';
        this.switchButton.textContent = 'Switch to Table View';

        // Lazy load the node graph component if needed
        import('./components/nodegraph/editor').then(module => {
            // Initialize or re-render graph here if necessary
        });

        this.currentView = 'graph';
    }

    handleRouting() {
        const hash = window.location.hash.replace('#', '');
        if (hash === 'graph') {
            this.switchToGraphView();
        } else {
            this.switchToTableView();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ViewController();
});
