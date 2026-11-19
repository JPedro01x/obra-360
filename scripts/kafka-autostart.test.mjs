import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldStartLocalKafka } from './kafka-autostart.mjs';

test('launcher owns only the default local Kafka endpoint when messaging is enabled', () => {
  assert.equal(shouldStartLocalKafka({}), false);
  assert.equal(shouldStartLocalKafka({ MESSAGING_ENABLED: 'false' }), false);
  assert.equal(shouldStartLocalKafka({ MESSAGING_ENABLED: 'true' }), true);
  assert.equal(shouldStartLocalKafka({ MESSAGING_ENABLED: 'true', KAFKA_BOOTSTRAP_SERVERS: '127.0.0.1:9092' }), true);
  for (const address of ['broker.example.invalid:9092', '127.0.0.1:19092', 'localhost:9092,broker:9092']) {
    assert.equal(shouldStartLocalKafka({ MESSAGING_ENABLED: 'true', KAFKA_BOOTSTRAP_SERVERS: address }), false, address);
  }
});
