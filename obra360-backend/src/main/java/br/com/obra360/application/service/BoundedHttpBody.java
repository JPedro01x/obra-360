package br.com.obra360.application.service;

import java.io.IOException;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.Flow;

/** Buffers at most two million response bytes and completes only after the full body. */
final class BoundedHttpBody {
    private static final int MAX_BYTES = 2_000_000;

    private BoundedHttpBody() {}

    static HttpResponse.BodyHandler<String> handler() {
        return info -> new Subscriber();
    }

    private static final class Subscriber implements HttpResponse.BodySubscriber<String> {
        private final CompletableFuture<String> body = new CompletableFuture<>();
        private final byte[] bytes = new byte[MAX_BYTES];
        private Flow.Subscription subscription;
        private int size;

        public CompletionStage<String> getBody() { return body; }

        public void onSubscribe(Flow.Subscription incoming) {
            if (subscription != null || body.isDone()) { incoming.cancel(); return; }
            subscription = incoming;
            incoming.request(1);
        }

        public void onNext(List<ByteBuffer> buffers) {
            if (body.isDone()) return;
            // Check the whole delivery before copying any buffer or allocating a String.
            long remaining = MAX_BYTES - size;
            for (ByteBuffer buffer : buffers) {
                remaining -= buffer.remaining();
                if (remaining < 0) {
                    subscription.cancel();
                    body.completeExceptionally(new IOException("Response body exceeds byte limit."));
                    return;
                }
            }
            for (ByteBuffer buffer : buffers) {
                int length = buffer.remaining();
                buffer.get(bytes, size, length);
                size += length;
            }
            subscription.request(1);
        }

        public void onError(Throwable error) { body.completeExceptionally(error); }

        public void onComplete() {
            if (!body.isDone()) body.complete(new String(bytes, 0, size, StandardCharsets.UTF_8));
        }
    }
}
