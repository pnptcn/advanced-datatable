import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { ForceDirectedLayout } from "./layouts/forcedirected"
import { CircularLayout } from './layouts/circular';
import { HierarchicalLayout } from './layouts/hierachical';

const graphData = {
    "nodes": [
        { "id": "node1", "label": "Node 1", "position": { "x": -200, "y": 100, "z": 0 }, "type": "basicNode" },
        { "id": "node2", "label": "Node 2", "position": { "x": 200, "y": 100, "z": 0 }, "type": "basicNode" },
        { "id": "node3", "label": "Node 3", "position": { "x": 0, "y": -150, "z": 0 }, "type": "basicNode" }
    ],
    "edges": [
        { "source": "node1", "target": "node2" },
        { "source": "node1", "target": "node3" }
    ]
};

class NodeGraphEditor extends HTMLElement {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private labelRenderer: CSS2DRenderer;
    private root: THREE.Group;
    private nodes: THREE.Group[] = [];
    private edges: THREE.Mesh[] = [];
    private draggedNode: THREE.Group | null = null;
    private isDragging: boolean = false;
    private previousMousePosition = { x: 0, y: 0 };
    private selectedNode: THREE.Group | null = null;
    private isConnecting: boolean = false;
    private currentEdge: THREE.Line | null = null;
    private startPort: THREE.Mesh | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.init();
        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('pointermove', this.onPointerMove.bind(this));
        window.addEventListener('pointerdown', this.onPointerDown.bind(this));
        window.addEventListener('pointerup', this.onPointerUp.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));

        const addNodeButton = document.getElementById('addNodeButton');
        if (addNodeButton) {
            addNodeButton.addEventListener('click', () => this.addNewNode());
        }
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        window.removeEventListener('pointermove', this.onPointerMove.bind(this));
        window.removeEventListener('pointerdown', this.onPointerDown.bind(this));
        window.removeEventListener('pointerup', this.onPointerUp.bind(this));
        window.removeEventListener('keydown', this.onKeyDown.bind(this));
    }

    init() {
        this.setupScene();
        this.setupRenderer();
        this.createGridFloor();
        this.setupLighting();
        this.setupControls();

        this.root = new THREE.Group();
        this.scene.add(this.root);

        this.animate();
    }

    loadGraphFromJSON(graphData: any) {
        // Clear any existing nodes and edges
        this.nodes.forEach(node => this.root.remove(node));
        this.edges.forEach(edge => this.root.remove(edge));
        this.nodes = [];
        this.edges = [];
    
        // Map to store nodes by ID for quick access
        const nodeMap: Map<string, THREE.Group> = new Map();
    
        // Create nodes
        graphData.nodes.forEach((nodeData: any) => {
            const position = new THREE.Vector3(nodeData.position.x, nodeData.position.y, nodeData.position.z);
            const node = this.createNode(position, nodeData.label, nodeData.type);
            this.root.add(node);
            this.nodes.push(node);
            nodeMap.set(nodeData.id, node); // Store node in map by its ID
        });
    
        // Create edges based on the connections
        graphData.edges.forEach((edgeData: any) => {
            const sourceNode = nodeMap.get(edgeData.source);
            const targetNode = nodeMap.get(edgeData.target);
    
            if (sourceNode && targetNode) {
                const edge = this.create3DEdge(sourceNode, targetNode);
                if (edge) {
                    this.root.add(edge);
                    this.edges.push(edge);
                }
            }
        });

        this.runLayout()
    }

    runLayout() {
        // const layout = new ForceDirectedLayout(this.nodes, this.edges);
        // const layout = new CircularLayout(this.nodes, this.edges)
        const layout = new HierarchicalLayout(this.nodes, this.edges)
        layout.calculateLayout();
        layout.animateLayout(3000, () => this.render());
    }

    onKeyDown(event: KeyboardEvent) {
        console.log(event)
        let layout

        switch (event.key) {
            case '1':
                layout = new HierarchicalLayout(this.nodes, this.edges)
                break;
            case '2':
                layout = new CircularLayout(this.nodes, this.edges)
                break;
            case '3':
                layout = new ForceDirectedLayout(this.nodes, this.edges)
                break;
            default:
                break;
        }

        layout?.calculateLayout();
        layout?.animateLayout(3000, () => this.render());
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
        this.labelRenderer.setSize(width, height);
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 5000);
        this.camera.position.set(0, 300, 1200); // Move the camera up and back
        this.camera.rotation.x = -0.3; // Tilt the camera downward slightly
        this.scene.add(this.camera);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true; // Enable shadows
        this.shadowRoot?.appendChild(this.renderer.domElement);

        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        this.shadowRoot?.appendChild(this.labelRenderer.domElement);
    }

    createGridFloor() {
        const gridHelper = new THREE.GridHelper(2000, 50, 0x444444, 0x222222);
        gridHelper.material.opacity = 0.2;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
    }

    setupLighting() {
        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0x606060, 2); // Increase intensity for overall brightness
        this.scene.add(ambientLight);

        // Key light for main illumination
        const keyLight = new THREE.DirectionalLight(0xffffff, 1);
        keyLight.position.set(5, 10, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 5000;
        this.scene.add(keyLight);

        // Add a point light to focus on nodes
        const pointLight = new THREE.PointLight(0xffffff, 1.5, 1000);
        pointLight.position.set(0, 300, 200);
        this.scene.add(pointLight);
    }

    setupControls() {
        // Adding zoom support with mouse wheel
        window.addEventListener('wheel', (event) => {
            this.camera.position.z += event.deltaY * 0.5; // Adjust zoom sensitivity
            this.camera.position.z = Math.max(200, Math.min(3000, this.camera.position.z)); // Clamp zoom levels
        });
    }    

    createNode(position: THREE.Vector3, label: string, configKey: string): THREE.Group {
        const nodeGroup = new THREE.Group();
        nodeGroup.position.copy(position);

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            console.error("Failed to get canvas context");
            return nodeGroup;
        }

        const canvasWidth = 400;
        const canvasHeight = 200;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        context.fillStyle = '#000000';
        context.fillRect(0, 0, canvasWidth, canvasHeight);

        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.fillText('Enter name:', 20, 40);
        context.strokeStyle = 'white';
        context.strokeRect(150, 20, 200, 30);

        context.fillText('Select option:', 20, 90);
        context.strokeRect(150, 70, 200, 30);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshPhongMaterial({
            map: texture,
            emissive: 0x111111,
            shininess: 30,
            transparent: true,
            opacity: 0.9,
        });

        const geometry = new THREE.BoxGeometry(canvasWidth, canvasHeight, 30);
        const mesh = new THREE.Mesh(geometry, material);
        nodeGroup.add(mesh);

        // Increase port size slightly for easier interaction
        const portGeometry = new THREE.SphereGeometry(8, 16, 16); // Increased size for better interaction
        const portMaterial = new THREE.MeshPhongMaterial({ color: 0xff7e62 });

        const inputPort = new THREE.Mesh(portGeometry, portMaterial);
        inputPort.position.set(-canvasWidth / 2 - 20, 0, 0);
        inputPort.userData.isPort = true; // Mark as port for raycasting
        nodeGroup.add(inputPort);

        const outputPort = new THREE.Mesh(portGeometry, portMaterial);
        outputPort.position.set(canvasWidth / 2 + 20, 0, 0);
        outputPort.userData.isPort = true; // Mark as port for raycasting
        nodeGroup.add(outputPort);

        nodeGroup.userData = { inputPort, outputPort };

        return nodeGroup;
    }

    addNewNode() {
        const randomX = Math.random() * 800 - 400;
        const randomY = Math.random() * 600 - 300;
        const newNode = this.createNode(new THREE.Vector3(randomX, randomY, 0), 'New Node', 'basicNode');
        this.root.add(newNode);
        this.nodes.push(newNode);
    }

    createTemporaryEdge(startPort: THREE.Mesh): THREE.Line {
        const material = new THREE.LineBasicMaterial({ color: 0x00aaff });
        const startPosition = startPort.getWorldPosition(new THREE.Vector3()); // Start from the port's world position
    
        // Initialize the edge with the same start and end position
        const points = [startPosition.clone(), startPosition.clone()];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
        const line = new THREE.Line(geometry, material);
        return line;
    }

    create3DEdge(node1: THREE.Group, node2: THREE.Group): THREE.Mesh | null {
        const outputPort = node1.userData.outputPort as THREE.Mesh;
        const inputPort = node2.userData.inputPort as THREE.Mesh;

        if (!outputPort || !inputPort) {
            console.error('Ports are not properly defined for nodes:', node1, node2);
            return null;
        }

        const start = outputPort.getWorldPosition(new THREE.Vector3());
        const end = inputPort.getWorldPosition(new THREE.Vector3());

        const curve = new THREE.CatmullRomCurve3([start, end]);
        const tubeGeometry = new THREE.TubeGeometry(curve, 20, 5, 8, false);
        const material = new THREE.MeshPhongMaterial({
            color: 0xeaeaea,
            transparent: true,
            opacity: 0.6,
        });

        const edge = new THREE.Mesh(tubeGeometry, material);
        edge.userData = { node1, node2, outputPort, inputPort }; // Store references for updates

        return edge;
    }

    onPointerDown(event: PointerEvent) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
    
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(this.nodes, true); // Use 'true' to recursively check all children
    
        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
    
            // Check if the clicked object is a port
            if (intersectedObject.userData.isPort) {
                this.isConnecting = true;
                this.startPort = intersectedObject as THREE.Mesh;
                this.currentEdge = this.createTemporaryEdge(this.startPort);
                this.root.add(this.currentEdge);
            } else {
                // If not clicking a port, assume it's the node body and start dragging the node
                this.isDragging = true;
                this.draggedNode = intersectedObject.parent as THREE.Group;
                this.previousMousePosition.x = event.clientX;
                this.previousMousePosition.y = event.clientY;
            }
        }
    }
    
    onPointerMove(event: PointerEvent) {
        if (this.isConnecting && this.currentEdge) {
            const rect = this.renderer.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );
    
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.camera);
    
            // Intersect a plane that matches the screen plane to get the correct world position
            const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Z=0 plane
            const point = new THREE.Vector3();
            raycaster.ray.intersectPlane(plane, point);
    
            // Update the end position of the temporary edge
            const positions = (this.currentEdge.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
            const start = this.startPort?.getWorldPosition(new THREE.Vector3());

            if (!start) return;
    
            positions[0] = start.x;
            positions[1] = start.y;
            positions[2] = start.z;
    
            positions[3] = point.x;
            positions[4] = point.y;
            positions[5] = point.z;
    
            this.currentEdge.geometry.attributes.position.needsUpdate = true;
    
            // Optionally, provide visual feedback if the pointer is over a valid target port
            const potentialTargets = raycaster.intersectObjects(this.nodes, true);
            if (potentialTargets.length > 0 && potentialTargets[0].object.userData.isPort) {
                const targetPort = potentialTargets[0].object;
                if (targetPort !== this.startPort) {
                    (this.currentEdge.material as THREE.LineBasicMaterial).color.set(0x00ff00); // Green for valid drop
                }
            } else {
                (this.currentEdge.material as THREE.LineBasicMaterial).color.set(0x00aaff); // Original color
            }
        } else if (this.isDragging && this.draggedNode) {
            // Handle node dragging (no change from before)
            const deltaX = event.clientX - this.previousMousePosition.x;
            const deltaY = event.clientY - this.previousMousePosition.y;
    
            this.draggedNode.position.x += deltaX;
            this.draggedNode.position.y -= deltaY; // Invert Y for proper movement in screen space
    
            this.previousMousePosition.x = event.clientX;
            this.previousMousePosition.y = event.clientY;
    
            this.updateEdges();
        }
    }
    
    onPointerUp(event: PointerEvent) {
        if (this.isConnecting && this.currentEdge) {
            const rect = this.renderer.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );
    
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.nodes, true); // Use 'true' to recursively check all children
    
            if (intersects.length > 0) {
                const intersectedObject = intersects[0].object;
                if (intersectedObject.userData.isPort && intersectedObject !== this.startPort) {
                    const endPort = intersectedObject as THREE.Mesh;
                    const newEdge = this.create3DEdge(this.startPort?.parent as THREE.Group, endPort.parent as THREE.Group);
                    if (newEdge) {
                        this.root.add(newEdge);
                        this.edges.push(newEdge);
                        this.runLayout()
                    }
                }
            }
    
            // Clean up the temporary edge and reset the connection state
            this.root.remove(this.currentEdge);
            this.currentEdge.geometry.dispose();
            this.currentEdge.material.dispose();
            this.currentEdge = null;
            this.isConnecting = false;
            this.startPort = null;
        } else if (this.isDragging) {
            this.isDragging = false;
            this.draggedNode = null;
        }
    }
    
    updateEdges() {
        this.edges.forEach((edge) => {
            const { node1, node2, outputPort, inputPort } = edge.userData;

            // Get the updated world positions
            const start = outputPort.getWorldPosition(new THREE.Vector3());
            const end = inputPort.getWorldPosition(new THREE.Vector3());

            // Update the curve and geometry
            const curve = new THREE.CatmullRomCurve3([start, end]);
            const tubeGeometry = new THREE.TubeGeometry(curve, 20, 5, 8, false);
            edge.geometry.dispose(); // Clean up old geometry
            edge.geometry = tubeGeometry;
        });
    }

    animate(): number {
        const animationId = requestAnimationFrame(this.animate.bind(this));
        this.render();
        return animationId;
    }

    render() {
        this.renderer.render(this.scene, this.camera);
        this.labelRenderer.render(this.scene, this.camera);
    }
}

customElements.define('node-graph-editor', NodeGraphEditor);
