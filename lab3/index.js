const { program } = require('commander');
const fs = require('fs');

program
.option('-i, --input <path>', 'шлях до файлу для читання')
.option('-o, --output <path>', 'шлях до файлу для запису')
.option('-d, --display', 'вивести у консоль')

.option('-m, --mfo', 'відображати код МФО банку')
.option('-n, --normal', 'відображати лише працюючі банки з кодом 1');

program.parse(process.argv);
const options = program.opts();

if (!options.input) {
  console.error('Please, specify input file');
  process.exit(1); 
}

if (!fs.existsSync(options.input)) {
  console.error('Cannot find input file');
  process.exit(1);
}

console.log('Отримані параметри:', options);