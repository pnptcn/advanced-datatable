import Logger from "./logging";
import Messaging from "./components/messaging/component";
import TableComponent from "./components/datatable";
import UploadComponent from "./components/upload";
import GraphComponent from "./components/nodegraph/graph";
import NodeComponent from "./components/nodegraph/node";
import EdgeComponent from "./components/nodegraph/edge";
import { registry } from "./components/registry";

export const App = (): void => {
    const logger = Logger();
    logger.debug("App loaded", "App");

    // Register shared services
    const messaging = Messaging();
    registry.register("messaging", messaging);

    // Register components
    registry.register("Table", TableComponent);
    registry.register("Upload", UploadComponent);
    registry.register("GraphComponent", new GraphComponent());
    registry.register("NodeComponent", new NodeComponent());
    registry.register("EdgeComponent", new EdgeComponent());

    // Initialize all components in the correct order
    registry.init();
};

App();

export default App;
