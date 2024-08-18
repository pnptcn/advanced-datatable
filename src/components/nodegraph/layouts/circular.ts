import * as THREE from "three";

export class CircularLayout {
    private nodes: THREE.Group[];
    private edges: THREE.Mesh[];
    private targetPositions: Map<THREE.Group, THREE.Vector3>;
    private animationInProgress = false;

    constructor(nodes: THREE.Group[], edges: THREE.Mesh[]) {
        this.nodes = nodes;
        this.edges = edges;
        this.targetPositions = new Map();
    }

    calculateLayout(radius: number = 200) {
        const centerX = 0;
        const centerY = 0;
        const angleStep = (2 * Math.PI) / this.nodes.length;

        this.nodes.forEach((node, index) => {
            const angle = index * angleStep;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            const initialPosition = node.position.clone();
            const targetPosition = new THREE.Vector3(x, y, 0);

            this.targetPositions.set(node, targetPosition);
        });
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
