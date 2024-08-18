import * as THREE from "three";

export class HierarchicalLayout {
    private nodes: THREE.Group[];
    private edges: THREE.Mesh[];
    private targetPositions: Map<THREE.Group, THREE.Vector3>;
    private animationInProgress = false;
    private layerHeight = 250;
    private nodeWidth = 100;

    constructor(nodes: THREE.Group[], edges: THREE.Mesh[]) {
        this.nodes = nodes;
        this.edges = edges;
        this.targetPositions = new Map();
    }

    calculateLayout() {
        // Find the root nodes (nodes without input ports)
        const rootNodes = this.nodes.filter(node => {
            return !this.edges.some(edge => edge.userData.node2 === node);
        });
        
        // Recursively position nodes
        this.positionNode(rootNodes, 0, 0);
    }

    private positionNode(nodes: THREE.Group[], level: number, startX: number): number {
        let currentX = startX;

        nodes.forEach((node, index) => {
            const initialPosition = node.position.clone();
            
            // Find children nodes (nodes connected to this node's output ports)
            const children = this.edges
                .filter(edge => edge.userData.node1 === node)
                .map(edge => edge.userData.node2);

            // Position children first to determine the width of this subtree
            const childrenWidth = this.positionNode(children, level + 1, currentX);
            
            // If the node has children, center it above its children
            const nodeX = children.length > 0 ? currentX + childrenWidth / 2 : currentX + this.nodeWidth / 2;
            const nodeY = -level * this.layerHeight;
            
            const targetPosition = new THREE.Vector3(nodeX, nodeY, 0);
            this.targetPositions.set(node, targetPosition);

            // Move currentX past this node and its children
            currentX += Math.max(childrenWidth, this.nodeWidth);
        });

        return currentX - startX; // Return total width of this level
    }

    animateLayout(duration: number = 2000, onUpdate: () => void) {
        const startTime = performance.now();
        this.animationInProgress = true;

        const animate = (time: number) => {
            const elapsedTime = time - startTime;
            const progress = Math.min(elapsedTime / duration, 1);

            this.nodes.forEach((node, index) => {
                const targetPosition = this.targetPositions.get(node);

                if (targetPosition) {
                    const currentPosition = node.position;
                    const oldPosition = currentPosition.clone();
                    currentPosition.lerp(targetPosition, progress);

                    const moved = !oldPosition.equals(currentPosition);

                    if (moved) {
                        node.position.copy(currentPosition); // Ensure the position is updated
                        node.updateMatrix();
                        if (node.children.length > 0) {
                            node.updateMatrixWorld(true);
                        }
                    }
                }
            });

            this.updateEdges();
            onUpdate();

            if (progress < 1 && this.animationInProgress) {
                requestAnimationFrame(animate);
            } else {
                this.animationInProgress = false;
            }
        };

        requestAnimationFrame(animate);
    }

    stopAnimation() {
        this.animationInProgress = false;
    }

    updateEdges() {
        this.edges.forEach(edge => {
            const { node1, node2, outputPort, inputPort } = edge.userData;

            // Get the updated world positions of the ports
            const start = outputPort.getWorldPosition(new THREE.Vector3());
            const end = inputPort.getWorldPosition(new THREE.Vector3());

            // Recalculate the edge geometry based on the new node positions
            const curve = new THREE.CatmullRomCurve3([start, end]);
            const tubeGeometry = new THREE.TubeGeometry(curve, 20, 5, 8, false);
            edge.geometry.dispose(); // Clean up old geometry
            edge.geometry = tubeGeometry;
        });
    }
}