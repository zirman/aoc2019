import freeze from './freeze';
import maybe, { Maybe } from './maybe';

export default Object.freeze({
  of<A>(generator: () => Generator<A, void, unknown>): GeneratorMonad<A> {
    return new GeneratorMonad(generator);
  },

  from<A>(iterable: { [Symbol.iterator]: () => Iterator<A> }): GeneratorMonad<A> {
    return new GeneratorMonad(() => iterable[Symbol.iterator]());
  },

  ap<A, B>(gf: GeneratorMonad<(x: A) => B>, gx: GeneratorMonad<A>): GeneratorMonad<B> {
    return new GeneratorMonad(function*() {
      for (const f of gf) {
        for (const x of gx) {
          yield f(x);
        }
      }
    });
  },
});

class GeneratorMonad<A> {
  public readonly [Symbol.iterator]: () => Iterator<A, void, unknown>;

  constructor(run: () => Iterator<A, void, unknown>) {
    this[Symbol.iterator] = run;
    Object.freeze(this);
  }

  public map<B>(f: (x: A) => B): GeneratorMonad<B> {
    const that = this;

    return new GeneratorMonad(function*() {
      for (const x of that) {
        yield f(x);
      }
    });
  }

  public bind<B>(f: (x: A) => GeneratorMonad<B>): GeneratorMonad<B> {
    const that = this;

    return new GeneratorMonad(function*() {
      for (const x of that) {
        for (const y of f(x)) {
          yield y;
        }
      }
    });
  }

  public apNext<B>(gb: GeneratorMonad<B>): GeneratorMonad<B> {
    const that = this;

    return new GeneratorMonad(function*() {
      for (const _ of that) {
        for (const x of gb) {
          yield x;
        }
      }
    });
  }

  public apPrev<B>(gb: GeneratorMonad<B>): GeneratorMonad<A> {
    const that = this;

    return new GeneratorMonad(function*() {
      for (const x of that) {
        for (const _ of gb) {
          yield x;
        }
      }
    });
  }

  public take(n: number): GeneratorMonad<A> {
    const that = this;

    return new GeneratorMonad(function*() {
      const g = that[Symbol.iterator]();

      for (; n >= 0; n--) {
        const next = g.next();

        if (next.done === true) {
          return;
        }

        yield next.value;
      }
    });
  }

  public takeWhile(f: (x: A) => boolean): GeneratorMonad<A> {
    const that = this;

    return new GeneratorMonad(function*() {
      for (const x of that) {
        if (!f(x)) {
          return;
        }

        yield x;
      }
    });
  }

  public drop(n: number): GeneratorMonad<A> {
    const that = this;

    return new GeneratorMonad(function*() {
      const g = that[Symbol.iterator]();

      while (n > 0) {
        const next = g.next();

        if (next.done === true) {
          return;
        }

        n--;
      }

      while (true) {
        const iter = g.next();

        if (iter.done === true) {
          return;
        }

        yield iter.value;
      }
    });
  }

  public dropWhile(f: (x: A) => boolean): GeneratorMonad<A> {
    const that = this;

    return new GeneratorMonad(function*() {
      const g = that[Symbol.iterator]();

      while (true) {
        const n = g.next();

        if (n.done === true) {
          return;
        }

        if (!f(n.value)) {
          yield n.value;
          break;
        }
      }

      while (true) {
        const iter = g.next();

        if (iter.done === true) {
          return;
        }

        yield iter.value;
      }
    });
  }

  public filter(f: (x: A) => boolean): GeneratorMonad<A> {
    const that = this;

    return new GeneratorMonad(function*() {
      for (const x of that) {
        if (f(x)) {
          yield x;
        }
      }
    });
  }

  public zip<B, C>(generator: GeneratorMonad<B>, f: (x: A, y: B) => C): GeneratorMonad<C> {
    const that = this;
    return new GeneratorMonad(function*() {
      const ga = that[Symbol.iterator]();
      const gb = generator[Symbol.iterator]();

      while (true) {
        const na = ga.next();

        if (na.done === true) {
          return;
        }

        const nb = gb.next();

        if (nb.done === true) {
          return;
        }

        yield f(na.value, nb.value);
      }
    });
  }

  public reduce(f: (x: A,  y: A) => A): Maybe<A> {
    const g = this[Symbol.iterator]();
    const n = g.next();

    if (n.done === true) {
      return maybe.none();
    }

    let acc = n.value;

    while (true) {
      const iter = g.next();

      if (iter.done === true) {
        return maybe.just(acc);
      }

      acc = f(acc, iter.value);
    }
  }

  public reduceWith<B>(acc: B, f: (acc: B,  x: A) => B): B {
    for (const x of this) {
      acc = f(acc, x);
    }

    return acc;
  }

  public scan(f: (x: A, y: A) => A): GeneratorMonad<A> {
    const that = this;

    return new GeneratorMonad(function*() {
      const g = that[Symbol.iterator]();
      const n = g.next();

      if (n.done === true) {
        return;
      }

      let x = n.value;
      yield x;

      while (true) {
        const iter = g.next();

        if (iter.done === true) {
          return;
        }

        x = f(x, iter.value);
        yield x;
      }
    });
  }

  public scanWith<B>(acc: B, f: (acc: B, y: A) => B): GeneratorMonad<B> {
    const that = this;

    return new GeneratorMonad(function*() {
      for (const y of that) {
        acc = f(acc, y);
        yield acc;
      }
    });
  }

  public count(): number {
    let i: number = 0;

    for (const x of this) {
      i++;
    }

    return i;
  }
}

freeze(GeneratorMonad);
