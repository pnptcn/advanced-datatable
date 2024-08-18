import Logger from "./logging";
import Messaging from "./components/messaging/component";
import { registry } from "./components/registry";

export const App = (): void => {
    const logger = Logger();
    logger.debug("App loaded", "App");

    // Register shared services
    const messaging = Messaging();
    registry.register("messaging", messaging);
};

App();

export default App;
