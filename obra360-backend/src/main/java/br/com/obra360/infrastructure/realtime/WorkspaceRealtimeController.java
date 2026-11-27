package br.com.obra360.infrastructure.realtime;

import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicReference;

@RestController
@RequestMapping("/api/v1/workspace/eventos")
public class WorkspaceRealtimeController {
    private final WorkspaceChangeStream changes;

    public WorkspaceRealtimeController(WorkspaceChangeStream changes) {
        this.changes = changes;
    }

    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(HttpServletResponse response) {
        Long tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED);

        response.setHeader("Cache-Control", "no-cache, no-store, no-transform");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Connection", "keep-alive");
        var emitter = new SseEmitter(0L);
        var subscription = new AtomicReference<AutoCloseable>();
        Runnable close = () -> {
            var current = subscription.getAndSet(null);
            if (current != null) {
                try { current.close(); } catch (Exception ignored) { }
            }
        };
        try {
            subscription.set(changes.subscribe(tenantId, change -> {
            try {
                if ("heartbeat".equals(change.module())) {
                    emitter.send(SseEmitter.event().comment("keep-alive"));
                } else {
                    emitter.send(SseEmitter.event().id(change.id()).name("workspace-change").data(change));
                }
            } catch (IOException | IllegalStateException disconnected) {
                close.run();
                emitter.completeWithError(disconnected);
            }
            }));
        } catch (WorkspaceChangeStream.SubscriberLimitException atCapacity) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, atCapacity.getMessage());
        }
        emitter.onCompletion(close);
        emitter.onTimeout(close);
        emitter.onError(ignored -> close.run());
        try {
            emitter.send(SseEmitter.event().comment("connected"));
        } catch (IOException disconnected) {
            close.run();
            emitter.completeWithError(disconnected);
        }
        return emitter;
    }
}
