export class NodeComponent extends HTMLElement {
    private isDragging: boolean = false;
    private offsetX: number = 0;
    private offsetY: number = 0;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const wrapper = document.createElement('div');
        wrapper.setAttribute('part', 'node-wrapper');
        this.shadowRoot!.appendChild(wrapper);
    }

    connectedCallback() {
        this.setupDragAndDrop();
    }

    setTitle(title: string) {
        this.title = title;
        const wrapper = this.shadowRoot!.querySelector('div');
        if (wrapper) {
            wrapper.textContent = title;
        }
    }

    setupDragAndDrop() {
        const node = this;

        this.addEventListener('mousedown', (event: MouseEvent) => {
            this.isDragging = true;
            // Calculate the offset between the mouse position and the top-left corner of the node
            this.offsetX = event.clientX - this.getBoundingClientRect().left;
            this.offsetY = event.clientY - this.getBoundingClientRect().top;
        });

        document.addEventListener('mousemove', (event: MouseEvent) => {
            if (this.isDragging) {
                const graphContainer = this.closest('node-graph') as HTMLElement;
                if (!graphContainer) return;

                const containerRect = graphContainer.getBoundingClientRect();
                
                // Ensure the node stays within the bounds of the graph container
                const x = Math.max(0, event.clientX - containerRect.left - this.offsetX);
                const y = Math.max(0, event.clientY - containerRect.top - this.offsetY);

                this.style.transform = `translate(${x}px, ${y}px)`;
            }
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }
}

customElements.define("node-component", NodeComponent)
export default NodeComponent