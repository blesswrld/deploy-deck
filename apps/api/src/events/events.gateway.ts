import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service'; // Нам понадобится AuthService для валидации токена

@WebSocketGateway({
  cors: {
    origin: '*', // В продакшене указать URL фронтенда
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Хранилище для связи userId с его сокетом
  private userSockets = new Map<string, string>();

  constructor(private authService: AuthService) {}

  // Метод, который вызывается, когда клиент подключается
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) throw new Error('No token provided');

      // Используем логику из AuthService для верификации
      const user = await this.authService.verifyJwt(token); // <-- Создадим этот метод ниже
      if (!user) throw new Error('Invalid token');

      this.userSockets.set(user.id, client.id);
      console.log(
        `[WebSocket] Client connected: ${client.id}, User ID: ${user.id}`,
      );
    } catch (error) {
      console.error(`[WebSocket] Authentication error: ${error.message}`);
      client.disconnect();
    }
  }

  // Метод, который вызывается, когда клиент отключается
  handleDisconnect(client: Socket) {
    // Находим и удаляем пользователя из нашего хранилища
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
    console.log(`[WebSocket] Client disconnected: ${client.id}`);
  }

  // Метод для отправки сообщения конкретному пользователю
  sendToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      console.log(`[WebSocket] Emitting '${event}' to User ID: ${userId}`);
    }
  }
}
