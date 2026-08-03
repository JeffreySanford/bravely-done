import { HttpInterceptorFn } from '@angular/common/http';

/**
 * The backend authenticates via httpOnly cookies (access_token/refresh_token),
 * not an Authorization header, so every request needs withCredentials so the
 * browser actually attaches them.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};
