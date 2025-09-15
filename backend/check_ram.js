import os from 'os';

const totalMemoryGB = (os.totalmem() / (1024 ** 3)).toFixed(2);
const freeMemoryGB = (os.freemem() / (1024 ** 3)).toFixed(2);
const usedMemoryGB = (totalMemoryGB - freeMemoryGB).toFixed(2);

console.log(`Total Memory: ${totalMemoryGB} GB`);
console.log(`Free Memory: ${freeMemoryGB} GB`);
console.log(`Used Memory: ${usedMemoryGB} GB`);