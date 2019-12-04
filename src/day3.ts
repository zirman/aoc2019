import fs, { writeSync } from 'fs';
import parse from './parse';
import { lines } from './pipes';

export {};

fs.readFile('../input/day3.txt', 'utf8', (error, contents) => {
  if (error !== null) {
    console.error(error);
    return;
  }

  const parseDir = parse.string('R').or(parse.string('D')).or(parse.string('L')).or(parse.string('U'));
  const parseComma = parse.string(',');
  const parseDigits = parse.while((c) => c.match(/^\d$/) !== null);

  const parseMove = parse.sepBy(
    parseDir.bind((direction) =>
      parseDigits.map((distance) =>
        ({direction, distance: parseInt(distance, 10)}),
      ),
    ),
    parseComma,
  );

  let manhattanDistance = Infinity;
  let stepsDistance = Infinity;

  let wire: number = 0;
  const ls = lines(contents);

  const w1: Map<string, number> = new Map();
  parseMove.parse(ls[0]).onResult(
    (moves) => {
      let steps = 0;
      let x = 0;
      let y = 0;

      for (const move of moves) {
        let step: () => void;
        switch (move.direction) {
        case 'R':
          step = () => { x++; };
          break;
        case 'D':
          step = () => { y--; };
          break;
        case 'L':
          step = () => { x--; };
          break;
        case 'U':
          step = () => { y++; };
          break;
        default:
          throw Error();
        }

        for (let i = 0; i < move.distance; i++) {
          step();
          steps++;
          const pos = `${x}:${y}`;

          w1.set(pos, steps);
        }
      }

      wire++;
    },
    (i) => {
      console.error(`parse error:\n${ls[0]}\n${' '.repeat(i)}^`);
      throw Error();
    },
  );

  parseMove.parse(ls[1]).onResult(
    (moves) => {
      let steps = 0;
      let x = 0;
      let y = 0;

      for (const move of moves) {
        let step: () => void;
        switch (move.direction) {
        case 'R':
          step = () => { x++; };
          break;
        case 'D':
          step = () => { y--; };
          break;
        case 'L':
          step = () => { x--; };
          break;
        case 'U':
          step = () => { y++; };
          break;
        default:
          throw Error();
        }

        for (let i = 0; i < move.distance; i++) {
          step();
          steps++;
          const pos = `${x}:${y}`;
          const maybeWire = w1.get(pos);

          if (maybeWire !== undefined) {
            manhattanDistance = Math.min(manhattanDistance, Math.abs(x) + Math.abs(y));
            stepsDistance = Math.min(stepsDistance, maybeWire + steps);
          }
        }
      }

      wire++;
    },
    (i) => {
      console.error(`parse error:\n${ls[1]}\n${' '.repeat(i)}^`);
      throw Error();
    },
  );

  console.log(manhattanDistance);
  console.log(stepsDistance);
});
