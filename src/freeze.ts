// tslint:disable-next-line: ban-types
export default function freeze(target: Function): void {
  Object.freeze(target);
  Object.freeze(target.prototype);
}
