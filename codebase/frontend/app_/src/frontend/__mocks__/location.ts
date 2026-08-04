export class MockLocation extends URL implements Location {
    ancestorOrigins: any = [];
    toString = jest.fn().mockImplementation(() => this.toString());
    assign = jest.fn(href => (this.href = href));
    replace = jest.fn(href => (this.href = href));
    reload = jest.fn();

    constructor(url: string = 'http://mock.localhost') {
        super(url);
    }

    onWindow(window: Window) {
        Object.defineProperty(window, 'location', {
            writable: true,
            value: this,
        });

        return this;
    }
}
