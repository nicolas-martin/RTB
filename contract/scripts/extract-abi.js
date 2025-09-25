#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const CONTRACT_NAME = 'RideTheBus';
const INPUT_PATH = path.join(__dirname, '..', 'out', `${CONTRACT_NAME}.sol`, `${CONTRACT_NAME}.json`);
const OUTPUT_PATH = path.join(__dirname, '..', '..', 'src', 'contracts', `${CONTRACT_NAME}ABI.js`);

try {
  // Read the compiled contract
  const contractData = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));

  // Extract the ABI
  const abi = contractData.abi;

  // Create output directory if it doesn't exist
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the JavaScript module
  const jsContent = `const ABI = ${JSON.stringify(abi, null, 2)};

export default ABI;
`;

  fs.writeFileSync(OUTPUT_PATH, jsContent);

  console.log(`✅ Successfully extracted ABI to ${OUTPUT_PATH}`);
  console.log(`   Found ${abi.length} ABI entries`);

} catch (error) {
  console.error('❌ Error extracting ABI:', error.message);
  process.exit(1);
}