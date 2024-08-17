import { DataTable } from '../../../src/datatable';

// Mock dependencies
const mockLogging = {
  debug: jest.fn(),
  error: jest.fn(),
};

const mockMessaging = {
  subscribe: jest.fn(),
};

const mockArtifact = {
  validate: jest.fn(),
};

describe('DataTable', () => {
  let DataTableElement;
  let dataTableInstance;

  beforeEach(() => {
    DataTableElement = DataTable(mockLogging, mockMessaging, mockArtifact);
    dataTableInstance = new DataTableElement();
  });

  test('initializes correctly', () => {
    expect(dataTableInstance.shadowRoot).toBeDefined();
    expect(mockLogging.debug).toHaveBeenCalledWith('DataTable initialized', 'DataTable');
  });

  test('sets up messaging', () => {
    dataTableInstance.setupMessaging();
    expect(mockMessaging.subscribe).toHaveBeenCalledWith('data', expect.any(MessagePort));
  });

  test('handles valid message', () => {
    const mockMsg = {
      topic: 'uploadComplete',
      payload: {
        headers: ['col1', 'col2'],
        data: [{ col1: 'value1', col2: 'value2' }],
      },
    };

    dataTableInstance.setTableData = jest.fn();
    dataTableInstance.handleMessage(mockMsg);

    expect(mockArtifact.validate).toHaveBeenCalledWith(mockMsg);
    expect(dataTableInstance.setTableData).toHaveBeenCalledWith(
      mockMsg.payload.headers,
      mockMsg.payload.data
    );
  });

  test('renders table', () => {
    dataTableInstance.headers = ['col1', 'col2'];
    dataTableInstance.data = [{ col1: 'value1', col2: 'value2' }];

    dataTableInstance.renderTable();

    expect(dataTableInstance.thead.innerHTML).toContain('<th>col1</th>');
    expect(dataTableInstance.thead.innerHTML).toContain('<th>col2</th>');
    expect(dataTableInstance.tableBody.innerHTML).toContain('<td>value1</td>');
    expect(dataTableInstance.tableBody.innerHTML).toContain('<td>value2</td>');
  });
});
