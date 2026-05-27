const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'src', 'components', 'RecurringExpenses.tsx'),
  path.join(__dirname, 'src', 'components', 'ReferenceDashboard.tsx')
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Revert labels
  content = content.replace(/text-sm font-bold uppercase tracking-widest/g, 'text-[10px] font-bold uppercase tracking-widest');
  content = content.replace(/text-sm font-medium uppercase tracking-widest/g, 'text-[10px] font-medium uppercase tracking-widest');
  content = content.replace(/text-sm uppercase tracking-widest/g, 'text-[10px] uppercase tracking-widest');
  content = content.replace(/text-xs opacity-60/g, 'text-[10px] opacity-60');

  // Revert tags
  content = content.replace(/text-xs px-1.5 py-0.5/g, 'text-[9px] px-1.5 py-0.5');
  content = content.replace(/text-sm px-1\.5 py-0\.5/g, 'text-[9px] px-1.5 py-0.5');

  // Other typography that might be broken
  content = content.replace(/text-sm text-zinc-500/g, 'text-[10px] text-zinc-500');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Fixed fonts in ${path.basename(file)}`);
}
