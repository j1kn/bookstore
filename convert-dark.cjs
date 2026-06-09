const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'App.tsx',
  'components/Header.tsx',
  'components/AdminDashboard.tsx',
  'components/BookCard.tsx',
  'components/SubscriptionPage.tsx',
  'components/PremiumGate.tsx',
  'components/AIAssistant.tsx'
];

function convert(file) {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p)) return;
  
  let code = fs.readFileSync(p, 'utf-8');
  
  code = code.replace(/(?<!dark:)bg-white/g, 'bg-white dark:bg-gray-900');
  code = code.replace(/(?<!dark:)bg-gray-50/g, 'bg-gray-50 dark:bg-gray-800');
  code = code.replace(/(?<!dark:)bg-indigo-50/g, 'bg-indigo-50 dark:bg-indigo-900/30');
  
  code = code.replace(/(?<!dark:)text-gray-900/g, 'text-gray-900 dark:text-gray-50');
  code = code.replace(/(?<!dark:)text-gray-800/g, 'text-gray-800 dark:text-gray-200');
  code = code.replace(/(?<!dark:)text-gray-600/g, 'text-gray-600 dark:text-gray-300');
  code = code.replace(/(?<!dark:)text-gray-500/g, 'text-gray-500 dark:text-gray-400');
  code = code.replace(/(?<!dark:)text-indigo-950/g, 'text-indigo-950 dark:text-indigo-100');
  
  code = code.replace(/(?<!dark:)border-gray-100/g, 'border-gray-100 dark:border-gray-700/50');
  code = code.replace(/(?<!dark:)border-gray-200/g, 'border-gray-200 dark:border-gray-700');
  
  fs.writeFileSync(p, code);
  console.log(`Processed ${file}`);
}

filesToProcess.forEach(convert);
