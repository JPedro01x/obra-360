package br.com.obra360.infrastructure.realtime;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class WorkspaceChangeStreamTest {
    @Test
    void publishesOnlyToSubscribersFromTheSameCompanyAndStopsAfterClose() throws Exception {
        var stream = new WorkspaceChangeStream();
        var firstCompany = new ArrayList<WorkspaceChangeStream.Change>();
        var otherCompany = new ArrayList<WorkspaceChangeStream.Change>();
        var firstSubscription = stream.subscribe(10L, firstCompany::add);
        stream.subscribe(20L, otherCompany::add);

        stream.publish(10L, "projetos");

        assertEquals(1, firstCompany.size());
        assertEquals("projetos", firstCompany.get(0).module());
        assertEquals(0, otherCompany.size());

        firstSubscription.close();
        stream.publish(10L, "projetos");

        assertEquals(1, firstCompany.size());
    }

    @Test
    void appliesTenantConnectionLimitAndReleasesCapacityOnClose() throws Exception {
        var stream = new WorkspaceChangeStream();
        var subscriptions = new ArrayList<AutoCloseable>();
        for (int index = 0; index < WorkspaceChangeStream.MAX_SUBSCRIBERS_PER_TENANT; index++) {
            subscriptions.add(stream.subscribe(10L, ignored -> { }));
        }
        assertThrows(WorkspaceChangeStream.SubscriberLimitException.class, () -> stream.subscribe(10L, ignored -> { }));
        subscriptions.remove(0).close();
        subscriptions.add(stream.subscribe(10L, ignored -> { }));
        for (var subscription : subscriptions) subscription.close();
    }
}
