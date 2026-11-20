package br.com.obra360.application.service;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CompletionException;
import java.util.concurrent.Flow;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class BoundedHttpBodyTest {
    private static final int LIMIT = 2_000_000;
    private static class Subscription implements Flow.Subscription {
        long requested;
        boolean cancelled;
        public void request(long n) { requested += n; }
        public void cancel() { cancelled = true; }
    }
    @Test void oversizedFirstChunkIsCancelledBeforeCopy() {
        var subscriber = BoundedHttpBody.handler().apply(null);
        var subscription = new Subscription();
        subscriber.onSubscribe(subscription);
        var oversized = ByteBuffer.wrap(new byte[LIMIT + 1]);
        subscriber.onNext(List.of(oversized));
        assertTrue(subscription.cancelled);
        assertEquals(0, oversized.position());
        assertThrows(CompletionException.class, () -> subscriber.getBody().toCompletableFuture().join());
        long requested = subscription.requested;
        subscriber.onNext(List.of(ByteBuffer.wrap(new byte[1])));
        subscriber.onComplete();
        assertEquals(requested, subscription.requested);
        assertTrue(subscriber.getBody().toCompletableFuture().isCompletedExceptionally());
    }
    @Test void chunkCrossingLimitIsCancelledWithoutCopyingAnyOfThatDelivery() {
        var subscriber = BoundedHttpBody.handler().apply(null);
        var subscription = new Subscription();
        subscriber.onSubscribe(subscription);
        subscriber.onNext(List.of(ByteBuffer.wrap(new byte[LIMIT - 2])));
        long requested = subscription.requested;
        var first = ByteBuffer.wrap(new byte[2]);
        var second = ByteBuffer.wrap(new byte[1]);
        subscriber.onNext(List.of(first, second));
        assertTrue(subscription.cancelled);
        assertEquals(0, first.position());
        assertEquals(0, second.position());
        assertEquals(requested, subscription.requested);
        assertThrows(CompletionException.class, () -> subscriber.getBody().toCompletableFuture().join());
    }
    @Test void exactByteBoundaryDecodesMultibyteUtf8AcrossChunks() {
        var subscriber = BoundedHttpBody.handler().apply(null);
        var subscription = new Subscription();
        subscriber.onSubscribe(subscription);
        String expected = "a".repeat(LIMIT - 4) + "çé";
        byte[] bytes = expected.getBytes(StandardCharsets.UTF_8);
        subscriber.onNext(List.of(ByteBuffer.wrap(bytes, 0, LIMIT - 3)));
        subscriber.onNext(List.of(ByteBuffer.wrap(bytes, LIMIT - 3, 3)));
        subscriber.onComplete();
        assertEquals(expected, subscriber.getBody().toCompletableFuture().join());
        assertFalse(subscription.cancelled);
    }
}
