import { Upload } from '../../../src/upload';
import { DataTable } from '../../../src/datatable';
import { Messaging } from '../../../src/messaging/component';
import { Artifact } from '../../../src/artifact';
import { Logging } from '../../../src/logging';

describe('Integration Test', () => {
  let uploadInstance;
  let dataTableInstance;
  let messagingInstance;
  let artifactInstance;
  let loggingInstance;

  beforeEach(() => {
    artifactInstance = Artifact();
    loggingInstance = Logging(artifactInstance);
    messagingInstance = Messaging(loggingInstance, artifactInstance);

    const UploadElement = Upload(loggingInstance, messagingInstance, artifactInstance);
    const DataTableElement = DataTable(loggingInstance, messagingInstance, artifactInstance);

    uploadInstance = new UploadElement();
    dataTableInstance = new DataTableElement();

    document.body.appendChild(uploadInstance);
    document.body.appendChild(dataTableInstance);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('Upload sends data and DataTable receives it', (done) => {
    const mockFile = new File(['col1,col2\nvalue1,value2'], 'test.csv', { type: 'text/csv' });

    // Mock the file input change event
    const changeEvent = new Event('change');
    Object.defineProperty(changeEvent, 'target', { value: { files: [mockFile] } });

    // Listen for changes in the DataTable
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && dataTableInstance.tableBody.children.length > 0) {
          expect(dataTableInstance.tableBody.innerHTML).toContain('<td>value1</td>');
          expect(dataTableInstance.tableBody.innerHTML).toContain('<td>value2</td>');
          observer.disconnect();
          done();
        }
      });
    });

    observer.observe(dataTableInstance.tableBody, { childList: true, subtree: true });

    // Trigger the file upload
    uploadInstance.handleFileChange(changeEvent);
  });
});
