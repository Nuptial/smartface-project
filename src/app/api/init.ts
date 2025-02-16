import { initWebSocketServer } from './websocket';
import { initTelemetry } from '../../config/telemetry';

// Initialize WebSocket server
initWebSocketServer();

// Initialize OpenTelemetry
initTelemetry();

export { }; 