import freeze from './freeze';
import maybe, { Maybe } from './maybe';

export default Object.freeze({
  // char(c: string): Parser<string> {
  //   return new Char(c);
  // },

  string(s: string): Parser<string> {
    return new ParseString(s);
  },

  while(f: (c: string) => boolean): Parser<string> {
    return new While(f);
  },

  many<A>(pa: Parser<A>): Parser<Array<A>> {
    return new Many(pa);
  },

  skipMany<A>(pa: Parser<A>): Parser<number> {
    return new SkipMany(pa);
  },

  many1<A>(pa: Parser<A>): Parser<Array<A>> {
    return new Many1(pa);
  },

  skipMany1<A>(pa: Parser<A>): Parser<number> {
    return new SkipMany1(pa);
  },

  sepBy<A, S>(pa: Parser<A>, sep: Parser<S>): Parser<Array<A>> {
    return new SepBy(pa, sep);
  },

  sepBy1<A, S>(pa: Parser<A>, sep: Parser<S>): Parser<Array<A>> {
    return new SepBy1(pa, sep);
  },

  optionMaybe<A>(pa: Parser<A>): Parser<Maybe<A>> {
    return new OptionMaybe(pa);
  },
});

abstract class Result<A> {
  public abstract isMatch(): boolean;
  public abstract onResult(f: (x: A) => void, g: (i: number) => void): void;
}

freeze(Result);

class Match<A> extends Result<A> {
  public readonly x: A;
  public readonly i: number;

  constructor(x: A, i: number) {
    super();
    this.x = x;
    this.i = i;
    Object.freeze(this);
  }

  public isMatch(): boolean {
    return true;
  }

  public onResult(f: (x: A) => void, g: (i: number) => void): void {
    f(this.x);
  }

  public onError(f: (i: number) => void): void {}
}

freeze(Match);

class MatchErr extends Result<never> {
  public readonly i: number;

  constructor(i: number) {
    super();
    this.i = i;
    Object.freeze(this);
  }

  public isMatch(): boolean {
    return false;
  }

  public onResult(f: (x: never) => void, g: (i: number) => void): void {
    g(this.i);
  }
}

freeze(MatchErr);

export abstract class Parser<A> {
  public map<B>(f: (x: A) => B): Parser<B> {
    return new ParseMap(this, f);
  }

  public bind<B>(f: (x: A) => Parser<B>): Parser<B> {
    return new Bind(this, f);
  }

  public apNext<B>(pb: Parser<B>): Parser<B> {
    return new ApNext(this, pb);
  }

  public apPrev<B>(pb: Parser<B>): Parser<A> {
    return new ApPrev(this, pb);
  }

  public or(pa: Parser<A>): Parser<A> {
    return new Or(this, pa);
  }

  public parse(s: string): Result<A> {
    const ss = s.split('');
    const result = this.parseAt(ss, 0);

    if (!(result instanceof Match)) {
      return result;
    }

    if (result.i !== ss.length) {
      return new MatchErr(result.i);
    }

    return result;
  }

  public abstract parseAt(cs: Array<string>, i: number): Result<A>;
}

freeze(Parser);

class ParseMap<A, B> extends Parser<B> {
  private readonly pa: Parser<A>;
  private readonly f: (x: A) => B;

  constructor(pa: Parser<A>, f: (x: A) => B) {
    super();
    this.pa = pa;
    this.f = f;
    Object.freeze(this);
  }

  public parseAt(cs: Array<string>, i: number): Result<B> {
    const result = this.pa.parseAt(cs, i);

    if (!(result instanceof Match)) {
      return result as MatchErr;
    }

    return new Match(this.f(result.x), result.i);
  }
}

freeze(ParseMap);

class Bind<A, B> extends Parser<B> {
  private readonly pa: Parser<A>;
  private readonly f: (x: A) => Parser<B>;

  constructor(pa: Parser<A>, f: (x: A) => Parser<B>) {
    super();
    this.pa = pa;
    this.f = f;
    Object.freeze(this);
  }

  public parseAt(cs: Array<string>, i: number): Result<B> {
    const result = this.pa.parseAt(cs, i);

    if (!(result instanceof Match)) {
      return result as MatchErr;
    }

    return this.f(result.x).parseAt(cs, result.i);
  }
}

