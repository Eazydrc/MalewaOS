const IORedis = require('ioredis');
const redis = new IORedis({ host: '127.0.0.1', port: 6379 });
async function run() {
  const keys = await redis.keys('otp:*');
  console.log('OTP keys:', keys);
  for (const k of keys) {
    const v = await redis.get(k);
    console.log(k, '->', v);
  }
  redis.disconnect();
}
run().catch(console.error);
