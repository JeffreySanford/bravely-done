import { isWebglAvailable } from './webgl-support';

describe('isWebglAvailable', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true when a webgl2 context can be created', () => {
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as RenderingContext);
    expect(isWebglAvailable()).toBe(true);
  });

  it('returns false when no context can be created', () => {
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(isWebglAvailable()).toBe(false);
  });

  it('returns false if creating a context throws', () => {
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('no webgl here');
    });
    expect(isWebglAvailable()).toBe(false);
  });
});
