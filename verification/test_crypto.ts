import { generateSecureSerial } from '../src/utils/crypto';

function testGenerateSecureSerial() {
  console.log('Testing generateSecureSerial...');
  const count = 1000;
  const serials = new Set<string>();
  const pattern = /^[A-Z0-9]{8}$/;

  for (let i = 0; i < count; i++) {
    const serial = generateSecureSerial();

    // Check format
    if (!pattern.test(serial)) {
      console.error(`Invalid format: ${serial}`);
      process.exit(1);
    }

    // Check uniqueness
    if (serials.has(serial)) {
      console.warn(`Collision detected: ${serial}`);
    }
    serials.add(serial);
  }

  console.log(`Generated ${count} serials.`);
  console.log(`Unique serials: ${serials.size}`);

  if (serials.size !== count) {
      console.warn("Warning: Some collisions occurred.");
  } else {
      console.log("No collisions detected.");
  }

  console.log("Sample serials:", Array.from(serials).slice(0, 5));
  console.log("Test passed!");
}

testGenerateSecureSerial();
