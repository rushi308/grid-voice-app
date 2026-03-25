import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

export class WebSocketConnectionGateway {
  private readonly client: ApiGatewayManagementApiClient;

  constructor(endpoint: string) {
    this.client = new ApiGatewayManagementApiClient({
      endpoint,
    });
  }

  async sendJson(connectionId: string, payload: unknown): Promise<void> {
    await this.client.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: new TextEncoder().encode(JSON.stringify(payload)),
      }),
    );
  }
}
