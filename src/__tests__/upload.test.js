import { Upload } from '../../../src/upload';

// Mock dependencies
const mockLogging = {
  debug: jest.fn(),
  error: jest.fn(),
};

const mockMessaging = {
  subscribe: jest.fn(),
};

const mockArtifact = {
  get: jest.fn(),
  validate: jest.fn(),
};

describe('Upload', () => {
  let UploadWidget;
  let uploadInstance;

  beforeEach(() => {
    UploadWidget = Upload(mockLogging, mockMessaging, mockArtifact);
    uploadInstance = new UploadWidget();
    document.body.appendChild(uploadInstance);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('initializes correctly', () => {
    expect(uploadInstance.shadowRoot).toBeDefined();
    expect(mockLogging.debug).toHaveBeenCalledWith('Upload widget loaded', 'Upload');
  });

  test('handles file change', () => {
    const mockFile = new File(['test,csv,data'], 'test.csv', { type: 'text/csv' });
    const mockEvent = { target: { files: [mockFile] } };

    uploadInstance.parseFile = jest.fn();
    uploadInstance.handleFileChange(mockEvent);

    expect(uploadInstance.parseFile).toHaveBeenCalledWith(mockFile);
  });

  test('sends parsed data', () => {
    const headers = ['col1', 'col2'];
    const data = [['value1', 'value2']];

    uploadInstance.messagingChannel = { port1: { postMessage: jest.fn() } };
    mockArtifact.get.mockReturnValue({ topic: 'uploadComplete', payload: { headers, data } });

    uploadInstance.sendParsedData(headers, data);

    expect(mockArtifact.get).toHaveBeenCalled();
    expect(mockArtifact.validate).toHaveBeenCalled();
    expect(uploadInstance.messagingChannel.port1.postMessage).toHaveBeenCalled();
  });
});