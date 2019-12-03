import freeze from './freeze';
import maybe, { Maybe } from './maybe';

export default Object.freeze({
  of<A>(generator: GeneratorOf<A>): GeneratorMonad<A> {
    return new GeneratorMonad(generator);
  },

  from<A>(array: Array<A>): GeneratorMonad<A> {
    return new GeneratorMonad(function*() {
      for (const x of array) {
        yield x;
      }
    });
  },

  ap<A, B>(gf: GeneratorMonad<(x: A) => B>, gx: GeneratorMonad<A>): GeneratorMonad<B> {
    return new GeneratorMonad(function*() {
      for (const f of gf.generate()) {
        for (const x of gx.generate()) {
          yield f(x);
        }
      }
    });
  },
});

type GeneratorOf<A> = () => Generator<A, void, unknown>;

class GeneratorMonad<A> {
  public readonly generate: GeneratorOf<A>;

  constructor(run: GeneratorOf<A>) {
    this.generate = run;
    Object.freeze(this);
  }

  public map<B>(f: (x: A) => B): GeneratorMonad<B> {
    const that = this;

    return new GeneratorMonad(function*() {
      for (const x of that.generate()) {
        yield f(x);
      }
    });
  }

  public bind<B>(f: (x: A) => GeneratorMonad<B>): GeneratorMonad<B> {
    const that = this;

    return new GeneratorMonad(function*() {
      for (const x of that.generate()) {
        for (const y of f(x).generate()) {
          yield y;
        }
      }
    });
  }

  public apNext<B>(gb: GeneratorMonad<B>): GeneratorMonad<B> {
    const that = this;

    return new GeneratorMonad(function*() {
      for (const _ of that.generate()) {
        for (const x of gb.generate()) {
          yield x;
        }
      }
    });
  }

  public apPrev<B>(gb: GeneratorMonad<B>): GeneratorMonad<A> {
    const that = this;

    return new GeneratorMonad(function*() {
      for (const x of that.generate()) {
        for (const _ of gb.generate()) {
          yield x;
        }
      }
    });
  }

  public take(n: number): GeneratorMonad<A> {
    const that = this;

    return new GeneratorMonad(function*() {
      const g = that.generate();

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
      for (const x of that.generate()) {
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
      const g = that.generate();

      while (n > 0) {
        const next = g.next();

        if (next.done === true) {
          return;
        }

        n--;
      }

      for (const x of g) {
        yield x;
      }
    });
  }

  public dropWhile(f: (x: A) => boolean): GeneratorMonad<A> {
    const that = this;

    return new GeneratorMonad(function*() {
      const g = that.generate();

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

      for (const x of g) {
        yield x;
      }
    });
  }

  public filter(f: (x: A) => boolean): GeneratorMonad<A> {
    const that = this;

    return new GeneratorMonad(function*() {
      for (const x of that.generate()) {
        if (f(x)) {
          yield x;
        }
      }
    });
  }

  public zip<B, C>(generator: GeneratorMonad<B>, f: (x: A, y: B) => C): GeneratorMonad<C> {
    const that = this;
    return new GeneratorMonad(function*() {
      const ga = that.generate();
      const gb = generator.generate();

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
    const g = this.generate();
    const n = g.next();

    if (n.done === true) {
      return maybe.none();
    }

    let acc = n.value;

    for (const x of g) {
      acc = f(acc, x);
    }

    return maybe.just(acc);
  }

  public reduceWith<B>(acc: B, f: (acc: B,  x: A) => B): B {
    for (const x of this.generate()) {
      acc = f(acc, x);
    }

    return acc;
  }

  public scan(f: (x: A, y: A) => A): GeneratorMonad<A> {
    const that = this;

    return new GeneratorMonad(function*() {
      const g = that.generate();
      const n = g.next();

      if (n.done === true) {
        return;
      }

      let x = n.value;
      yield x;

      for (const y of g) {
        x = f(x, y);
        yield x;
      }
    });
  }

  public scanWith<B>(acc: B, f: (acc: B, y: A) => B): GeneratorMonad<B> {
    const that = this;

    return new GeneratorMonad(function*() {
      for (const y of that.generate()) {
        acc = f(acc, y);
        yield acc;
      }
    });
  }
}

freeze(GeneratorMonad);
