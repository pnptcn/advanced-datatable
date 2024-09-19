export class MappingControl {
    private element: HTMLElement;
    private mappings: Map<string, string>;

    constructor(columnHeaders: string[]) {
        this.mappings = new Map();
        this.element = document.createElement('div');
        columnHeaders.forEach(header => {
            const input = document.createElement('input');
            input.placeholder = `Rename ${header}`;
            input.addEventListener('input', (event) => {
                this.mappings.set(header, (event.target as HTMLInputElement).value);
            });
            this.element.appendChild(input);
        });
    }

    getElement() {
        return this.element;
    }

    getMappings() {
        return this.mappings;
    }
}
