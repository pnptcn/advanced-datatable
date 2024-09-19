import { NodeGroup } from "./nodegroup";

class OutputNode extends NodeGroup {
    private finalData: any;

    processData(inputData: any): any {
        this.finalData = inputData;
        return null; // End of data flow
    }

    exportData() {
        // Convert `this.finalData` to CSV or desired format
        const csvContent = this.convertToCSV(this.finalData);
        // Trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'exported_data.csv';
        link.click();
    }

    private convertToCSV(data: any): string {
        // Implement CSV conversion
    }
}
