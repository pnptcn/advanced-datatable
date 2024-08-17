/// <reference lib="dom" />

import * as echarts from 'echarts';
import { table, Table as ArqueroTable } from 'arquero';
import { Logger, type Logging } from './logging';
import { Messaging } from './messaging/component';

if (!echarts) {
    console.error('Failed to load ECharts. Check the import path or the CDN.');
} else {
    console.log('ECharts loaded successfully:', echarts);
}

const sanitizeHeader = (header: string): string => {
    return header.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
};

export const Table = () => {
    const logger = Logger();
    const messaging = Messaging();
    
    class DataTable extends HTMLElement {
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

            logger.debug('DataTable initialized', 'DataTable');
        }

        connectedCallback() {
            // Ensure setup occurs only when component is connected
            this.setupMessaging();
        }

        setupMessaging() {
            messaging.subscribe("data", this.messagingChannel.port2);
            this.port.onmessage = (event) => {
                this.handleMessage(event.data);
            };
            logger.debug('DataTable subscribed to "data" channel', 'DataTable');
        }

        handleMessage(msg: any) {
            try {
                if (msg.topic === 'uploadComplete') {
                    logger.debug(`Data received: ${msg.payload.data.length} rows`, 'DataTable');
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
                    logger.debug(`Unexpected message topic: ${msg.topic}`, 'DataTable');
                }
            } catch (error: any) {
                logger.error(`Invalid message received: ${error.message}`, 'DataTable');
            }
        }

        createMiniChart(sanitizedHeader: string) {
            if (!this.arqueroTable) return;

            // Filter numeric data for the chart
            const chartData = this.arqueroTable.array(sanitizedHeader).filter(value => typeof value === 'number');

            if (chartData.length === 0) {
                logger.warn(`No numeric data found for header "${sanitizedHeader}". Skipping chart rendering.`, 'DataTable');
                return; // Skip if no numeric data
            }

            // Ensure the chart DOM is fully ready
            const chartDom = this.shadowRoot!.getElementById(`chart-${sanitizedHeader}`);
            logger.debug(`Looking for chart DOM element with id "chart-${sanitizedHeader}"`, 'DataTable');

            if (!chartDom) {
                logger.error(`Chart DOM for header "${sanitizedHeader}" not found. Ensure the element with id "chart-${sanitizedHeader}" exists in the DOM.`, 'DataTable');
                return;
            }

            // Log details about the chart container
            const rect = chartDom.getBoundingClientRect();
            logger.debug(`Chart container dimensions for "${sanitizedHeader}": width=${rect.width}, height=${rect.height}`, 'DataTable');

            if (rect.width === 0 || rect.height === 0) {
                logger.error(`Chart container for "${sanitizedHeader}" has invalid dimensions. Cannot initialize chart.`, 'DataTable');
                return;
            }

            try {
                logger.debug(`Initializing ECharts for header "${sanitizedHeader}"`, 'DataTable');
                const myChart = echarts.init(chartDom);

                const option = {
                    dataset: {
                        source: [
                            ['value'],
                            ...chartData.map((value: number) => [value])
                        ]
                    },
                    xAxis: {
                        type: 'category',
                        show: false
                    },
                    yAxis: {
                        type: 'value',
                        show: false
                    },
                    series: [{
                        type: 'line',
                        showSymbol: false
                    }],
                    grid: {
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0
                    }
                };

                myChart.setOption(option);
                logger.debug(`Chart rendered for header "${sanitizedHeader}"`, 'DataTable');
            } catch (error: any) {
                logger.error(`Failed to initialize chart for header "${sanitizedHeader}": ${error.message}`, 'DataTable');
            }
        }

        setTableData(headerMapping: Record<string, string>) {
            if (!this.arqueroTable) return;

            logger.debug(`Rendering table with ${this.arqueroTable.numRows()} rows`, 'DataTable');

            // Filter out rows that are entirely null
            const validRows = this.arqueroTable.objects().filter(row =>
                Object.values(row).some(value => value !== null && value !== undefined)
            );

            // Render headers with sanitized IDs but display original headers
            this.thead.innerHTML = `
                <tr part="tr">
                    ${this.sanitizedHeaders.map(sanitizedHeader => `
                        <th part="th">
                            ${headerMapping[sanitizedHeader]}
                            <div id="chart-${sanitizedHeader}" style="width: 100px; height: 30px;"></div>
                        </th>
                    `).join('')}
                </tr>
            `;

            // Render body using filtered valid rows
            this.tbody.innerHTML = validRows.map((row: any) => `
                <tr part="tr">
                    ${this.sanitizedHeaders.map(sanitizedHeader => `<td part="td">${row[sanitizedHeader] !== undefined ? row[sanitizedHeader] : ''}</td>`).join('')}
                </tr>
            `).join('');

            // Use requestAnimationFrame to delay chart rendering until DOM is fully ready
            requestAnimationFrame(() => {
                this.sanitizedHeaders.forEach(sanitizedHeader => {
                    logger.debug(`Preparing to render chart for header "${sanitizedHeader}"`, 'DataTable');
                    this.createMiniChart(sanitizedHeader);
                });
            });

            logger.debug(`Table rendered with ${validRows.length} valid rows`, 'DataTable');
        }
    }

    customElements.define('data-table', DataTable);
};

export default Table;