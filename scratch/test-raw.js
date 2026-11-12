import katex from 'katex';

const rawSingle = '\\text{km/h} \\to \\text{m/s}'; // this represents String.raw`\text{km/h} \to \text{m/s}`
console.log('Single slash:', rawSingle);
console.log('Katex output:', katex.renderToString(rawSingle, { throwOnError: false }));
