import Logger from "./logging";
import Messaging from "./components/messaging/component";
import Table from "./components/datatable";
import Upload from "./components/upload";

export const App = (): void => {
    const logger = Logger();
    logger.debug("App loaded", "App");

    const messaging = Messaging();
    const datatable = Table();
    const upload = Upload();
};

App();

export default App;
