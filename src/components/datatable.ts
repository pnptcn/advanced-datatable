/// <reference lib="dom" />

import * as echarts from 'echarts';
import { table, Table as ArqueroTable } from 'arquero';
import { Messaging } from './messaging/component';

const sanitizeHeader = (header: string): string => {
    return header.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
};

class DataTableComponent extends HTMLElement {
    private arqueroTable: ArqueroTable | null = null; // Arquero table
    private messagingChannel: MessageChannel;
    private port: MessagePort;
    private table: HTMLTableElement;
    private thead: HTMLTableSectionElement;
    private tbody: HTMLTableSectionElement;
    private originalHeaders: string[] = [];
    private sanitizedHeaders: string[] = [];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.messagingChannel = new MessageChannel();
        this.port = this.messagingChannel.port1;
        this.port.start();

        // Initialize table structure
        this.table = document.createElement('table');
        this.table.setAttribute("part", "datatable");

        this.thead = document.createElement('thead');
        this.thead.setAttribute("part", "thead");
        this.thead.classList.add("sticky-header");

        this.tbody = document.createElement('tbody');
        this.tbody.setAttribute("part", "tbody");

        this.table.appendChild(this.thead);
        this.table.appendChild(this.tbody);
        this.shadowRoot!.appendChild(this.table);

