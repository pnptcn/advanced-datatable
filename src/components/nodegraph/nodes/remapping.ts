import { NodeGroup } from './nodegroup';

class RemappingNode extends NodeGroup {
    processData(inputData: any): any {
        const mappings = this.userData.control.getMappings();
        return inputData.map((row: any) => {
            const newRow: any = {};
            for (const key in row) {
                const newKey = mappings.get(key) || key;
                newRow[newKey] = row[key];
            }
            return newRow;
        });
    }
}
