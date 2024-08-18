import { NodeComponent } from './node';

export class EdgeComponent extends HTMLElement {
    private fromNode: NodeComponent | null = null;
    private toNode: NodeComponent | null = null;

    constructor() {
        super();
    }

    setFromNode(node: NodeComponent) {
        this.fromNode = node;
    }

    setToNode(node: NodeComponent) {
        this.toNode = node;
    }

    getConnection() {
        if (!this.fromNode || !this.toNode) return null;
        return {
            from: this.fromNode.getPosition(),
            to: this.toNode.getPosition(),
        };
    }
}

customElements.define('edge-component', EdgeComponent);
export default EdgeComponent;