freeze(Bind);

class ApNext<A, B> extends Parser<B> {
  private readonly pa: Parser<A>;
  private readonly pb: Parser<B>;

  constructor(pa: Parser<A>, pb: Parser<B>) {
    super();
    this.pa = pa;
    this.pb = pb;
    Object.freeze(this);
  }

  public parseAt(cs: Array<string>, i: number): Result<B> {
    const result = this.pa.parseAt(cs, i);

    if (!(result instanceof Match)) {
      return result as MatchErr;
    }

    return this.pb.parseAt(cs, result.i);
  }
}

freeze(ApNext);

class ApPrev<A, B> extends Parser<A> {
  private readonly pa: Parser<A>;
  private readonly pb: Parser<B>;

  constructor(pa: Parser<A>, pb: Parser<B>) {
    super();
    this.pa = pa;
    this.pb = pb;
    Object.freeze(this);
  }

  public parseAt(cs: Array<string>, i: number): Result<A> {
    const resulta = this.pa.parseAt(cs, i);

    if (!(resulta instanceof Match)) {
      return resulta;
    }

    const resultb =  this.pb.parseAt(cs, resulta.i);

    if (!(resultb instanceof Match)) {
      return resultb as MatchErr;
    }

    return new Match(resulta.x, resultb.i);
  }
}

freeze(ApPrev);

class Or<A, B> extends Parser<A> {
  private readonly p1: Parser<A>;
  private readonly p2: Parser<A>;

  constructor(p1: Parser<A>, p2: Parser<A>) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    Object.freeze(this);
  }

  public parseAt(cs: Array<string>, i: number): Result<A> {
    const result1 = this.p1.parseAt(cs, i);

    if (result1 instanceof Match) {
      return result1;
    }

    return this.p2.parseAt(cs, i);
  }
}

freeze(Or);

// class Char extends Parser<string> {
//   private readonly c: string;

//   constructor(c: string) {
//     super();
//     this.c = c;
//     Object.freeze(this);
//   }

//   public parseAt(cs: Array<string>, i: number): Result<string> {
//     if (i >= cs.length || cs[i] !== this.c) {
//       return new MatchErr(i);
//     }

//     return new Match(this.c, i + 1);
//   }
// }

// freeze(Char);

class ParseString extends Parser<string> {
  private readonly s: string;
  private readonly ss: Array<string>;

  constructor(s: string) {
    super();
    this.s = s;
    this.ss = s.split('');
    Object.freeze(this);
  }

  public parseAt(cs: Array<string>, i: number): Result<string> {
    let j = 0;

    while (j < this.ss.length) {
      if (i >= cs.length || cs[i] !== this.ss[j]) {
        return new MatchErr(i);
      }

      i++;
      j++;
    }

    return new Match(this.s, i);
  }
}

freeze(ParseString);

class While extends Parser<string> {
  private readonly f: (c: string) => boolean;

  constructor(f: (c: string) => boolean) {
    super();
    this.f = f;
    Object.freeze(this);
  }

  public parseAt(cs: Array<string>, i: number): Result<string> {
    const ss: Array<string> = [];

    while (true) {
      if (i >= cs.length || !this.f(cs[i])) {
        if (ss.length > 0) {
          return new Match(ss.join(''), i);
        } else {
          return new MatchErr(i);
        }
      }

      ss.push(cs[i]);
      i++;
    }
  }
}

freeze(While);

class Many<A> extends Parser<Array<A>> {
  private readonly pa: Parser<A>;

  constructor(pa: Parser<A>) {
    super();
    this.pa = pa;
    Object.freeze(this);
  }

  public parseAt(cs: Array<string>, i: number): Result<Array<A>> {
    const as: Array<A> = [];

    while (true) {
      const result = this.pa.parseAt(cs, i);

      if (!(result instanceof Match)) {
        Object.freeze(as);
        return new Match(as, i);
      }

      as.push(result.x);
      i = result.i;
    }
  }
}

freeze(Many);

class SkipMany<A> extends Parser<number> {
  private readonly pa: Parser<A>;

  constructor(pa: Parser<A>) {
    super();
    this.pa = pa;
    Object.freeze(this);
  }

