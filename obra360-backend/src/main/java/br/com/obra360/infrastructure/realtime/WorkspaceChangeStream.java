package br.com.obra360.infrastructure.realtime;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Consumer;

/** Process-local fan-out of minimal, tenant-scoped workspace invalidation events. */
@Component
public class WorkspaceChangeStream {
    public static final int MAX_SUBSCRIBERS_PER_TENANT = 500;
    public static final int MAX_SUBSCRIBERS_TOTAL = 10_000;

    public record Change(String id, String module, OffsetDateTime occurredAt) {}

    private final AtomicLong sequence = new AtomicLong();
    private final AtomicLong subscriberSequence = new AtomicLong();
    private final ConcurrentHashMap<Long, ConcurrentHashMap<Long, Consumer<Change>>> subscribers = new ConcurrentHashMap<>();
    private int activeSubscriberCount;

    public synchronized AutoCloseable subscribe(long tenantId, Consumer<Change> listener) {
        if (tenantId <= 0) throw new IllegalArgumentException("Empresa inválida para o stream.");
        if (activeSubscriberCount >= MAX_SUBSCRIBERS_TOTAL) throw new SubscriberLimitException();
        var existing = subscribers.get(tenantId);
        if (existing != null && existing.size() >= MAX_SUBSCRIBERS_PER_TENANT) throw new SubscriberLimitException();
        long subscriberId = subscriberSequence.incrementAndGet();
        var tenantSubscribers = subscribers.computeIfAbsent(tenantId, ignored -> new ConcurrentHashMap<>());
        tenantSubscribers.put(subscriberId, listener);
        activeSubscriberCount++;
        return () -> {
            synchronized (WorkspaceChangeStream.this) {
                if (tenantSubscribers.remove(subscriberId) != null) activeSubscriberCount--;
                if (tenantSubscribers.isEmpty()) subscribers.remove(tenantId, tenantSubscribers);
            }
        };
    }

    public static class SubscriberLimitException extends RuntimeException {
        public SubscriberLimitException() { super("Limite de conexões de atualização atingido."); }
    }

    public void publish(long tenantId, String module) {
        var tenantSubscribers = subscribers.get(tenantId);
        if (tenantSubscribers == null || tenantSubscribers.isEmpty()) return;
        var change = new Change(Long.toString(sequence.incrementAndGet()), module, OffsetDateTime.now());
        tenantSubscribers.forEach((id, listener) -> {
            try {
                listener.accept(change);
            } catch (RuntimeException disconnected) {
                removeSubscriber(tenantId, tenantSubscribers, id);
            }
        });
    }

    @Scheduled(fixedRate = 20_000L)
    void keepConnectionsAlive() {
        if (subscribers.isEmpty()) return;
        var heartbeat = new Change("", "heartbeat", OffsetDateTime.now());
        subscribers.forEach((tenantId, tenantSubscribers) -> tenantSubscribers.forEach((id, listener) -> {
            try {
                listener.accept(heartbeat);
            } catch (RuntimeException disconnected) {
                removeSubscriber(tenantId, tenantSubscribers, id);
            }
        }));
    }

    private synchronized void removeSubscriber(long tenantId, ConcurrentHashMap<Long, Consumer<Change>> tenantSubscribers, long subscriberId) {
        if (tenantSubscribers.remove(subscriberId) != null) activeSubscriberCount--;
        if (tenantSubscribers.isEmpty()) subscribers.remove(tenantId, tenantSubscribers);
    }
}
