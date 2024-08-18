import NodeComponent from "./node";
import EdgeComponent from "./edge";
import { Messaging } from "../messaging/component";

class GraphComponent extends HTMLElement {
    private nodes: NodeComponent[] = [];
    private edges: EdgeComponent[] = [];
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null = null;
    private columnHeaders: string[] = [];
    private messagingChannel: MessageChannel;
    private port: MessagePort;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Create a canvas for drawing the graph
        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.shadowRoot!.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        
        this.messagingChannel = new MessageChannel();
        this.port = this.messagingChannel.port1;
        this.port.start();
    }

    connectedCallback() {
        Messaging().subscribe("data", this.messagingChannel.port2);
        this.port.onmessage = (event) => {
            this.handleMessage(event.data);
        };
        this.render(); // Initial render
    }

    handleMessage(msg: any) {
        if (msg.topic === 'uploadComplete') {
            this.columnHeaders = msg.payload.headers;
            this.initializeNodes();
        }
    }

    initializeNodes() {
        // Create the left node with output ports for each column
        const leftNode = this.createNode("output");

        // Create the right node with a button to add input ports
        const rightNode = this.createNode("Target Schema");

        const addInputButton = document.createElement("button");
        addInputButton.textContent = "Add Input";
        addInputButton.addEventListener("click", () => {
            rightNode.addPort("input");
        });
        rightNode.appendChild(addInputButton);

        this.render(); // Re-render after adding nodes
    }

    createNode(title: string): NodeComponent {
        const node = document.createElement('node-component') as NodeComponent;
        node.setTitle(title); // Set the title using the method
        this.shadowRoot!.appendChild(node);
        this.nodes.push(node);
        return node;
    }

    render() {
        if (!this.ctx) return;

        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Redraw all edges
        this.edges.forEach(edge => {
            const connection = edge.getConnection();
            if (connection) {
                this.drawEdge(connection.from, connection.to);
            }
        });
    }

    drawEdge(from: { x: number, y: number }, to: { x: number, y: number }) {
        if (!this.ctx) return;
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.strokeStyle = '#007bff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
}

customElements.define('node-graph', GraphComponent);
export default GraphComponent;
