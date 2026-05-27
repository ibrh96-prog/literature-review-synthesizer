import nacl from "tweetnacl";
import * as readline from "readline";

function hexToBytes(hex) {
  const b = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) b[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return b;
}

function bytesToHex(b) {
  return Array.from(b).map(x => x.toString(16).padStart(2, "0")).join("");
}

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  console.log("\n🪙  Literature Review Synthesizer — License Key Minter\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const privateKeyHex = (await ask(rl, "Private Key (hex): ")).trim();
  const email = (await ask(rl, "Customer Email: ")).trim();
  const purchaseId = (await ask(rl, "Purchase ID: ")).trim();
  const purchaseDate = (await ask(rl, "Purchase Date (YYYY-MM-DD): ")).trim();

  rl.close();

  if (privateKeyHex.length !== 64) {
    console.error("❌ Private key must be 64 hex characters.");
    process.exit(1);
  }

  const payload = {
    email: email.toLowerCase(),
    purchaseId,
    purchaseDate,
    tier: "pro",
    productId: "literature-review-synthesizer",
  };

  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const privateKeyBytes = hexToBytes(privateKeyHex);

  // Generate full keypair from 32-byte seed
  const keyPair = nacl.sign.keyPair.fromSeed(privateKeyBytes);

  // Use detached signature — produces just 64 bytes
  const signatureBytes = nacl.sign.detached(payloadBytes, keyPair.secretKey);
  const signatureHex = bytesToHex(signatureBytes);

  const licenseData = { payload, signature: signatureHex };
  const licenseKey = Buffer.from(JSON.stringify(licenseData)).toString("base64");

  console.log("\n✅ License key generated!\n");
  console.log("─".repeat(60));
  console.log("Email:", payload.email);
  console.log("\nLicense Key:");
  console.log(licenseKey);
  console.log("─".repeat(60));
  console.log("\n📧 Email Template:\n");
  console.log(`Subject: Your Literature Review Synthesizer Pro License

Hi,

Thank you for your purchase!

Email: ${payload.email}
License Key:
${licenseKey}

TO ACTIVATE:
1. Open Obsidian → Settings
2. Click "Literature Review Synthesizer"
3. Scroll to "License" section
4. Enter your email and paste the license key
5. Click "Activate Pro License"

Best regards`);
}

main().catch(e => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});