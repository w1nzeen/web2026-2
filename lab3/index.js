const { program } = require('commander');
const fs = require('fs');

program
  .option('-i, --input <path>', 'Path to the input file')
  .option('-o, --output <path>', 'Path to the output file')
  .option('-d, --display', 'Display the result in console')
  .option('-m, --mfo', 'Display MFO code before bank name')
  .option('-n, --normal', 'Display only banks with state code 1');

program.parse(process.argv);
const options = program.opts();

if (!options.input) {
  console.error("Please, specify input file");
  process.exit(1);
}

if (!fs.existsSync(options.input)) {
  console.error("Cannot find input file");
  process.exit(1);
}

if (!options.output && !options.display) {
  process.exit(0);
}

try {
  const rawData = fs.readFileSync(options.input, 'utf-8');
  let banks = JSON.parse(rawData);

  if (options.normal) {
    banks = banks.filter(bank => Number(bank.COD_STATE) === 1);
  }

  const result = banks
    .map(bank => {
      const name = bank.NAME_B || bank.SHORTNAME || 'Unknown Bank';
      return options.mfo && bank.MFO ? `${bank.MFO} ${name}` : name;
    })
    .join('\n');

  if (options.display) {
    console.log(result);
  }

  if (options.output) {
    fs.writeFileSync(options.output, result);
  }
} catch (error) {
  process.exit(1);
}