import fs from 'fs';
import parse from './parse';
import { lines, reduceWith } from './pipes';

export {};

fs.readFile('../input/day1.txt', 'utf8', (error, contents) => {
  if (error !== null) {
    console.error(error);
    return;
  }

  const parseUnsignedInt = parse.while((c) => c.match(/^\d$/) !== null);

  const weight: Array<number> = [];
  for (const line of lines(contents)) {
    parseUnsignedInt.parse(line).onResult(
      (s) => weight.push(parseInt(s, 10)),
      (i) => {
        console.error(`parse failed: ${i}`);
        throw Error();
      },
    );
  }

  console.log(reduceWith(0, (x, y) => x + y, weight.map((x) => calculateFuel(x))));
  console.log(reduceWith(0, (x, y) => x + y, weight.map((x) => additionalFuel(calculateFuel(x)))));

  function calculateFuel(w: number): number {
    return Math.floor(w / 3) - 2;
  }

  function additionalFuel(fuelWeight: number): number {
    if (fuelWeight <= 0) {
      return 0;
    }

    const moreFuel = calculateFuel(fuelWeight);
    return fuelWeight + additionalFuel(moreFuel);
  }
});
