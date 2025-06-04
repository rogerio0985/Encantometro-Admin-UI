declare module 'moment' {
  interface Moment {
    format(format?: string): string;
    toDate(): Date;
    add(amount?: number, unit?: string): Moment;
    subtract(amount?: number, unit?: string): Moment;
    isValid(): boolean;
    valueOf(): number;
    unix(): number;
    utc(): Moment;
    local(): Moment;
    clone(): Moment;
    year(): number;
    year(year: number): Moment;
    month(): number;
    month(month: number): Moment;
    date(): number;
    date(date: number): Moment;
    hour(): number;
    hour(hour: number): Moment;
    minute(): number;
    minute(minute: number): Moment;
    second(): number;
    second(second: number): Moment;
    millisecond(): number;
    millisecond(millisecond: number): Moment;
    isBefore(moment?: Moment | Date | string): boolean;
    isAfter(moment?: Moment | Date | string): boolean;
    isSame(moment?: Moment | Date | string): boolean;
    diff(moment?: Moment | Date | string, unit?: string): number;
    fromNow(): string;
    startOf(unit: string): Moment;
    endOf(unit: string): Moment;
    toISOString(): string;
  }

  interface MomentStatic {
    (date?: Date | string | number | Moment): Moment;
    utc(date?: Date | string | number | Moment): Moment;
    unix(timestamp: number): Moment;
    now(): number;
    isDate(input: any): input is Date;
    isMoment(input: any): input is Moment;
    locale(locale?: string): string;
    tz: any; // moment-timezone functionality
    Moment: Moment; // For namespace access
  }

  namespace moment {
    type MomentInput = Date | string | number | Moment;
    
    interface Moment {
      format(format?: string): string;
      toDate(): Date;
      add(amount?: number, unit?: string): Moment;
      subtract(amount?: number, unit?: string): Moment;
      isValid(): boolean;
      valueOf(): number;
      unix(): number;
      utc(): Moment;
      local(): Moment;
      clone(): Moment;
      year(): number;
      year(year: number): Moment;
      month(): number;
      month(month: number): Moment;
      date(): number;
      date(date: number): Moment;
      hour(): number;
      hour(hour: number): Moment;
      minute(): number;
      minute(minute: number): Moment;
      second(): number;
      second(second: number): Moment;
      millisecond(): number;
      millisecond(millisecond: number): Moment;
      isBefore(moment?: Moment | Date | string): boolean;
      isAfter(moment?: Moment | Date | string): boolean;
      isSame(moment?: Moment | Date | string): boolean;
      diff(moment?: Moment | Date | string, unit?: string): number;
      fromNow(): string;
      startOf(unit: string): Moment;
      endOf(unit: string): Moment;
      toISOString(): string;
    }
  }

  const moment: MomentStatic;
  export = moment;
}