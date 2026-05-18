import { create } from "zustand";
import { mockOrders, type Order, type OrderStatus, ORDER_STATUS_LABEL } from "@/data/mockOrders";

interface OrderState {
  orders: Order[];
  activeOrderId: string | null;
  setActiveOrder: (id: string) => void;
  advanceStatus: (id: string, status: OrderStatus) => void;
  createOrder: (input: Partial<Order> & { serviceId: string; workerId: string; addressLabel: string; lat: number; lng: number; notes: string; estimatedPrice: number }) => string;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: mockOrders,
  activeOrderId: "ord-LIVE",
  setActiveOrder: (id) => set({ activeOrderId: id }),
  advanceStatus: (id, status) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === id
          ? {
              ...o,
              status,
              timeline: [
                ...o.timeline,
                { status, label: ORDER_STATUS_LABEL[status], at: new Date().toISOString() },
              ],
            }
          : o
      ),
    })),
  createOrder: (input) => {
    const id = `ord-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const order: Order = {
      id,
      serviceId: input.serviceId,
      workerId: input.workerId,
      status: "broadcasting",
      createdAt: now,
      addressLabel: input.addressLabel,
      lat: input.lat,
      lng: input.lng,
      notes: input.notes,
      adminFee: 2000,
      estimatedPrice: input.estimatedPrice,
      paymentStatus: "authorized",
      timeline: [
        { status: "searching", label: "Order dibuat", at: now },
        { status: "broadcasting", label: "Tawaran dikirim ke pekerja terdekat", at: now },
      ],
    };
    set({ orders: [order, ...get().orders], activeOrderId: id });
    return id;
  },
}));
