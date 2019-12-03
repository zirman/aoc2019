// tslint:disable-next-line: ban-types
export function frozen(target: Function): void {
    Object.freeze(target);
    Object.freeze(target.prototype);
}