        console.debug('DataTable initialized', 'DataTable');
    }

    connectedCallback() {
        // Ensure setup occurs only when component is connected
        this.setupMessaging();
    }

    setupMessaging() {
        Messaging().subscribe("data", this.messagingChannel.port2);
        this.port.onmessage = (event) => {
            this.handleMessage(event.data);
        };
        console.debug('DataTable subscribed to "data" channel', 'DataTable');
    }

    handleMessage(msg: any) {
        try {
            if (msg.topic === 'uploadComplete') {
                console.debug(`Data received: ${msg.payload.data.length} rows`, 'DataTable');
                const originalHeaders = msg.payload.headers as string[];

                // Create a mapping between original headers and sanitized headers
                const headerMapping: Record<string, string> = originalHeaders.reduce((acc, header) => {
                    const sanitized = sanitizeHeader(header);
                    acc[sanitized] = header; // Map sanitized header to original header
                    return acc;
                }, {} as Record<string, string>);

                // Store both original and sanitized headers
                this.originalHeaders = originalHeaders;
                this.sanitizedHeaders = Object.keys(headerMapping);

                // Convert raw data to an Arquero table with sanitized headers
                this.arqueroTable = table({
                    ...this.sanitizedHeaders.reduce((acc, sanitizedHeader) => {
                        const originalHeader = headerMapping[sanitizedHeader];
                        acc[sanitizedHeader] = msg.payload.data.map((row: any) => row[originalHeader]);
                        return acc;
                    }, {} as Record<string, any[]>)
                });

                // Delay rendering until the next animation frame to ensure the DOM is fully ready
                requestAnimationFrame(() => {
                    this.setTableData(headerMapping);
                });
            } else {
                console.debug(`Unexpected message topic: ${msg.topic}`, 'DataTable');
            }
        } catch (error: any) {
            console.error(`Invalid message received: ${error.message}`, 'DataTable');
        }
    }

    binNumericData(data: number[]) {
        const binnedData = data.reduce((acc, value) => {
            let range: string;
            if (value <= 1000) range = '0-1000';
            else if (value <= 5000) range = '1001-5000';
            else if (value <= 10000) range = '5001-10000';
            else range = '>10000';
    
            if (!acc[range]) acc[range] = 0;
            acc[range]++;
    
            return acc;
        }, {} as Record<string, number>);
    
        return Object.keys(binnedData).map(range => ({
            label: range,
            value: binnedData[range]
        }));
    }
    
    binDatetimeData(data: Date[]) {
        const binnedData = data.reduce((acc, date) => {
            const year = date.getFullYear();
            if (!acc[year]) acc[year] = 0;
            acc[year]++;
            return acc;
        }, {} as Record<string, number>);
    
        return Object.keys(binnedData).map(year => ({
            label: year,
            value: binnedData[year]
        }));
    }
    
    binStringData(data: string[]) {
        const frequency = data.reduce((acc, value) => {
            if (!acc[value]) acc[value] = 0;
            acc[value]++;
            return acc;
        }, {} as Record<string, number>);
    
        // Sort by most common first
        const sortedKeys = Object.keys(frequency).sort((a, b) => frequency[b] - frequency[a]);
    
        return sortedKeys.map(key => ({
            label: key,
            value: frequency[key]
        }));
    }

    createMiniChart(sanitizedHeader: string) {
        if (!this.arqueroTable) return;
        
        // Check for missing or null values
        const containsMissingValues = this.arqueroTable.array(sanitizedHeader).some(value => value === null || value === undefined);
        
        if (containsMissingValues) {
            // If missing values are found, show the warning indicator
            const headerElement = this.shadowRoot!.querySelector(`#header-${sanitizedHeader}`);

            if (headerElement) {
                const warnTri = document.createElement("span");
                warnTri.setAttribute("part", "warning-triangle");
                warnTri.innerText = "⚠️";
                headerElement.prepend(warnTri);
            }
        }
    
        // Get the column data
        const columnData = this.arqueroTable.array(sanitizedHeader);
        const columnType = this.determineColumnType(columnData);
    
        let chartData = [];
    
        switch (columnType) {
            case 'number':
                chartData = this.binNumericData(Array.from(columnData).filter((v): v is number => typeof v === 'number'));
                break;
            case 'datetime':
                chartData = this.binDatetimeData(Array.from(columnData).map(value => new Date(value as string)));
                break;
            case 'string':
                chartData = this.binStringData(Array.from(columnData).filter((v): v is string => typeof v === 'string'));
                break;
            default:
                console.warn(`Unsupported column type: ${columnType} for header "${sanitizedHeader}"`);
                return;
        }
    
        // Ensure the chart DOM is ready
        const chartDom = this.shadowRoot!.getElementById(`chart-${sanitizedHeader}`);
        if (!chartDom) return;
    
        try {
            const myChart = echarts.init(chartDom, "light");
    
            const option = {
                tooltip: {
                    confine: true
                },
                xAxis: {
                    type: 'category',
                    data: chartData.map(row => row.label)
                },
                yAxis: {
                    type: 'value',
                    show: false
                },
                series: [{
                    type: 'bar',
                    data: chartData.map(row => row.value)
                }]
            };
    
            myChart.setOption(option);
            window.addEventListener("resize", () => {
                myChart.resize();
            });
        } catch (error: any) {
            console.error(`Failed to initialize chart for header "${sanitizedHeader}": ${error.message}`, 'DataTable');
        }
    }
    
    calculateSummaryStatsForColumn(columnData: any[], columnType: string) {
        switch (columnType) {
            case 'number':
                const numericData = columnData.filter((value) => typeof value === 'number' && !isNaN(value));
                if (numericData.length === 0) return { min: 0, max: 0, mean: 0 };
    
                const min = Math.min(...numericData);
                const max = Math.max(...numericData);
                const mean = numericData.reduce((sum, value) => sum + value, 0) / numericData.length;
    
                return { min, max, mean };
    
            case 'string':
                const uniqueValues = Array.from(new Set(columnData));
                const mostCommonValue = uniqueValues.sort((a, b) =>
                    columnData.filter(v => v === b).length - columnData.filter(v => v === a).length
                )[0];
    
                return { mode: mostCommonValue, uniqueCount: uniqueValues.length, totalCount: columnData.length };
    
            case 'boolean':
                const trueCount = columnData.filter(value => value === true).length;
                const falseCount = columnData.filter(value => value === false).length;
    
                return { trueCount, falseCount, totalCount: columnData.length };
    
            case 'datetime':
                const dateData = columnData
                    .map(value => new Date(value))
                    .filter(date => !isNaN(date.getTime()));
    
                if (dateData.length === 0) return { earliest: '-', latest: '-', range: '-' };
    
                const earliest = new Date(Math.min(...dateData));
                const latest = new Date(Math.max(...dateData));
                const range = latest.getTime() - earliest.getTime();
    
                return { earliest: earliest.toISOString().split('T')[0], latest: latest.toISOString().split('T')[0], range };
    
            default:
                return {};
        }
    }
    
    // Function to check if a string is a valid date
    isValidDate(dateString: string): boolean {
        const date = new Date(dateString);
        return !isNaN(date.getTime()); // Check if the date is valid
    }

    // Enhanced function to determine the type of a column
    determineColumnType(columnData: any[]): string {
        const nonNullData = columnData.filter(value => value !== null && value !== undefined);
        if (nonNullData.every(value => typeof value === 'number')) return 'number';
        if (nonNullData.every(value => typeof value === 'boolean')) return 'boolean';
        if (nonNullData.every(value => typeof value === 'string' && this.isValidDate(value))) return 'datetime';
        return 'string';
    }

    // Adjust the setTableData method
    setTableData(headerMapping: Record<string, string>) {
        if (!this.arqueroTable) return;

        const validRows = this.arqueroTable.objects().filter(row =>
            Object.values(row).some(value => value !== null && value !== undefined)
        );

        this.thead.innerHTML = `
            <tr part="tr">
                ${this.sanitizedHeaders.map(sanitizedHeader => {
                    const columnData = this.arqueroTable!.array(sanitizedHeader);
                    const columnType = this.determineColumnType(columnData);

                    const summaryStats = this.calculateSummaryStatsForColumn(columnData, columnType);

                    let summaryDisplay;
                    switch (columnType) {
                        case 'number':
                            summaryDisplay = `
                                <dt part="dt">Min</dt>
                                <dd part="dd">${summaryStats.min}</dd>
                                <dt part="dt">Max</dt>
                                <dd part="dd">${summaryStats.max}</dd>
                                <dt part="dt">Mean</dt>
                                <dd part="dd">${summaryStats.mean.toFixed(2)}</dd>
                            `;
                            break;
                        case 'string':
                            summaryDisplay = `
                                <dt part="dt">Mode</dt>
                                <dd part="dd">${summaryStats.mode}</dd>
                                <dt part="dt">Unique</dt>
                                <dd part="dd">${summaryStats.uniqueCount}</dd>
                                <dt part="dt">Total</dt>
                                <dd part="dd">${summaryStats.totalCount}</dd>
                            `;
                            break;
                        case 'boolean':
                            summaryDisplay = `
                                <dt part="dt">True</dt>
                                <dd part="dd">${summaryStats.trueCount}</dd>
                                <dt part="dt">False</dt>
                                <dd part="dd">${summaryStats.falseCount}</dd>
                                <dt part="dt">Total</dt>
                                <dd part="dd">${summaryStats.totalCount}</dd>
                            `;
                            break;
                        case 'datetime':
                            summaryDisplay = `
                                <dt part="dt">Earliest</dt>
                                <dd part="dd">${summaryStats.earliest}</dd>
                                <dt part="dt">Latest</dt>
                                <dd part="dd">${summaryStats.latest}</dd>
                                <dt part="dt">Range</dt>
                                <dd part="dd">${summaryStats.range} days</dd>
                            `;
                            break;
                        default:
                            summaryDisplay = `<dt part="dt">-</dt><dd part="dd">-</dd>`;
                    }

                    return `
                        <th id="header-${sanitizedHeader}" part="th">
                            ${headerMapping[sanitizedHeader]}
                            <dl part="dl">
                                <dt part="dt">Type</dt>
                                <dd part="dd">
                                    <select part="select">
                                        <option value="number" ${columnType === 'number' ? 'selected' : ''}>Numeric</option>
                                        <option value="string" ${columnType === 'string' ? 'selected' : ''}>String</option>
                                        <option value="boolean" ${columnType === 'boolean' ? 'selected' : ''}>Boolean</option>
                                        <option value="datetime" ${columnType === 'datetime' ? 'selected' : ''}>Datetime</option>
                                    </select>
                                </dd>
                                ${summaryDisplay}
                            </dl>
                            <div id="chart-${sanitizedHeader}" style="width: 100%; height: 50px;"></div>
                        </th>
                    `;
                }).join('')}
            </tr>
        `;

        this.tbody.innerHTML = validRows.map((row: any) => `
            <tr part="tr">
                ${this.sanitizedHeaders.map(sanitizedHeader => `
                    <td part="td ${row[sanitizedHeader] === null || row[sanitizedHeader] === undefined ? 'missing' : 'valid'}">
                        ${row[sanitizedHeader] !== undefined ? row[sanitizedHeader] : ''}
                    </td>
                `).join('')}
            </tr>
        `).join('');

        requestAnimationFrame(() => {
            this.sanitizedHeaders.forEach(sanitizedHeader => {
                this.createMiniChart(sanitizedHeader);
            });
        });
    }
}

customElements.define('data-table', DataTableComponent);
export default DataTableComponent