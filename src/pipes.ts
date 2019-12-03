import { EOL } from 'os';

export function lines(s: string): Array<string> {
  const ls = s.split(EOL);
  Object.freeze(ls);
  return ls;
}

export function words(s: string): Array<string> {
  const ls = s.match(/\S+/g) ?? [];
  Object.freeze(ls);
  return ls;
}

export function reduceWith<A, B>(acc: B, f: (acc: B, x: A) => B, a: Array<A>): B {
  for (const x of a) {
    acc = f(acc, x);
  }

  return acc;
}

function groupBy<T, A>(toKey: (x: T) => A): (arr: Array<T>) => Map<A, Array<T>> {
  return (xs) => {
    const m: Map<A, Array<T>> = new Map();
    for (const x of xs) {
      const key = toKey(x);
      const a = m.get(key);
      if (a === undefined) {
        m.set(key, [x]);
      } else {
        a.push(x);
      }
    }
    return m;
  };
}
