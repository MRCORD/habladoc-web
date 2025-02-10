// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';

type ConnectionStatus = 'Connecting' | 'Open' | 'Closing' | 'Closed';

interface WebSocketMessage {
  data: string;
  type: string;
  target: WebSocket;
}

export function useWebSocket(url: string) {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('Connecting');
  const webSocketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    try {
      if (!url) {
        console.error('WebSocket URL not provided');
        return;
      }

      // Close existing connection if any
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }

      console.log('Connecting to WebSocket:', url);
      const ws = new WebSocket(url);
      webSocketRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connection opened');
        setConnectionStatus('Open');
      };

      ws.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        setLastMessage(event as unknown as WebSocketMessage);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setConnectionStatus('Closed');
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          console.log('Attempting to reconnect...');
          setConnectionStatus('Connecting');
          connect();
        }, 3000);
      };

    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      setConnectionStatus('Closed');
    }
  }, [url]);

  useEffect(() => {
    connect();

    return () => {
      console.log('Cleaning up WebSocket connection');
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: string | object) => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      webSocketRef.current.send(messageString);
    } else {
      console.warn('WebSocket is not connected, message not sent:', message);
    }
  }, []);

  return {
    lastMessage,
    connectionStatus,
    sendMessage,
  };
}