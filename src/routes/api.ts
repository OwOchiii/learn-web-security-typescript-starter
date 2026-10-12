import { Router } from "express";
import type { Dependencies } from "../dependencies.ts";
import { getCurrentSession } from "../auth/sessions.ts";
import {
  findOrderById,
  listAllOrders,
  listOrderItems,
  listOrdersForUser,
  type Order,
  type OrderItem,
} from "../orders/index.ts";
import { findApiKey } from "../auth/apiKeys.ts";
import {listProducts, type Product} from "../products.ts";

type ProductResponse = {
  id: number;
  name: string;
  description: string;
  image_path: string;
  price_cents: number;
};

type OrderResponse = {
  id: number;
  status: Order["status"];
  total_cents: number;
  created_at: string;
};

type OrderItemResponse = {
  product_id: number;
  product_name: string;
  quantity: number;
  price_cents: number;
};

function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    image_path: product.image_path,
    price_cents: product.price_cents,
  };
}

function toOrderResponse(order: Order): OrderResponse {
  return {
    id: order.id,
    status: order.status,
    total_cents: order.total_cents,
    created_at: order.created_at,
  };
}

function toOrderItemResponse(item: OrderItem): OrderItemResponse {
  return {
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    price_cents: item.price_cents,
  };
}

export function createApiRouter(deps: Dependencies): Router {
  const { db } = deps;
  const router = Router();

  router.get("/api/account/orders", (req, res) => {
    const current = getCurrentSession(db, req.header("cookie"));
    if (!current) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    res.json({ orders: listOrdersForUser(db, current.user.id).map(toOrderResponse) });
  });

  router.get("/api/orders/:id", (req, res) => {
    const current = getCurrentSession(db, req.header("cookie"));
    if (!current) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const orderId = Number(req.params.id);
    if (!Number.isSafeInteger(orderId)) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const order = findOrderById(db, orderId);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (order.user_id !== current.user.id) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json({ order: toOrderResponse(order), items: listOrderItems(db, order.id).map(toOrderItemResponse) });
  });

  router.get("/api/products", (_req, res) => {
    res.json({ products: listProducts(db).map(toProductResponse) });
  });

  router.get("/api/integrations/warehouse/orders", (_req, res) => {
    const api_key = _req.header("x-api-key");
    if (!api_key) {
      res.status(401).json({ error: "API key required" });
      return;
    }

    const api = findApiKey(db, api_key);
    if (!api) {
      res.status(401).json({ error: "Invalid API key" });
      return;
    }

    if (api.scope !== "orders:read") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    res.json({
      integration: "Warehouse Fulfillment Integration",
      orders: listAllOrders(db).map(toOrderResponse),
    });
  });

  return router;
}
