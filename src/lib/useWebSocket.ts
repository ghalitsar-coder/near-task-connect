import { useEffect, useRef, useCallback } from "react";
import { serviceBase } from "@/lib/api/config";

export interface NewOrderAvailableEvent {
  type: "new_order_available";
  order_id: string;
  skill_id: number;
  latitude: number;
  longitude: number;
  worker_user_ids: string[];
  platform_fee: number;
  consumer_address?: string;
}

export interface OrderStatusChangedEvent {
  type: "order_status_changed";
  order_id: string;
  new_status: string;
  actor_user_id?: string;
  consumer_id: string;
  worker_id?: string;
}

type WsEvent = NewOrderAvailableEvent | OrderStatusChangedEvent;

export interface UseWebSocketOptions {
  accessToken: string | null;
  enabled?: boolean;
  onNewOrderAvailable?: (evt: NewOrderAvailableEvent) => void;
  onOrderStatusChanged?: (evt: OrderStatusChangedEvent) => void;
}

function wsBase(): string {
  const base = serviceBase();
  return base.replace(/^http/, "ws") + "/ws";
}

export function useWebSocket({
  accessToken,
  enabled = true,
  onNewOrderAvailable,
  onOrderStatusChanged,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!accessToken || !enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = wsBase();
    const ws = new WebSocket(url);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", token: accessToken }));
    };

    ws.onmessage = (event) => {
      try {
        const evt = JSON.parse(event.data) as WsEvent;
        if (evt.type === "new_order_available" && onNewOrderAvailable) {
          onNewOrderAvailable(evt as NewOrderAvailableEvent);
        }
        if (evt.type === "order_status_changed" && onOrderStatusChanged) {
          onOrderStatusChanged(evt as OrderStatusChangedEvent);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (mountedRef.current && enabled) {
        reconnectTimer.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [accessToken, enabled, onNewOrderAvailable, onOrderStatusChanged]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);
}
