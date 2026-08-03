// Jest's node test environment doesn't expose TextEncoder/TextDecoder as
// globals (unlike a real Node runtime), which @prisma/client's runtime needs.
import { TextDecoder, TextEncoder } from 'node:util';

Object.assign(globalThis, { TextEncoder, TextDecoder });

process.env.JWT_SECRET ??= 'test-secret-do-not-use-in-real-environments';
