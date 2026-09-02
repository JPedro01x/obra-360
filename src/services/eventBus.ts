/**
 * EVENT-DRIVEN MESSAGING BUS (PubSub Pattern for Decoupled Micro-Interactions)
 * 
 * Permite a publicação de eventos de negócio em tópicos e a subscrição de ouvintes
 * assíncronos para desacoplamento de responsabilidades no ecossistema Obra360.
 */

import { logger } from './logger';

export type EventTopic = 
  | 'DOCUMENT_APPROVED'
  | 'DOCUMENT_UPLOADED'
  | 'OCCURRENCE_CREATED'
  | 'STAGE_PROGRESS_UPDATED'
  | 'STOCK_MIN_REACHED'
  | 'B2B_RFQ_OFFER_ACCEPTED'
  | 'UNIT_RESERVED'
  | 'COMPANY_REGISTERED';

export interface EventPayload<T = any> {
  topic: EventTopic;
  timestamp: string;
  sender: string;
  data: T;
}

export type EventHandler<T = any> = (event: EventPayload<T>) => void | Promise<void>;

class EventBusService {
  private subscribers: Map<EventTopic, Set<EventHandler>> = new Map();

  /**
   * Subscribes a listener function to a specific topic
   */
  public subscribe<T = any>(topic: EventTopic, handler: EventHandler<T>): () => void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }

    const handlers = this.subscribers.get(topic)!;
    handlers.add(handler);

    // Return unsubscribe callback function
    return () => {
      handlers.delete(handler);
    };
  }

  /**
   * Publishes an event to a topic, notifying all registered subscribers asynchronously
   */
  public publish<T = any>(topic: EventTopic, sender: string, data: T): void {
    const event: EventPayload<T> = {
      topic,
      timestamp: new Date().toISOString(),
      sender,
      data
    };

    logger.info(`[EventBus Message Published]: Topic "${topic}" by ${sender}`, { topic, sender });

    const handlers = this.subscribers.get(topic);
    if (handlers && handlers.size > 0) {
      handlers.forEach(async (handler) => {
        try {
          await handler(event);
        } catch (err) {
          logger.error(`[EventBus Handler Error]: Topic "${topic}"`, err);
        }
      });
    }
  }
}

export const eventBus = new EventBusService();
