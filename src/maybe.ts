import freeze from './freeze';

export default Object.freeze({
  just<A>(x: A): Maybe<A> {
    return new Just(x);
  },

  none(): Maybe<never> {
    return None.instance;
  },

  joinArray<A>(ma: Maybe<Array<A>>): Array<A> {
    const x = ma.toNullable();
    return x === null ? [] : x;
  },
});

export abstract class Maybe<A> {
  public abstract map<B>(f: (x: A) => B): Maybe<B>;
  public abstract bind<B>(f: (x: A) => Maybe<B>): Maybe<B>;
  public abstract apNext<B>(pb: Maybe<B>): Maybe<B>;
  public abstract anPrev<B>(pb: Maybe<B>): Maybe<A>;
  public abstract toNullable(): A | null;
}

freeze(Maybe);

class Just<A> extends Maybe<A> {
  private readonly x: A;

  constructor(x: A) {
    super();
    this.x = x;
    Object.freeze(this);
  }

  public map<B>(f: (x: A) => B): Maybe<B> {
    return new Just(f(this.x));
  }

  public bind<B>(f: (x: A) => Maybe<B>): Maybe<B> {
    return f(this.x);
  }

  public apNext<B>(pb: Maybe<B>): Maybe<B> {
    return pb;
  }

  public anPrev<B>(pb: Maybe<B>): Maybe<A> {
    if (pb instanceof Just) {
      return this;
    } else {
      return None.instance;
    }
  }

  public toNullable(): A | null {
    return this.x;
  }
}

freeze(Just);

class None extends Maybe<never> {
  public  static readonly instance = new None();

  private constructor() {
    super();
    Object.freeze(this);
  }

  public map<B>(f: (x: never) => B): Maybe<B> {
    return this;
  }

  public bind<B>(f: (x: never) => Maybe<B>): Maybe<B> {
    return this;
  }

  public apNext<B>(pb: Maybe<B>): Maybe<B> {
    return this;
  }

  public anPrev<B>(pb: Maybe<B>): Maybe<never> {
    return this;
  }

  public toNullable(): never | null {
    return null;
  }
}

freeze(None);
