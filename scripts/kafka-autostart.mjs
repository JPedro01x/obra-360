// The launcher owns only the documented single local broker, never configured remote clusters.
export function shouldStartLocalKafka(env) {
  const endpoint = env.KAFKA_BOOTSTRAP_SERVERS?.trim() || '127.0.0.1:9092';
  return env.MESSAGING_ENABLED === 'true' && endpoint === '127.0.0.1:9092';
}
