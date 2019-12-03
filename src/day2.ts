import fs from 'fs';
import parse from './parse';
import { lines } from './pipes';

export {};

abstract class Expr {
  public abstract print(): string;
  public abstract simplify(variables: Set<number>): Expr;
  // public abstract distributeAdd(a: number): Expr;
  public abstract distributeMul(a: number): Expr;
}

class Mem extends Expr {
  public readonly x: number;
  public readonly i: number;

  constructor(x: number, i: number) {
    super();
    this.x = x;
    this.i = i;
  }

  public print(): string {
    return `(${this.x}:${this.i})`;
  }

  public simplify(variables: Set<number>): Expr {
    if (variables.has(this.i)) {
      return this;
    } else {
      return new Num(this.x);
    }
  }

  // public distributeAdd(a: number): Expr {
  //   return new Add(new Num(a), this);
  // }

  public distributeMul(a: number): Expr {
    return new Mul(new Num(a), this);
  }
}

class Add extends Expr {
  public readonly x: Expr;
  public readonly y: Expr;

  constructor(x: Expr, y: Expr) {
    super();
    this.x = x;
    this.y = y;
  }

  public print(): string {
    return `(${this.x.print()} + ${this.y.print()})`;
  }

  public simplify(variables: Set<number>): Expr {
    const x = this.x.simplify(variables);
    const y = this.y.simplify(variables);

    if (x instanceof Num && y instanceof Num) {
      return new Num(x.x + y.x);
    }

    if (x instanceof Num && y instanceof Add) {
      return y.distributeAdd(x.x);
    }

    if (y instanceof Num && x instanceof Add) {
      return x.distributeAdd(y.x);
    }

    return new Add(x, y);
  }

  public distributeAdd(a: number): Expr {
    if (this.x instanceof Num) {
      return new Add(new Num(this.x.x + a), this.y);
    }

    if (this.y instanceof Num) {
      return new Add(this.x, new Num(this.y.x + a));
    }

    return new Add(new Num(a), this);
  }

  public distributeMul(a: number): Expr {
    const x = this.x.distributeMul(a);
    const y = this.y.distributeMul(a);
    return new Add(x, y);
  }
}

class Mul extends Expr {
  public readonly x: Expr;
  public readonly y: Expr;

  constructor(x: Expr, y: Expr) {
    super();
    this.x = x;
    this.y = y;
  }

  public print(): string {
    return `(${this.x.print()} * ${this.y.print()})`;
  }

  public simplify(variables: Set<number>): Expr {
    const x = this.x.simplify(variables);
    const y = this.y.simplify(variables);

    if (x instanceof Num && y instanceof Num) {
      return new Num(x.x * y.x);
    }

    if (x instanceof Num) {
      return y.distributeMul(x.x);
    }

    if (y instanceof Num) {
      return x.distributeMul(y.x);
    }

    return new Mul(x, y);
  }

  // public distributeAdd(a: number): Expr {
  //   return new Add(new Num(a), this);
  // }

  public distributeMul(a: number): Expr {
    const x = this.x.distributeMul(a);
    return new Mul(x, this.y);
  }
}

// Used when simplifying
class Num extends Expr {
  public readonly x: number;

  constructor(x: number) {
    super();
    this.x = x;
  }

  public print(): string {
    return `${this.x}`;
  }

  public simplify(variables: Set<number>): Expr {
    return this;
  }

  // public distributeAdd(a: number): Expr {
  //   return new Num(a + this.x);
  // }

  public distributeMul(a: number): Expr {
    return new Num(this.x * a);
  }
}

fs.readFile('../input/day2.txt', 'utf8', (error, contents) => {
  if (error !== null) {
    console.error(error);
    return;
  }

  const parseDigits = parse.while((c) => c.match(/^\d$/) !== null);
  const parseComma = parse.string(',');
  const parseLine = parse.sepBy(parseDigits, parseComma);

  const b: Array<number> = [];
  for (const line of lines(contents)) {
    parseLine.parse(line).onResult(
      (ns) => {
        for (const x of ns) {
          b.push(parseInt(x, 10));
        }
      },
      (i) => {
        console.error(`parse error:\n${line}\n${' '.repeat(i)}^`);
        throw Error();
      },
    );
  }

  let a = b.slice(0);
  a[1] = 12;
  a[2] = 2;
  let ip = 0;

  loop:
  while (true) {
    switch (a[ip]) {
    case 1:
      a[a[ip + 3]] = a[a[ip + 1]] + a[a[ip + 2]];
      ip += 4;
      break;
    case 2:
      a[a[ip + 3]] = a[a[ip + 1]] * a[a[ip + 2]];
      ip += 4;
      break;
    case 99:
      break loop;
    default:
      throw Error();
    }
  }

  // part 1
  console.log(a[0]);

  a = b.slice(0);
  a[1] = 12;
  a[2] = 2;

  // find halt position
  for (ip = 0; a[ip] !== 99; ip += 4) {}

  // part 2 expression
  // calculate position 0 through induction
  console.log(calc(0, ip));

  function calc(i: number, ip: number): number {
    while (true) {
      if (ip === 0) {
        return a[i];
      }

      ip -= 4;

      if (a[ip + 3] === i) {
        if (a[ip] === 1) {
          return calc(a[ip + 1], ip) + calc(a[ip + 2], ip);
        } else if (a[ip] === 2) {
          return calc(a[ip + 1], ip) * calc(a[ip + 2], ip);
        } else {
          throw Error();
        }
      }
    }
  }

  // print expression
  console.log(expr(0, ip).simplify(new Set([1, 2])).print());

  // now solve on paper because there are multiple solutions but only one that is in the range 0-99
  // 19160113 - y = 248832 * x
  // y = 49
  // x = 77

  function expr(i: number, ip: number): Expr {
    while (true) {
      if (ip === 0) {
        return new Mem(a[i], i);
      }

      ip -= 4;

      if (a[ip + 3] === i) {
        if (a[ip] === 1) {
          return new Add(expr(a[ip + 1], ip), expr(a[ip + 2], ip));
        } else if (a[ip] === 2) {
          return new Mul(expr(a[ip + 1], ip), expr(a[ip + 2], ip));
        } else {
          throw Error();
        }
      }
    }
  }
});
