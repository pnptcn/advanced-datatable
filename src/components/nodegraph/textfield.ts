export class TextField {
    private element: HTMLInputElement;

    constructor(placeholder: string = "Enter text") {
        this.element = document.createElement('input');
        this.element.type = 'text';
        this.element.placeholder = placeholder;
        this.element.style.padding = '5px';
        this.element.style.fontSize = '14px';
    }

    getElement() {
        return this.element;
    }

    // Optional: Attach event listeners or expose methods to interact with the control
    setValue(value: string) {
        this.element.value = value;
    }

    getValue(): string {
        return this.element.value;
    }
}
