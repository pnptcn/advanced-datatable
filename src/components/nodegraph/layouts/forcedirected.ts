import * as THREE from "three"

export class ForceDirectedLayout {
    private nodes: THREE.Group[];
    private edges: THREE.Mesh[];
    private targetPositions: Map<THREE.Group, THREE.Vector3>;
    private animationInProgress = false;

    constructor(nodes: THREE.Group[], edges: THREE.Mesh[]) {
        this.nodes = nodes;
        this.edges = edges;
        this.targetPositions = new Map();
    }

    calculateLayout() {
        const attractionStrength = 0.005;
        const repulsionStrength = 10000000;
        const damping = 0.95;

        // Store initial positions
        const initialPositions = this.nodes.map(node => node.position.clone());

        // Calculate target positions after running the layout
        for (let i = 0; i < 500; i++) {
            // Apply repulsion
            for (let j = 0; j < this.nodes.length; j++) {
                for (let k = j + 1; k < this.nodes.length; k++) {
                    const nodeA = this.nodes[j];
                    const nodeB = this.nodes[k];
                    const direction = new THREE.Vector3().subVectors(nodeB.position, nodeA.position);
                    const distance = Math.max(20, direction.length());

                    const repulsionForce = repulsionStrength / (distance * distance);
                    direction.normalize().multiplyScalar(repulsionForce);

                    nodeB.position.add(direction);
                    nodeA.position.sub(direction);
                }
            }

            // Apply attraction
            for (const edge of this.edges) {
                const nodeA = edge.userData.node1 as THREE.Group;
                const nodeB = edge.userData.node2 as THREE.Group;

                const direction = new THREE.Vector3().subVectors(nodeB.position, nodeA.position);
                const distance = Math.max(20, direction.length());

                const attractionForce = distance * attractionStrength;
                direction.normalize().multiplyScalar(attractionForce);

                nodeB.position.sub(direction);
                nodeA.position.add(direction);
            }

            // Apply damping
            this.nodes.forEach(node => {
                node.position.multiplyScalar(damping);
            });
        }

        // After the force-directed algorithm runs
        console.log("Calculated layout:");
        this.nodes.forEach((node, index) => {
            const initialPosition = initialPositions[index];
            // Store the final positions as target positions
            this.targetPositions.set(node, node.position.clone());
            // Reset node position to initial position for animation
            node.position.copy(initialPosition);
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