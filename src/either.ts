import freeze from './freeze';

export default Object.freeze({
  right<E, A>(x: A): Either<E, A> {
    return new Right(x);
  },

  left<E>(e: E): Either<E, never> {
    return new Left(e);
  },
});

export abstract class Either<E, A> {
  public abstract map<B>(f: (x: A) => B): Either<E, B>;
  public abstract bind<B>(f: (x: A) => Either<E, B>): Either<E, B>;
  public abstract apNext<B>(pb: Either<E, B>): Either<E, B>;
  public abstract anPrev<B>(pb: Either<E, B>): Either<E, A>;
}

freeze(Either);

class Right<E, A> extends Either<E, A> {
  private readonly x: A;

  constructor(x: A) {
    super();
    this.x = x;
    Object.freeze(this);
  }

  public map<B>(f: (x: A) => B): Either<E, B> {
    return new Right(f(this.x));
  }

  public bind<B>(f: (x: A) => Either<never, B>): Either<E, B> {
    return f(this.x);
  }

  public apNext<B>(pb: Either<never, B>): Either<E, B> {
    return pb;
  }

  public anPrev<B>(pb: Either<E, B>): Either<E, A> {
    if (this instanceof Left) {
      return this;
    } else if (pb instanceof Left) {
      return pb;
    } else {
      return this;
    }
  }
}

freeze(Right);

class Left<E> extends Either<E, never> {
  public readonly e: E;

  constructor(e: E) {
    super();
    this.e = e;
    Object.freeze(this);
  }

  public map<B>(f: (x: never) => B): Either<E, B> {
    return this;
  }

  public bind<B>(f: (x: never) => Either<E, B>): Either<E, B> {
    return this;
  }

  public apNext<B>(pb: Either<E, B>): Either<E, B> {
    return this;
  }

  public anPrev<B>(pb: Either<E, B>): Either<E, never> {
    return this;
  }
}

freeze(Left);
