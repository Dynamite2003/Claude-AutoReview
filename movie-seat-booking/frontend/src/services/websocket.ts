const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export class WebSocketService {
  private socket: WebSocket | null = null;
  private showtimeId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private listeners: { [key: string]: ((data: any) => void)[] } = {};

  connect(showtimeId: string) {
    if (this.socket && this.showtimeId === showtimeId) {
      return;
    }

    this.disconnect();
    this.showtimeId = showtimeId;

    try {
      this.socket = new WebSocket(`${WS_BASE_URL}/ws/showtime/${showtimeId}`);
      
      this.socket.onopen = () => {
        console.log('WebSocket连接已建立');
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type, data);
        } catch (error) {
          console.error('解析WebSocket消息失败:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket连接已关闭');
        this.emit('disconnected');
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket错误:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('创建WebSocket连接失败:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.showtimeId = null;
    this.reconnectAttempts = 0;
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.showtimeId) {
      this.reconnectAttempts++;
      console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.showtimeId) {
          this.connect(this.showtimeId);
        }
      }, this.reconnectInterval * this.reconnectAttempts);
    }
  }

  sendMessage(type: string, data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, ...data }));
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }

  selectSeat(seatId: number, userId?: number) {
    this.sendMessage('seat_select', { seat_id: seatId, user_id: userId });
  }

  releaseSeat(seatId: number, userId?: number) {
    this.sendMessage('seat_release', { seat_id: seatId, user_id: userId });
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: (data: any) => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

export const wsService = new WebSocketService();