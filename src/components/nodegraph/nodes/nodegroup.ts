import * as THREE from 'three';

export class NodeGroup extends THREE.Group {
    // ...

    processData(inputData: any): any {
        // Default implementation, can be overridden
        return inputData;
    }
}
