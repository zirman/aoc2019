import generator from './generator';

export {};

const range = generator
  .of(function* ranger() {
    for (let i = 372304; i <= 847060; i++) {
      yield i;
    }
  })
  .map((x) => x.toString().split(''));

const part1 = range
  .filter((x) => {
    let retVal = false;
    for (let i = 0; i < x.length - 1; i++) {
      if (x[i] > x[i + 1]) {
        return false;
      }
      if (x[i] === x[i + 1]) {
        retVal = true;
      }
    }
    return retVal;
  });

console.log(part1.count());

const part2 = range
  .filter((x) => {
    let retVal = false;
    let consecutive = 1;
    for (let i = 0; i < x.length - 1; i++) {
      if (x[i] > x[i + 1]) {
        return false;
      }
      if (x[i] === x[i + 1]) {
        consecutive++;
      } else {
        if (consecutive === 2) {
          retVal = true;
        }
        consecutive = 1;
      }
    }
    return retVal || consecutive === 2;
  });

console.log(part2.count());
