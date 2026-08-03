import { HttpRequest } from '@angular/common/http';
import { credentialsInterceptor } from './credentials.interceptor';

describe('credentialsInterceptor', () => {
  it('clones the request with withCredentials set', () => {
    const req = new HttpRequest('GET', '/api/auth/me');
    const next = jest.fn().mockReturnValue('next-result');

    const result = credentialsInterceptor(req, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ withCredentials: true }));
    expect(result).toBe('next-result');
  });
});