  public parseAt(cs: Array<string>, i: number): Result<number> {
    let n = 0;

    while (true) {
      const result = this.pa.parseAt(cs, i);

      if (!(result instanceof Match)) {
        return new Match(n, i);
      }

      n++;
      i = result.i;
    }
  }
}

freeze(SkipMany);

class Many1<A> extends Parser<Array<A>> {
  private readonly pa: Parser<A>;

  constructor(pa: Parser<A>) {
    super();
    this.pa = pa;
    Object.freeze(this);
  }

  public parseAt(cs: Array<string>, i: number): Result<Array<A>> {
    const as: Array<A> = [];

    while (true) {
      const result = this.pa.parseAt(cs, i);

      if (!(result instanceof Match)) {
        if (as.length > 0) {
          Object.freeze(as);
          return new Match(as, i);
        } else {
          return new MatchErr((result as MatchErr).i);
        }
      }

      as.push(result.x);
      i = result.i;
    }
  }
}

freeze(Many1);

class SkipMany1<A> extends Parser<number> {
  private readonly pa: Parser<A>;

  constructor(pa: Parser<A>) {
    super();
    this.pa = pa;
    Object.freeze(this);
  }

  public parseAt(cs: Array<string>, i: number): Result<number> {
    let n = 0;

    while (true) {
      const result = this.pa.parseAt(cs, i);

      if (!(result instanceof Match)) {
        if (n > 0) {
          return new Match(n, i);
        } else {
          return new MatchErr((result as MatchErr).i);
        }
      }

      n++;
      i = result.i;
    }
  }
}

freeze(SkipMany1);

class SepBy<A, S> extends Parser<Array<A>> {
  private readonly pa: Parser<A>;
  private readonly sep: Parser<S>;

  constructor(pa: Parser<A>, sep: Parser<S>) {
    super();
    this.pa = pa;
    this.sep = sep;
    Object.freeze(this);
  }

  public parseAt(cs: Array<string>, i: number): Result<Array<A>> {
    const as: Array<A> = [];

    let result = this.pa.parseAt(cs, i);

    if (!(result instanceof Match)) {
      Object.freeze(as);
      return new Match(as, i);
    }

    as.push(result.x);
    i = result.i;

    while (true) {
      const sepResult = this.sep.parseAt(cs, i);

      if (!(sepResult instanceof Match)) {
        Object.freeze(as);
        return new Match(as, i);
      }

      result = this.pa.parseAt(cs, sepResult.i);

      if (!(result instanceof Match)) {
        Object.freeze(as);
        return new Match(as, i);
      }

      as.push(result.x);
      i = result.i;
    }
  }
}

freeze(SepBy);

class SepBy1<A, S> extends Parser<Array<A>> {
  private readonly pa: Parser<A>;
  private readonly sep: Parser<S>;

  constructor(pa: Parser<A>, sep: Parser<S>) {
    super();
    this.pa = pa;
    this.sep = sep;
    Object.freeze(this);
  }

  public parseAt(cs: Array<string>, i: number): Result<Array<A>> {
    const as: Array<A> = [];

    let result = this.pa.parseAt(cs, i);

    if (!(result instanceof Match)) {
      return new MatchErr(i);
    }

    as.push(result.x);
    i = result.i;

    while (true) {
      const sepResult = this.sep.parseAt(cs, i);

      if (!(sepResult instanceof Match)) {
        Object.freeze(as);
        return new Match(as, i);
      }

      result = this.pa.parseAt(cs, sepResult.i);

      if (!(result instanceof Match)) {
        Object.freeze(as);
        return new Match(as, i);
      }

      as.push(result.x);
      i = result.i;
    }
  }
}

freeze(SepBy1);

class OptionMaybe<A> extends Parser<Maybe<A>> {
  private readonly pa: Parser<A>;

  constructor(pa: Parser<A>) {
    super();
    this.pa = pa;
    Object.freeze(this);
  }

  public parseAt(cs: Array<string>, i: number): Result<Maybe<A>> {
    const result = this.pa.parseAt(cs, i);

    if (!(result instanceof Match)) {
      return new Match(maybe.none(), i);
    }

    return new Match(maybe.just(result.x), result.i);
  }
}

freeze(OptionMaybe);
